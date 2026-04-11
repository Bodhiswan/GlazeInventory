/**
 * Static catalog data — glazes, combination examples, firing images, and tags.
 *
 * These JSON files are imported at build time and served from the bundle,
 * eliminating Supabase round-trips for catalog reads.
 */

import glazesJson from "../../data/catalog/glazes.json";
import examplesJson from "../../data/catalog/combination-examples.json";
import firingImagesJson from "../../data/catalog/firing-images.json";
import tagsJson from "../../data/catalog/tags.json";
import spectrumLocalImagesJson from "../../data/vendors/spectrum-local-images.json";
import speedballLocalImagesJson from "../../data/vendors/speedball-local-images.json";

import type {
  Glaze,
  GlazeFiringImage,
  GlazeTagSummary,
  VendorCombinationExample,
  VendorCombinationExampleLayer,
} from "@/lib/types";

/* ---------------------------------------------------------------------------
 * Helpers — mirror the mapGlaze / mapVendorCombinationExample logic in data.ts
 * but operate on the already-typed JSON rows.
 * ------------------------------------------------------------------------ */

type CatalogRow = (typeof glazesJson)[number];
type ExampleRow = (typeof examplesJson)[number];
type FiringImageEntry = { id: string; label: string; cone: string | null; atmosphere: string | null; imageUrl: string; sortOrder: number };
type TagRow = (typeof tagsJson)[number];

const SPECTRUM_LOCAL_IMAGES = spectrumLocalImagesJson as Record<string, string>;
const SPEEDBALL_LOCAL_IMAGES = speedballLocalImagesJson as Record<string, string>;

function getBundledVendorImageUrl(brand: string | null, code: string | null) {
  if (brand === "Coyote" && code?.trim()) {
    return `/vendor-images/coyote/${code.toLowerCase()}.jpg`;
  }
  if (brand === "Spectrum" && code?.trim()) {
    return SPECTRUM_LOCAL_IMAGES[code] ?? null;
  }
  if (brand === "Speedball" && code?.trim()) {
    return SPEEDBALL_LOCAL_IMAGES[code] ?? null;
  }
  return null;
}

function normalizeVendorImageUrl(value: string | null) {
  if (!value?.trim()) return null;

  const normalized = value.trim()
    .replace(/ā|â€™|â/g, "'")
    .replace(/ā|ā|â€œ|â€|â|â/g, "")
    .replace(/\s+/g, " ");

  try {
    const parsed = new URL(normalized);
    parsed.pathname = parsed.pathname
      .split("/")
      .map((seg) => {
        if (!seg) return seg;
        try { return encodeURIComponent(decodeURIComponent(seg)); }
        catch { return encodeURIComponent(seg); }
      })
      .join("/");
    return parsed.toString();
  } catch {
    return normalized;
  }
}

function rowToGlaze(row: CatalogRow): Glaze {
  const bundled = getBundledVendorImageUrl(row.brand, row.code);
  // `finishes` / `families` / `brand_line_id` are added by migration
  // 20260411120000 and backfilled into the catalog JSON. Tolerate their
  // absence so older catalog builds still parse.
  const finishes = (row as { finishes?: string[] | null }).finishes ?? undefined;
  const families = (row as { families?: string[] | null }).families ?? undefined;
  const brandLineId = (row as { brand_line_id?: string | null }).brand_line_id ?? null;

  return {
    id: row.id,
    sourceType: row.source_type === "nonCommercial" ? "nonCommercial" : "commercial",
    name: row.name,
    brand: row.brand ?? null,
    line: row.line ?? null,
    code: row.code ?? null,
    cone: row.cone ?? null,
    description: row.description ?? null,
    imageUrl: bundled ?? normalizeVendorImageUrl(row.image_url ?? null),
    editorialSummary: row.editorial_summary ?? null,
    editorialSurface: row.editorial_surface ?? null,
    editorialApplication: row.editorial_application ?? null,
    editorialFiring: row.editorial_firing ?? null,
    editorialReviewedAt: row.editorial_reviewed_at ?? null,
    editorialReviewedByUserId: row.editorial_reviewed_by_user_id ?? null,
    atmosphere: row.atmosphere ?? null,
    finishNotes: row.finish_notes ?? null,
    colorNotes: row.color_notes ?? null,
    recipeNotes: row.recipe_notes ?? null,
    finishes: Array.isArray(finishes) ? finishes : undefined,
    families: Array.isArray(families) ? families : undefined,
    brandLineId,
    createdByUserId: null,
  };
}

/* ---------------------------------------------------------------------------
 * Precomputed indexes — built once at module load (server-side only).
 * ------------------------------------------------------------------------ */

function buildGlazeIndex() {
  const list: Glaze[] = glazesJson.map(rowToGlaze);
  const byId = new Map(list.map((g) => [g.id, g]));
  return { list, byId };
}

const _glazes = buildGlazeIndex();

const _glazeByCode = new Map(
  _glazes.list
    .filter((glaze) => Boolean(glaze.code))
    .map((glaze) => [glaze.code!.toLowerCase(), glaze] as const),
);

function buildExampleIndex() {
  return examplesJson.map((row: ExampleRow) => ({
    id: row.id,
    sourceVendor: row.source_vendor ?? "Mayco",
    sourceCollection: row.source_collection ?? "glaze-combinations",
    sourceKey: row.source_key,
    sourceUrl: row.source_url,
    title: row.title,
    imageUrl: row.image_url,
    cone: row.cone ?? null,
    atmosphere: row.atmosphere ?? null,
    clayBody: row.clay_body ?? null,
    applicationNotes: row.application_notes ?? null,
    firingNotes: row.firing_notes ?? null,
    layers: (row.layers ?? []).map((layer: ExampleRow["layers"][number]) => {
      const glaze = (layer.glaze_id ? _glazes.byId.get(layer.glaze_id) : null)
        ?? (layer.glaze_code ? _glazeByCode.get(layer.glaze_code.toLowerCase()) : null)
        ?? null;

      return {
        id: layer.id,
        exampleId: row.id,
        glazeId: glaze?.id ?? layer.glaze_id ?? null,
        glazeCode: layer.glaze_code ?? null,
        glazeName: layer.glaze_name ?? "",
        layerOrder: layer.layer_order ?? 0,
        connectorToNext: layer.connector_to_next ?? null,
        sourceImageUrl: layer.source_image_url ?? null,
        glaze,
      };
    }),
  }));
}

const _examples = buildExampleIndex();
const _examplesById = new Map(_examples.map((e) => [e.id, e]));


function buildFiringImageIndex() {
  const map = new Map<string, GlazeFiringImage[]>();
  const raw = firingImagesJson as Record<string, FiringImageEntry[]>;
  for (const [glazeId, images] of Object.entries(raw)) {
    map.set(
      glazeId,
      images.map((img) => ({
        id: img.id,
        label: img.label,
        cone: img.cone ?? null,
        atmosphere: img.atmosphere ?? null,
        imageUrl: normalizeVendorImageUrl(img.imageUrl) ?? img.imageUrl,
      })),
    );
  }
  return map;
}

const _firingImages = buildFiringImageIndex();

/* ---------------------------------------------------------------------------
 * Tag definitions (static). Vote counts still come from Supabase.
 * ------------------------------------------------------------------------ */

const _tagDefinitions = tagsJson.map((t: TagRow) => ({
  id: t.id,
  slug: t.slug,
  label: t.label,
  category: t.category,
  description: t.description ?? null,
}));

/* ---------------------------------------------------------------------------
 * Public API — used by data.ts
 * ------------------------------------------------------------------------ */

export function getAllCatalogGlazes(): Glaze[] {
  return _glazes.list;
}

export function getCatalogGlazeById(id: string): Glaze | null {
  return _glazes.byId.get(id) ?? null;
}

export function getCatalogGlazesByIds(ids: string[]): Glaze[] {
  return ids.map((id) => _glazes.byId.get(id)).filter((g): g is Glaze => g != null);
}

export function getCatalogFiringImages(glazeId: string): GlazeFiringImage[] {
  return _firingImages.get(glazeId) ?? [];
}

export function getCatalogFiringImageMap(glazeIds: string[]): Record<string, GlazeFiringImage[]> {
  const result: Record<string, GlazeFiringImage[]> = {};
  for (const id of glazeIds) {
    const images = _firingImages.get(id);
    if (images?.length) result[id] = images;
  }
  return result;
}

export function getAllCatalogFiringImages(): Map<string, GlazeFiringImage[]> {
  return _firingImages;
}

export type StaticExample = ReturnType<typeof buildExampleIndex>[number];

export function getAllVendorExamples(): StaticExample[] {
  return _examples;
}

export function getVendorExampleById(id: string): StaticExample | null {
  return _examplesById.get(id) ?? null;
}

export function getTagDefinitions() {
  return _tagDefinitions;
}
