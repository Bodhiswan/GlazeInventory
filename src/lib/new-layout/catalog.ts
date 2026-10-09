import "server-only";

import vendorVisualTraits from "@data/vendors/vendor-visual-traits.json";
import { getAllCatalogGlazes, getAllVendorExamples, getCatalogFiringImages, getVendorExampleById } from "@/lib/catalog";
import { getStoresForGlaze } from "@/lib/stores";
import type { Glaze, GlazeFiringImage } from "@/lib/types";
import { buildGlazeSearchIndex, extractGlazeColorTraits, extractGlazeFinishTraits, normalizeGlazeSearchText } from "@/lib/utils";
import { isCone6 } from "./cone";
import type { NLCatalog, NLCombo, NLGlaze } from "./types";

type VisualProfile = {
  imageColorWeights?: Record<string, number>;
  imagePalette?: Array<{ hex?: string; weight?: number }>;
};
const visualProfiles = vendorVisualTraits as Record<string, VisualProfile>;

const normalizeCode = (value: string | null | undefined) => (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const clean = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

function shorten(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = cut.lastIndexOf(". ");
  return stop > max * 0.5 ? cut.slice(0, stop + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}

/** Keep only the cone 6 part of vendor copy (Mayco also describes its cone 10 reduction result). */
export function cone6Text(text: string | null | undefined) {
  return clean(text)
    .replace(/^cone\s*6\s*oxidation\s*(\([^)]*\))?\s*:\s*/i, "")
    .replace(/\s*cone\s*10\s*reduction\s*(\([^)]*\))?\s*:[\s\S]*?(?=\bTIP:|$)/i, " ")
    .trim();
}

/**
 * Photos as [url, label]: Cone 6 photos first, then unlabelled ones. The catalogue's main
 * image is often the Cone 10 tile, so it's only used when it isn't labelled as another firing.
 */
export function pickCone6Photos(mainImage: string | null | undefined, images: GlazeFiringImage[]): [string, string][] {
  const mainRecord = images.find((image) => image.imageUrl === mainImage);
  const label = (image: GlazeFiringImage) =>
    image.cone
      ? isCone6(image.cone) ? "Cone 6" : image.cone
      : image.label && !/^example \d+$/i.test(image.label) ? image.label : "Firing not specified";
  const cone6 = images.filter((image) => image.cone && isCone6(image.cone));
  const unlabelled = images.filter((image) => !image.cone);
  const other = images.filter((image) => image.cone && !isCone6(image.cone));
  const out: [string, string][] = [...cone6, ...unlabelled].map((image) => [image.imageUrl, label(image)]);
  if (mainImage && !mainRecord) out.push([mainImage, "Product photo"]);
  if (!out.length) out.push(...other.map((image): [string, string] => [image.imageUrl, label(image)]));
  if (!out.length && mainImage) out.push([mainImage, "Product photo"]);
  return out.filter(([url], index) => out.findIndex(([other]) => other === url) === index).slice(0, 6);
}

/** Converts any glaze (catalogue or a user's own) into the compact shape the layout uses. */
export function toNLGlaze(glaze: Glaze, images: GlazeFiringImage[] = getCatalogFiringImages(glaze.id)): NLGlaze {
  const profile = visualProfiles[`${glaze.brand}|${normalizeCode(glaze.code)}`];
  const description = cone6Text(glaze.description);
  const forTraits = { ...glaze, description };
  const ct = extractGlazeColorTraits(forTraits);
  const ft = extractGlazeFinishTraits(forTraits);
  const weights: Record<string, number> = {};
  for (const [label, weight] of Object.entries(profile?.imageColorWeights ?? {})) {
    if (weight >= 0.01) weights[label] = Math.round(weight * 1000) / 1000;
  }
  const palette = (profile?.imagePalette ?? [])
    .map((entry): [string, number] | null => {
      const hex = (entry.hex ?? "").replace("#", "").toLowerCase();
      const weight = entry.weight ?? 0;
      return /^[0-9a-f]{6}$/.test(hex) && weight > 0 ? [`#${hex}`, Math.round(weight * 1000) / 1000] : null;
    })
    .filter((entry): entry is [string, number] => entry !== null)
    .sort((a, b) => b[1] - a[1]);
  // The description contributes its unique words so the index stays small.
  const descriptionWords = [...new Set(normalizeGlazeSearchText(description).split(" "))].filter((word) => word.length > 1);
  return {
    id: glaze.id,
    brand: glaze.brand ?? "",
    code: glaze.code ?? "",
    name: clean(glaze.name),
    line: glaze.line && glaze.line !== glaze.name ? clean(glaze.line) : "",
    cone: glaze.cone ?? null,
    cone6: isCone6(glaze.cone),
    ...(glaze.sourceType === "nonCommercial" ? { custom: true } : {}),
    ct,
    ft,
    w: weights,
    pal: palette,
    s: `${buildGlazeSearchIndex([glaze.code, glaze.name, glaze.brand, glaze.line, glaze.cone, ct.join(" "), ft.join(" ")])} ${descriptionWords.join(" ")}`,
    photos: pickCone6Photos(glaze.imageUrl, images),
    buy: glaze.sourceType === "commercial" ? getStoresForGlaze(glaze).map((store) => store.id) : [],
    desc: shorten(cone6Text(glaze.editorialSummary || glaze.description), 420),
  };
}

let cached: NLCatalog | null = null;

/** The Cone 6 catalogue: commercial glazes that fire at cone 5–6, and vendor combos whose layers are all in it. */
export function getCone6Catalog(): NLCatalog {
  if (cached) return cached;
  const glazes = getAllCatalogGlazes()
    .filter((glaze) => glaze.sourceType === "commercial" && glaze.name && isCone6(glaze.cone))
    .map((glaze) => toNLGlaze(glaze))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.code.localeCompare(b.code, undefined, { numeric: true }));
  const ids = new Set(glazes.map((glaze) => glaze.id));
  const combos: NLCombo[] = [];
  for (const example of getAllVendorExamples()) {
    if (!isCone6(example.cone) || !example.imageUrl) continue;
    const layers = [...example.layers].sort((a, b) => a.layerOrder - b.layerOrder);
    if (layers.length < 2 || !layers.every((layer) => layer.glazeId && ids.has(layer.glazeId))) continue;
    combos.push({
      id: example.id,
      title: clean(example.title).replace(/\s*\(Cone \d+\)\s*$/i, ""),
      image: example.imageUrl,
      vendor: example.sourceVendor,
      url: example.sourceUrl || null,
      clay: clean(example.clayBody) || null,
      notes: example.applicationNotes ? shorten(clean(example.applicationNotes), 360) : null,
      firing: example.firingNotes ? shorten(clean(example.firingNotes), 360) : null,
      layers: layers.map((layer) => ({ g: layer.glazeId as string, to: layer.connectorToNext ?? null })),
    });
  }
  cached = { glazes, combos };
  return cached;
}

/** A vendor combo for its own page. Works for any cone so old links keep working; returns the layer glazes too. */
export function getNLComboForPage(id: string): { combo: NLCombo; glazes: NLGlaze[] } | null {
  const catalog = getCone6Catalog();
  const known = catalog.combos.find((combo) => combo.id === id);
  if (known) return { combo: known, glazes: [] };
  const example = getVendorExampleById(id);
  if (!example) return null;
  const layers = [...example.layers].sort((a, b) => a.layerOrder - b.layerOrder).filter((layer) => layer.glaze);
  if (!layers.length) return null;
  const catalogIds = new Set(catalog.glazes.map((glaze) => glaze.id));
  const glazes = layers.filter((layer) => !catalogIds.has(layer.glaze!.id)).map((layer) => toNLGlaze(layer.glaze!));
  return {
    combo: {
      id: example.id,
      title: clean(example.title),
      image: example.imageUrl || null,
      vendor: example.sourceVendor,
      url: example.sourceUrl || null,
      clay: clean(example.clayBody) || null,
      notes: example.applicationNotes ? clean(example.applicationNotes) : null,
      firing: example.firingNotes ? clean(example.firingNotes) : null,
      layers: layers.map((layer) => ({ g: layer.glaze!.id, to: layer.connectorToNext ?? null })),
      ...(isCone6(example.cone) ? {} : { cone: example.cone ?? "Cone not recorded" }),
    },
    glazes,
  };
}
