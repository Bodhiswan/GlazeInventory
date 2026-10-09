/**
 * Search and "true colour" ranking for the Cone 6 layout. Client-safe.
 *
 * The rules mirror src/lib/utils.ts (matchesGlazeSearch, extractColorAwareQuery,
 * getGlazeColorMatchScore, getGlazeColorFlowPosition) but run on the compact
 * NLGlaze shape, so the browser doesn't need the vendor trait files.
 */
import type { NLCombo, NLGlaze } from "./types";

export const COLOR_SWATCH: Record<string, string> = {
  White: "#f7f2ea", Cream: "#ebe1bf", Clear: "#d7d7d7", Black: "#2a221e", Grey: "#8a8580", Silver: "#b7bcc3", Gold: "#c7a34c",
  Brown: "#8b5a35", Amber: "#b1732f", Tan: "#c59d73", Beige: "#d5c1a1", Red: "#c63f37", Burgundy: "#7e2c33", Maroon: "#6b2327",
  Orange: "#d7791f", Coral: "#e27b64", Yellow: "#d5b11f", Green: "#5e9f4a", Olive: "#6c7a39", Sage: "#8ca686", Teal: "#2f8f8d",
  Turquoise: "#2fa7a0", Aqua: "#67c5d8", Blue: "#356fcf", Navy: "#27407f", Indigo: "#4c4d9d", Purple: "#7f4cc9", Lavender: "#a98acf", Pink: "#cb5b94",
};

/** Each colour chip and the shades it covers (colorSmartGroups). */
export const COLOR_GROUPS: Record<string, string[]> = {
  White: ["White", "Cream", "Clear"], Cream: ["Cream", "White", "Beige", "Tan"], Grey: ["Grey", "Silver", "Black"],
  Brown: ["Brown", "Amber", "Tan", "Beige", "Gold"], Red: ["Red", "Maroon", "Burgundy", "Pink", "Coral"], Pink: ["Pink", "Coral", "Lavender", "Burgundy"],
  Orange: ["Orange", "Coral", "Amber", "Gold"], Yellow: ["Yellow", "Gold", "Amber"], Green: ["Green", "Olive", "Sage", "Teal", "Turquoise"],
  Blue: ["Blue", "Navy", "Indigo", "Teal", "Turquoise", "Aqua"], Teal: ["Teal", "Turquoise", "Aqua", "Blue", "Green"], Purple: ["Purple", "Lavender", "Indigo", "Burgundy", "Pink"],
};
export const COLOURS = Object.keys(COLOR_GROUPS);

const COLOR_ANGLE: Record<string, number> = {
  Red: 0, Burgundy: 346, Maroon: 352, Orange: 28, Coral: 14, Yellow: 58, Green: 120, Teal: 176, Turquoise: 188, Aqua: 198,
  Blue: 222, Navy: 232, Indigo: 248, Purple: 272, Lavender: 300, Pink: 322,
};

export const FINISH_GROUPS: Record<string, string[]> = {
  Glossy: ["Glossy", "Transparent", "Translucent"], Matte: ["Matte", "Satin"], Satin: ["Satin", "Matte"],
  Textured: ["Textured", "Crackle", "Crystalline"], Crystalline: ["Crystalline", "Textured"],
};
export const FINISHES = Object.keys(FINISH_GROUPS);

const COLOUR_WORDS: Record<string, string> = {
  white: "White", cream: "Cream", ivory: "Cream", clear: "Clear", black: "Black", grey: "Grey", gray: "Grey", silver: "Silver",
  gold: "Gold", brown: "Brown", amber: "Amber", tan: "Tan", beige: "Beige", red: "Red", burgundy: "Burgundy", maroon: "Maroon",
  orange: "Orange", coral: "Coral", yellow: "Yellow", chartreuse: "Green", green: "Green", olive: "Olive", sage: "Sage",
  teal: "Teal", turquoise: "Turquoise", aqua: "Aqua", blue: "Blue", navy: "Navy", indigo: "Indigo", purple: "Purple",
  lavender: "Lavender", pink: "Pink",
};

/** Default browse order starts the colour wheel here (GLAZE_GRADIENT_HUE_OFFSET). */
const HUE_OFFSET = 0.173;

const unique = <T,>(values: T[]) => [...new Set(values.filter(Boolean))];
export const normText = (value: string | null | undefined) =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
export const compactText = (value: string | null | undefined) => (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** matchesGlazeSearch: every word must appear, or the squashed query must ("sw116" finds "SW-116"). */
export function matchesSearch(index: string, query: string) {
  const normalized = normText(query);
  const compact = compactText(query);
  if (!normalized && !compact) return true;
  if (normalized && normalized.split(" ").every((token) => index.includes(token))) return true;
  return compact.length >= 2 && index.includes(compact);
}

/** extractColorAwareQuery: colour words rank results by the photo's colours; the rest is text search. */
export function colourAwareQuery(query: string) {
  const colours: string[] = [];
  const text: string[] = [];
  for (const token of normText(query).split(" ").filter(Boolean)) {
    if (COLOUR_WORDS[token]) colours.push(COLOUR_WORDS[token]);
    else text.push(token);
  }
  return { colours: unique(colours), text: text.join(" ") };
}

export function matchesSmart(traits: string[], selected: string[], groups: Record<string, string[]>) {
  return !selected.length || selected.some((choice) => (groups[choice] ?? [choice]).some((value) => traits.includes(value)));
}

const labCache = new Map<string, [number, number, number]>();
function lab(hex: string): [number, number, number] {
  const hit = labCache.get(hex);
  if (hit) return hit;
  const raw = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(raw.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const f = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const fx = f((r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047);
  const fy = f(r * 0.2126729 + g * 0.7151522 + b * 0.072175);
  const fz = f((r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883);
  const out: [number, number, number] = [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  labCache.set(hex, out);
  return out;
}
const labDistance = (a: string, b: string) => {
  const x = lab(a);
  const y = lab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

/** getPaletteColorSimilarityScore */
function paletteScore(target: string, palette: [string, number][]) {
  if (!palette.length) return 0;
  const best = Math.max(...palette.map(([hex, weight]) => weight * Math.max(0, 1 - labDistance(target, hex) / 88)));
  const blend = palette.reduce((total, [hex, weight]) => total + weight * Math.max(0, 1 - labDistance(target, hex) / 110), 0);
  return best * 1.35 + blend * 0.85;
}

/** getLegacyGlazeColorMatchScore: for glazes without a sampled palette. */
function legacyScore(glaze: NLGlaze, selected: string) {
  const weights = Object.fromEntries(Object.entries(glaze.w).filter(([label]) => label !== "White"));
  const allowed = COLOR_GROUPS[selected] ?? [selected];
  const target = COLOR_ANGLE[selected];
  const near = (label: string, spread: number) => {
    const angle = COLOR_ANGLE[label];
    return target === undefined || angle === undefined ? null : Math.max(0, 1 - Math.abs(((angle - target + 540) % 360) - 180) / spread);
  };
  const related = Math.max(0, ...allowed.filter((label) => label !== selected).map((label) => {
    const weight = weights[label] ?? 0;
    if (!weight) return 0;
    const similarity = near(label, 120);
    return similarity === null ? weight * 0.68 : weight * (0.58 + similarity * 0.24);
  }));
  const adjacent = Math.max(0, ...Object.entries(weights).map(([label, weight]) => {
    if (allowed.includes(label)) return 0;
    const similarity = near(label, 90);
    return similarity === null ? 0 : weight * similarity * 0.35;
  }));
  const text = glaze.ct.includes(selected) ? 0.04 : allowed.some((colour) => glaze.ct.includes(colour)) ? 0.015 : 0;
  return (weights[selected] ?? 0) * 1.35 + related + adjacent + text;
}

/** getGlazeColorMatchScore */
export function colourScore(glaze: NLGlaze, selected: string[]) {
  return selected.reduce((total, choice) => {
    const text = glaze.ct.includes(choice) ? 0.045 : (COLOR_GROUPS[choice] ?? [choice]).some((colour) => glaze.ct.includes(colour)) ? 0.02 : 0;
    const photo = glaze.pal.length ? paletteScore(COLOR_SWATCH[choice] ?? "#d8c6b8", glaze.pal) : legacyScore(glaze, choice);
    return total + photo + text;
  }, 0);
}

/** getGlazeColorPalette: named colours found in the photo (falls back to colour words). */
export function namedPalette(glaze: NLGlaze): [string, number][] {
  const fromPhoto = Object.entries(glaze.w)
    .filter(([label, weight]) => label !== "White" && weight >= 0.03)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return fromPhoto.length ? fromPhoto : glaze.ct.slice(0, 4).map((label): [string, number] => [label, 0]);
}

export interface FlowPosition { bucket: number; pos: number; light: number }

/** getGlazeColorFlowPosition: places each glaze on the colour wheel for the default browse order. */
export function flowPosition(glaze: NLGlaze): FlowPosition {
  const hsv = (label: string) => {
    const raw = (COLOR_SWATCH[label] ?? "#d8c6b8").slice(1);
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);
    let hue = 0;
    if (delta) hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    return { chromatic: (max ? delta / max : 0) >= 0.12, hue: ((hue * 60 + 360) % 360) / 360, value: max };
  };
  const palette = namedPalette(glaze);
  if (!palette.length) return { bucket: 2, pos: 1, light: 1 };
  let x = 0, y = 0, chromaticWeight = 0, neutralLight = 0, neutralWeight = 0, light = 0;
  for (const [label, rawWeight] of palette) {
    const meta = hsv(label);
    const weight = rawWeight || 0.1;
    light += meta.value * weight;
    if (meta.chromatic) {
      x += Math.cos(meta.hue * 2 * Math.PI) * weight;
      y += Math.sin(meta.hue * 2 * Math.PI) * weight;
      chromaticWeight += weight;
    } else {
      neutralLight += meta.value * weight;
      neutralWeight += weight;
    }
  }
  if (chromaticWeight > 0) {
    return { bucket: 0, pos: ((((Math.atan2(y, x) / (2 * Math.PI)) + 1) % 1) + HUE_OFFSET) % 1, light: light / palette.length };
  }
  return { bucket: 1, pos: neutralLight / neutralWeight, light: neutralLight / neutralWeight };
}

export const compareFlow = (a: FlowPosition, b: FlowPosition) =>
  a.bucket - b.bucket || a.pos - b.pos || b.light - a.light;

/** CSS background used behind photos and when a photo can't load. */
export function swatch(glaze: NLGlaze) {
  const colours = glaze.pal.length
    ? glaze.pal.map(([hex]) => hex).slice(0, 3)
    : namedPalette(glaze).map(([label]) => COLOR_SWATCH[label]).filter(Boolean).slice(0, 3);
  if (!colours.length) return "var(--nl-panel)";
  if (colours.length === 1) return `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${colours[0]} 70%, white), ${colours[0]} 70%)`;
  return `radial-gradient(circle at 28% 22%, color-mix(in srgb, ${colours[0]} 65%, white) 0, ${colours[0]} 38%, transparent 70%), linear-gradient(160deg, ${colours.join(", ")})`;
}

export function comboSwatch(combo: NLCombo, byId: Map<string, NLGlaze>) {
  const colours = combo.layers.map((layer) => {
    const glaze = byId.get(layer.g);
    return (glaze && (glaze.pal[0]?.[0] ?? COLOR_SWATCH[glaze.ct[0]])) || "#999999";
  });
  const step = 100 / colours.length;
  return `linear-gradient(180deg, ${colours.map((colour, i) => `${colour} ${i * step}%, ${colour} ${(i + 1) * step}%`).join(", ")})`;
}

// ---------- Combination search ----------

/** A code-shaped query ("PC-20", "sw116") must equal one layer's code, so "PC" and "20" can't come from different layers. */
const CODE_LIKE = /^[a-z]{1,5}[-\s]?\d+[a-z]?$/i;

function layerMatches(glaze: NLGlaze | undefined, text: string) {
  if (!glaze) return false;
  return CODE_LIKE.test(text.trim()) ? compactText(glaze.code) === compactText(text) : matchesSearch(glaze.s, text);
}

export function comboMatches(combo: NLCombo, byId: Map<string, NLGlaze>, text: string) {
  if (CODE_LIKE.test(text.trim())) return combo.layers.some((layer) => layerMatches(byId.get(layer.g), text));
  const index = combo.layers.map((layer) => byId.get(layer.g)?.s ?? "").join(" ");
  return matchesSearch(index, text);
}

/** Two glazes: each must match a different layer. */
export function comboMatchesPair(combo: NLCombo, byId: Map<string, NLGlaze>, first: string, second: string) {
  if (!first) return combo.layers.some((layer) => layerMatches(byId.get(layer.g), second));
  return combo.layers.some((layer, i) =>
    layerMatches(byId.get(layer.g), first) &&
    combo.layers.some((other, j) => j !== i && layerMatches(byId.get(other.g), second)));
}
