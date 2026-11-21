import "server-only";

import { getCatalogGlazeById } from "@/lib/catalog";
import { getGlazeFamilyTraits } from "@/lib/glaze-metadata";
import { colourScore, COLOR_GROUPS, compareFlow, FINISH_GROUPS, flowPosition, matchesSmart } from "./colour";
import { getCone6Catalog } from "./catalog";
import type { NLCombo, NLGlaze } from "./types";

/**
 * Browse pages at /cone-6-glazes/[slug]: one page per colour, finish, glaze type, brand
 * and product line. They exist so that searches like "blue cone 6 glazes" or
 * "AMACO Potter's Choice glazes" land on a page of real results, and so every glaze
 * page is reachable through plain links.
 *
 * Everything here is worked out from the catalogue, so counts and lists stay right
 * as glazes are added.
 */

export type CollectionKind = "colour" | "finish" | "type" | "brand" | "line";

export interface CollectionSummary {
  slug: string;
  kind: CollectionKind;
  /** Short name for links and chips, e.g. "Blue" or "Potter's Choice". */
  label: string;
  /** Page heading, e.g. "Blue Cone 6 Glazes". */
  title: string;
  count: number;
  /** Colour chip swatch, for colour pages. */
  colour?: string;
}

export interface Collection extends CollectionSummary {
  metaTitle: string;
  metaDescription: string;
  /** How the list is ordered, in plain words. */
  orderNote: string;
  /** One or two sentences specific to this page. */
  blurb: string;
  /** All matching glazes, best first. */
  glazes: NLGlaze[];
  /** Where the same list lives in the library, with filters applied. */
  libraryHref: string;
  /** Manufacturer combinations that use at least one of these glazes. */
  combos: NLCombo[];
  comboTotal: number;
  facts: { brands: [string, number][]; colours: [string, number][]; finishes: [string, number][]; withCombos: number };
  related: CollectionSummary[];
}

/** How many glaze tiles a browse page renders. The rest are one click away in the library. */
export const COLLECTION_PAGE_SIZE = 96;
const MIN_BRAND = 12;
const MIN_LINE = 10;

type Entry = { glaze: NLGlaze; families: string[]; text: string };

interface Definition {
  slug: string;
  kind: CollectionKind;
  label: string;
  title: string;
  blurb: string;
  orderNote: string;
  libraryHref: string;
  match: (entry: Entry) => boolean;
  /** Rank by photo colour instead of the default colour-wheel order. */
  rankColours?: string[];
  /** Rank by how many combinations use the glaze. */
  rankByCombos?: boolean;
  colour?: string;
  metaTitle?: (count: number) => string;
  metaDescription?: (count: number) => string;
}

const slugify = (value: string) =>
  value.toLowerCase().replace(/[’'®™]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const COLOUR_PAGES: { colour: string; slug?: string; title?: string; blurb: string }[] = [
  { colour: "Blue", blurb: "From pale celadon blues to deep cobalt and floating blues that break over texture." },
  { colour: "Green", blurb: "Celadon greens, copper greens, olives and bright apple greens." },
  { colour: "White", blurb: "Whites, creams and clears, from flat matte whites to glossy liner whites." },
  { colour: "Black", slug: "black", blurb: "Gloss blacks, matte blacks and near-black tenmoku and oil-spot glazes." },
  { colour: "Red", blurb: "True reds, oxbloods, maroons and deep burgundies." },
  { colour: "Purple", blurb: "Purples, plums, lavenders and indigos." },
  { colour: "Pink", blurb: "Soft pinks, corals and roses." },
  { colour: "Yellow", blurb: "Yellows, golds and warm ambers." },
  { colour: "Orange", blurb: "Oranges, corals and burnt ambers." },
  { colour: "Brown", blurb: "Browns, ambers, tans and iron-rich earth tones." },
  { colour: "Teal", title: "Teal & Turquoise Cone 6 Glazes", blurb: "Teals, turquoises and aquas, between blue and green." },
  { colour: "Grey", title: "Grey Cone 6 Glazes", blurb: "Greys (grays), silvers and soft charcoal glazes." },
];

const FINISH_PAGES: { finish: string; blurb: string }[] = [
  { finish: "Matte", blurb: "Glazes the manufacturer describes as matte or satin: a flat, low-shine surface rather than a glassy one." },
  { finish: "Satin", blurb: "Glazes the manufacturer describes as satin or matte: a soft sheen between flat matte and full gloss." },
  { finish: "Glossy", blurb: "Glazes the manufacturer describes as glossy, transparent or translucent: a smooth, glassy surface." },
];

/** Colour and finish together, for searches like "matte white glaze cone 6". */
const COLOUR_FINISH_PAGES: [string, string][] = [
  ["Matte", "White"], ["Matte", "Black"], ["Matte", "Blue"], ["Matte", "Green"], ["Glossy", "White"], ["Glossy", "Black"],
];

const inNameOrLine = (pattern: RegExp) => ({ glaze }: Entry) => pattern.test(`${glaze.name} ${glaze.line}`);
const hasFamily = (...families: string[]) => (entry: Entry) => families.some((family) => entry.families.includes(family));

const TYPE_PAGES: Omit<Definition, "kind" | "orderNote" | "libraryHref">[] = [
  {
    slug: "celadon", label: "Celadon", title: "Cone 6 Celadon Glazes",
    blurb: "Glazes sold as celadons: translucent colour that pools darker in carving and texture and thins over edges.",
    match: (entry) => hasFamily("Celadon")(entry) || inNameOrLine(/celadon/i)(entry),
  },
  {
    slug: "shino", label: "Shino", title: "Cone 6 Shino Glazes",
    blurb: "Glazes sold as shinos for midfire electric kilns, including the shino lines made for layering.",
    match: (entry) => hasFamily("Shino")(entry) || inNameOrLine(/shino/i)(entry),
  },
  {
    slug: "floating", label: "Floating", title: "Floating Cone 6 Glazes",
    blurb: "Floating glazes, including the floating blues: variegated colour that moves and breaks over texture.",
    match: inNameOrLine(/float/i),
  },
  {
    slug: "speckled", label: "Speckled", title: "Speckled Cone 6 Glazes",
    blurb: "Glazes with speckle built in, so you get a flecked surface on a smooth clay body.",
    match: inNameOrLine(/speckle/i),
  },
  {
    slug: "clear", label: "Clear", title: "Clear Cone 6 Glazes",
    blurb: "Clear glazes for covering underglaze, slip and bare clay, in gloss, satin and matte.",
    match: inNameOrLine(/\bclear\b/i),
  },
  {
    slug: "crackle-and-crawl", label: "Crackle & crawl", title: "Crackle & Crawl Cone 6 Glazes",
    blurb: "Glazes made to crackle, crawl or bead up into texture. Mostly decorative: check the label before using one on a food surface.",
    match: hasFamily("Crawl / crackle"),
  },
  {
    slug: "underglaze", label: "Underglaze", title: "Underglazes for Cone 6",
    blurb: "Underglazes rated to cone 5–6: colour you paint on and usually cover with a clear glaze.",
    match: hasFamily("Underglaze", "Translucent underglaze"),
  },
  {
    slug: "reactive", label: "Reactive & flowing", title: "Reactive & Flowing Cone 6 Glazes",
    blurb: "Product lines built for movement and variation: glazes that break, pool, flow and react when layered.",
    match: hasFamily("Reactive effects"),
    rankByCombos: true,
  },
  {
    slug: "best-for-layering", label: "Best for layering", title: "Best Cone 6 Glazes for Layering",
    blurb: "The glazes that appear in the most published manufacturer combinations, most-layered first. A count of test tiles, not an opinion.",
    match: () => true,
    rankByCombos: true,
  },
];

let cache: { all: Collection[]; bySlug: Map<string, Collection>; byGlaze: Map<string, CollectionSummary[]>; comboCount: Map<string, number> } | null = null;

const summaryOf = ({ slug, kind, label, title, count, colour }: Collection): CollectionSummary => ({ slug, kind, label, title, count, ...(colour ? { colour } : {}) });

function tally(values: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function build() {
  const catalog = getCone6Catalog();
  const entries: Entry[] = catalog.glazes.map((glaze) => {
    const raw = getCatalogGlazeById(glaze.id);
    return { glaze, families: raw ? getGlazeFamilyTraits(raw) : [], text: `${glaze.name} ${glaze.line}` };
  });
  const flow = new Map(catalog.glazes.map((glaze) => [glaze.id, flowPosition(glaze)]));
  const byFlow = (a: NLGlaze, b: NLGlaze) => compareFlow(flow.get(a.id)!, flow.get(b.id)!) || a.id.localeCompare(b.id);

  const comboCount = new Map<string, number>();
  const combosByGlaze = new Map<string, NLCombo[]>();
  for (const combo of catalog.combos) {
    for (const id of new Set(combo.layers.map((layer) => layer.g))) {
      comboCount.set(id, (comboCount.get(id) ?? 0) + 1);
      combosByGlaze.set(id, [...(combosByGlaze.get(id) ?? []), combo]);
    }
  }

  const definitions: Definition[] = [];

  for (const page of COLOUR_PAGES) {
    const colour = page.colour;
    definitions.push({
      slug: page.slug ?? slugify(colour),
      kind: "colour",
      label: colour,
      title: page.title ?? `${colour} Cone 6 Glazes`,
      blurb: page.blurb,
      colour,
      orderNote: `Ranked by how much ${colour.toLowerCase()} is in each manufacturer's fired photo, so the truest ${colour.toLowerCase()}s come first whatever the jar is called.`,
      libraryHref: `/glazes?c=${encodeURIComponent(colour)}`,
      match: ({ glaze }) => matchesSmart(glaze.ct, [colour], COLOR_GROUPS),
      rankColours: [colour],
    });
  }

  for (const page of FINISH_PAGES) {
    definitions.push({
      slug: slugify(page.finish),
      kind: "finish",
      label: page.finish,
      title: `${page.finish} Cone 6 Glazes`,
      blurb: page.blurb,
      orderNote: "Arranged by colour, from the glaze photos.",
      libraryHref: `/glazes?f=${encodeURIComponent(page.finish)}`,
      match: ({ glaze }) => matchesSmart(glaze.ft, [page.finish], FINISH_GROUPS),
    });
  }

  for (const [finish, colour] of COLOUR_FINISH_PAGES) {
    definitions.push({
      slug: slugify(`${finish} ${colour}`),
      kind: "finish",
      label: `${finish} ${colour.toLowerCase()}`,
      title: `${finish} ${colour} Cone 6 Glazes`,
      blurb: `Glazes described as ${finish.toLowerCase()} that also fire ${colour.toLowerCase()}.`,
      colour,
      orderNote: `Ranked by how much ${colour.toLowerCase()} is in each manufacturer's fired photo.`,
      libraryHref: `/glazes?c=${encodeURIComponent(colour)}&f=${encodeURIComponent(finish)}`,
      // The exact finish word, so a "matte white" page doesn't fill with satins and clears.
      match: ({ glaze }) => glaze.ft.includes(finish) && matchesSmart(glaze.ct, [colour], COLOR_GROUPS),
      rankColours: [colour],
    });
  }

  for (const page of TYPE_PAGES) {
    definitions.push({
      ...page,
      kind: "type",
      orderNote: page.rankByCombos ? "Most-layered first: ranked by the number of manufacturer combinations each glaze appears in." : "Arranged by colour, from the glaze photos.",
      libraryHref: page.slug === "best-for-layering" ? "/glazes?sort=combos" : page.slug === "reactive" ? "/glazes" : `/glazes?q=${encodeURIComponent(page.label.split(" ")[0].toLowerCase())}`,
    });
  }

  const brands = tally(entries.map((entry) => entry.glaze.brand)).filter(([, count]) => count >= MIN_BRAND);
  for (const [brand] of brands) {
    definitions.push({
      slug: slugify(brand),
      kind: "brand",
      label: brand,
      title: `${brand} Cone 6 Glazes`,
      blurb: `Every ${brand} glaze in the library that the maker rates for cone 5–6.`,
      orderNote: "Arranged by colour, from the glaze photos.",
      libraryHref: `/glazes?b=${encodeURIComponent(brand)}`,
      match: ({ glaze }) => glaze.brand === brand,
    });
  }

  const lines = tally(entries.filter((entry) => entry.glaze.line).map((entry) => `${entry.glaze.brand}\u0000${entry.glaze.line}`)).filter(([, count]) => count >= MIN_LINE);
  for (const [key] of lines) {
    const [brand, line] = key.split("\u0000");
    // Some catalogues repeat the brand in the line name ("Bath Potters Stoneware Brush-On Glazes").
    const lineName = line.toLowerCase().startsWith(brand.toLowerCase()) ? line.slice(brand.length).trim() : line;
    const cleanLine = lineName.replace(/[®™]/g, "");
    const named = /glaze|underglaze|slip|engobe|colou?r/i.test(cleanLine) ? cleanLine : `${cleanLine} Glazes`;
    const slug = slugify(`${brand} ${cleanLine}`);
    if (definitions.some((definition) => definition.slug === slug)) continue;
    definitions.push({
      slug,
      kind: "line",
      label: `${brand} ${cleanLine}`,
      title: `${brand} ${named}`,
      blurb: `The ${brand} ${cleanLine} range at cone 5–6, with the fired result for each colour.`,
      orderNote: "Arranged by colour, from the glaze photos.",
      libraryHref: `/glazes?b=${encodeURIComponent(brand)}&q=${encodeURIComponent(cleanLine)}`,
      match: ({ glaze }) => glaze.brand === brand && glaze.line === line,
      metaTitle: (count) => `${brand} ${named}: All ${count} Cone 5–6 Colours`,
      metaDescription: (count) => `All ${count} ${brand} ${named.replace(/ Glazes$/, "")} glazes for cone 5–6 with fired photos, the layering combinations each one appears in, and where to buy them.`,
    });
  }

  const all: Collection[] = [];
  for (const definition of definitions) {
    const matched = entries.filter(definition.match).map((entry) => entry.glaze);
    let glazes: NLGlaze[];
    if (definition.rankColours) {
      const scores = new Map(matched.map((glaze) => [glaze.id, colourScore(glaze, definition.rankColours!)]));
      glazes = [...matched].sort((a, b) => scores.get(b.id)! - scores.get(a.id)! || a.name.localeCompare(b.name));
    } else if (definition.rankByCombos) {
      glazes = matched.filter((glaze) => comboCount.has(glaze.id)).sort((a, b) => comboCount.get(b.id)! - comboCount.get(a.id)! || byFlow(a, b));
    } else {
      glazes = [...matched].sort(byFlow);
    }
    if (glazes.length < 6) continue;

    const ids = new Set(glazes.map((glaze) => glaze.id));
    const comboIds = new Set<string>();
    const combos: NLCombo[] = [];
    // One combination per glaze first, so the strip shows variety rather than one glaze twelve times.
    for (const glaze of glazes) {
      const next = (combosByGlaze.get(glaze.id) ?? []).find((combo) => !comboIds.has(combo.id) && combo.image);
      if (next) { comboIds.add(next.id); combos.push(next); }
      if (combos.length >= 8) break;
    }
    const comboTotal = catalog.combos.filter((combo) => combo.layers.some((layer) => ids.has(layer.g))).length;
    const count = glazes.length;

    all.push({
      slug: definition.slug,
      kind: definition.kind,
      label: definition.label,
      title: definition.title,
      count,
      ...(definition.colour ? { colour: definition.colour } : {}),
      // Colour matching is deliberately generous (a teal counts as a blue), so colour pages don't lead with a count.
      metaTitle: definition.metaTitle?.(count)
        ?? (definition.rankColours ? `${definition.title}: Fired Photos, Combinations & Where to Buy` : `${definition.title}: ${count} Compared with Fired Photos`),
      metaDescription: definition.metaDescription?.(count)
        ?? `${definition.title}: compare ${definition.rankColours ? "" : `${count} `}commercial glazes from ${tally(glazes.map((glaze) => glaze.brand)).slice(0, 3).map(([brand]) => brand).join(", ")} and more. See each fired result, the combinations it's used in, and where to buy it.`,
      orderNote: definition.orderNote,
      blurb: definition.blurb,
      glazes,
      libraryHref: definition.libraryHref,
      combos,
      comboTotal,
      facts: {
        brands: tally(glazes.map((glaze) => glaze.brand)),
        colours: tally(glazes.flatMap((glaze) => Object.entries(glaze.w).sort((a, b) => b[1] - a[1]).slice(0, 1).map(([label]) => label))).filter(([label]) => label !== "White" || definition.colour === "White"),
        finishes: tally(glazes.flatMap((glaze) => glaze.ft)),
        withCombos: glazes.filter((glaze) => comboCount.has(glaze.id)).length,
      },
      related: [],
    });
  }

  const bySlug = new Map(all.map((collection) => [collection.slug, collection]));

  // Which pages each glaze belongs to: its line, its brand, then its strongest colour and finish.
  const byGlaze = new Map<string, CollectionSummary[]>();
  const membership = new Map<string, Collection[]>();
  for (const collection of all) {
    if (collection.slug === "best-for-layering" || collection.slug === "reactive") continue;
    for (const glaze of collection.glazes) membership.set(glaze.id, [...(membership.get(glaze.id) ?? []), collection]);
  }
  const kindOrder: CollectionKind[] = ["line", "brand", "type", "colour", "finish"];
  for (const glaze of catalog.glazes) {
    const mine = membership.get(glaze.id) ?? [];
    const colours = mine
      .filter((collection) => collection.kind === "colour")
      .sort((a, b) => colourScore(glaze, [b.colour!]) - colourScore(glaze, [a.colour!]))
      .slice(0, 2);
    const finishes = mine.filter((collection) => collection.kind === "finish" && !collection.colour).slice(0, 1);
    const picked = [...mine.filter((collection) => collection.kind === "line" || collection.kind === "brand" || collection.kind === "type"), ...colours, ...finishes]
      .sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind));
    byGlaze.set(glaze.id, picked.map(summaryOf));
  }

  for (const collection of all) {
    const sameKind = all.filter((other) => other.kind === collection.kind && other.slug !== collection.slug);
    let related: Collection[];
    if (collection.kind === "line") {
      const brand = collection.glazes[0]?.brand;
      related = [
        ...all.filter((other) => other.kind === "brand" && other.label === brand),
        ...sameKind.filter((other) => other.glazes[0]?.brand === brand),
      ];
    } else if (collection.kind === "brand") {
      related = [...all.filter((other) => other.kind === "line" && other.glazes[0]?.brand === collection.label), ...sameKind.slice(0, 6)];
    } else if (collection.colour && collection.kind === "finish") {
      related = all.filter((other) => other.slug !== collection.slug && (other.colour === collection.colour || (other.kind === "finish" && collection.title.startsWith(other.label))));
    } else {
      related = [...sameKind, ...all.filter((other) => other.kind !== collection.kind && other.colour && other.colour === collection.colour)];
    }
    collection.related = related.slice(0, 14).map(summaryOf);
  }

  return { all, bySlug, byGlaze, comboCount };
}

const data = () => (cache ??= build());

export function getCollections(): CollectionSummary[] {
  return data().all.map(summaryOf);
}

export function getCollection(slug: string): Collection | null {
  return data().bySlug.get(slug) ?? null;
}

/** Browse pages a glaze belongs to, most specific first. */
export function getCollectionsForGlaze(glazeId: string): CollectionSummary[] {
  return data().byGlaze.get(glazeId) ?? [];
}

/** How many manufacturer combinations use this glaze. */
export function getComboCount(glazeId: string): number {
  return data().comboCount.get(glazeId) ?? 0;
}

export const COLLECTION_KIND_HEADINGS: Record<CollectionKind, string> = {
  colour: "By colour",
  finish: "By finish",
  type: "By type",
  brand: "By brand",
  line: "By product line",
};
