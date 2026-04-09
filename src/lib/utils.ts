import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import vendorVisualTraits from "@data/vendors/vendor-visual-traits.json";
import type { Glaze, GlazeFiringImage } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGlazeLabel(glaze: Glaze) {
  if (glaze.brand && glaze.code) {
    return `${glaze.brand} ${glaze.code} ${glaze.name}`;
  }

  if (glaze.brand) {
    return `${glaze.brand} ${glaze.name}`;
  }

  return glaze.name;
}

export function formatGlazeMeta(glaze: Glaze) {
  const parts = [glaze.line, glaze.cone, glaze.atmosphere].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No firing details yet";
}


export function formatSearchQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function normalizeGlazeSearchText(value: string | null | undefined) {
  return compactWhitespace((value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " "));
}

export function compactGlazeSearchText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function buildGlazeSearchIndex(values: Array<string | null | undefined>) {
  const normalized = values
    .map((value) => normalizeGlazeSearchText(value))
    .filter(Boolean);
  const compact = values
    .map((value) => compactGlazeSearchText(value))
    .filter((value) => value.length >= 2);

  return uniqueValues([...normalized, ...compact]).join(" ");
}

export function matchesGlazeSearch(searchIndex: string, query: string) {
  const normalizedQuery = normalizeGlazeSearchText(query);
  const compactQuery = compactGlazeSearchText(query);

  if (!normalizedQuery && !compactQuery) {
    return true;
  }

  // Match each whitespace-separated token independently so that queries
  // spanning multiple fields (e.g. "coyote really red" → brand + name)
  // still match, regardless of the order fields appear in the index.
  if (normalizedQuery) {
    const tokens = normalizedQuery.split(" ").filter(Boolean);
    if (tokens.every((token) => searchIndex.includes(token))) {
      return true;
    }
  }

  return compactQuery.length >= 2 && searchIndex.includes(compactQuery);
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripLeadingFiringLabel(value: string) {
  return value.replace(
    /^(?:cone\s*0?\d{1,2}(?:\s*(?:oxidation|reduction))?(?:\s*\([^)]*\))?:\s*)+/i,
    "",
  );
}

function extractFirstSentence(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = compactWhitespace(stripLeadingFiringLabel(value));
  const sentence = normalized.match(/.+?[.!?](?:\s|$)/)?.[0] ?? normalized;
  return sentence.trim();
}

const finishKeywords = [
  { pattern: /\bgloss(?:y)?\b/i, label: "Glossy" },
  { pattern: /\bmatte?\b/i, label: "Matte" },
  { pattern: /\bsatin\b/i, label: "Satin" },
  { pattern: /\bcrackle\b/i, label: "Crackle" },
  { pattern: /\btransparent\b/i, label: "Transparent" },
  { pattern: /\btranslucent\b/i, label: "Translucent" },
  { pattern: /\bopaque\b/i, label: "Opaque" },
  { pattern: /\btextured?\b/i, label: "Textured" },
  { pattern: /\bcrystal(?:s|line)?\b/i, label: "Crystalline" },
];

const colorKeywords = [
  { keyword: "white", label: "White" },
  { keyword: "cream", label: "Cream" },
  { keyword: "ivory", label: "Cream" },
  { keyword: "clear", label: "Clear" },
  { keyword: "black", label: "Black" },
  { keyword: "grey", label: "Grey" },
  { keyword: "gray", label: "Grey" },
  { keyword: "silver", label: "Silver" },
  { keyword: "gold", label: "Gold" },
  { keyword: "brown", label: "Brown" },
  { keyword: "amber", label: "Amber" },
  { keyword: "tan", label: "Tan" },
  { keyword: "beige", label: "Beige" },
  { keyword: "red", label: "Red" },
  { keyword: "burgundy", label: "Burgundy" },
  { keyword: "maroon", label: "Maroon" },
  { keyword: "orange", label: "Orange" },
  { keyword: "coral", label: "Coral" },
  { keyword: "yellow", label: "Yellow" },
  { keyword: "chartreuse", label: "Green" },
  { keyword: "green", label: "Green" },
  { keyword: "olive", label: "Olive" },
  { keyword: "sage", label: "Sage" },
  { keyword: "teal", label: "Teal" },
  { keyword: "turquoise", label: "Turquoise" },
  { keyword: "aqua", label: "Aqua" },
  { keyword: "blue", label: "Blue" },
  { keyword: "navy", label: "Navy" },
  { keyword: "indigo", label: "Indigo" },
  { keyword: "purple", label: "Purple" },
  { keyword: "lavender", label: "Lavender" },
  { keyword: "pink", label: "Pink" },
];

const colorSmartGroups: Record<string, string[]> = {
  White: ["White", "Cream", "Clear"],
  Cream: ["Cream", "White", "Beige", "Tan"],
  Grey: ["Grey", "Silver", "Black"],
  Brown: ["Brown", "Amber", "Tan", "Beige", "Gold"],
  Red: ["Red", "Maroon", "Burgundy", "Pink", "Coral"],
  Pink: ["Pink", "Coral", "Lavender", "Burgundy"],
  Orange: ["Orange", "Coral", "Amber", "Gold"],
  Yellow: ["Yellow", "Gold", "Amber"],
  Green: ["Green", "Olive", "Sage", "Teal", "Turquoise"],
  Blue: ["Blue", "Navy", "Indigo", "Teal", "Turquoise", "Aqua"],
  Teal: ["Teal", "Turquoise", "Aqua", "Blue", "Green"],
  Purple: ["Purple", "Lavender", "Indigo", "Burgundy", "Pink"],
};

const colorSwatchMap: Record<string, string> = {
  White: "#f7f2ea",
  Cream: "#ebe1bf",
  Clear: "#d7d7d7",
  Black: "#2a221e",
  Grey: "#8a8580",
  Silver: "#b7bcc3",
  Gold: "#c7a34c",
  Brown: "#8b5a35",
  Amber: "#b1732f",
  Tan: "#c59d73",
  Beige: "#d5c1a1",
  Red: "#c63f37",
  Burgundy: "#7e2c33",
  Maroon: "#6b2327",
  Orange: "#d7791f",
  Coral: "#e27b64",
  Yellow: "#d5b11f",
  Green: "#5e9f4a",
  Olive: "#6c7a39",
  Sage: "#8ca686",
  Teal: "#2f8f8d",
  Turquoise: "#2fa7a0",
  Aqua: "#67c5d8",
  Blue: "#356fcf",
  Navy: "#27407f",
  Indigo: "#4c4d9d",
  Purple: "#7f4cc9",
  Lavender: "#a98acf",
  Pink: "#cb5b94",
};

const colorAngleMap: Record<string, number | null> = {
  White: null,
  Cream: null,
  Clear: null,
  Black: null,
  Grey: null,
  Silver: null,
  Gold: null,
  Brown: null,
  Amber: null,
  Tan: null,
  Beige: null,
  Red: 0,
  Burgundy: 346,
  Maroon: 352,
  Orange: 28,
  Coral: 14,
  Yellow: 58,
  Green: 120,
  Olive: null,
  Sage: null,
  Teal: 176,
  Turquoise: 188,
  Aqua: 198,
  Blue: 222,
  Navy: 232,
  Indigo: 248,
  Purple: 272,
  Lavender: 300,
  Pink: 322,
};

const finishSmartGroups: Record<string, string[]> = {
  Glossy: ["Glossy", "Transparent", "Translucent"],
  Matte: ["Matte", "Satin"],
  Satin: ["Satin", "Matte"],
  Textured: ["Textured", "Crackle", "Crystalline"],
  Crackle: ["Crackle", "Textured"],
  Crystalline: ["Crystalline", "Textured"],
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeCode(value: string | null | undefined) {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

type VendorVisualProfile = {
  imageColors?: string[];
  imageColorWeights?: Record<string, number>;
};

const vendorVisualProfiles = vendorVisualTraits as Record<string, VendorVisualProfile>;

function getVisualTraitKey(glaze: Glaze) {
  if (!glaze.brand || !glaze.code) {
    return null;
  }

  return `${glaze.brand}|${normalizeCode(glaze.code)}`;
}

function getVendorVisualProfile(glaze: Glaze): VendorVisualProfile | null {
  const key = getVisualTraitKey(glaze);

  if (!key) {
    return null;
  }

  return vendorVisualProfiles[key] ?? null;
}

function getVendorImageColorTraits(glaze: Glaze) {
  return getVendorVisualProfile(glaze)?.imageColors ?? [];
}

function getVendorImageColorWeights(glaze: Glaze) {
  return getVendorVisualProfile(glaze)?.imageColorWeights ?? {};
}

function parseHexColor(hex: string) {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHsv(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
  }

  hue = (hue * 60 + 360) % 360;
  const sat = max === 0 ? 0 : delta / max;

  return { hue: hue / 360, sat, val: max };
}

function getColorFlowMeta(label: string) {
  const rgb = parseHexColor(getColorSwatch(label));

  if (!rgb) {
    return { chromatic: false, hue: 0, value: 0 };
  }

  const { hue, sat, val } = rgbToHsv(rgb.r, rgb.g, rgb.b);
  return { chromatic: sat >= 0.12, hue, value: val };
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function extractGlazeFinishTraits(glaze: Glaze) {
  const finishText = [glaze.finishNotes, glaze.description].filter(Boolean).join(" ");
  const matches = finishKeywords
    .filter((keyword) => keyword.pattern.test(finishText))
    .map((keyword) => keyword.label);

  return uniqueValues(matches);
}

export function summarizeGlazeFinish(glaze: Glaze) {
  const extracted = extractGlazeFinishTraits(glaze);

  if (extracted.length) {
    return extracted.slice(0, 3).join(" · ");
  }

  if (glaze.finishNotes?.trim()) {
    return glaze.finishNotes.trim();
  }

  return null;
}

export function extractGlazeColorTraits(glaze: Glaze) {
  const colorText = [glaze.name, glaze.colorNotes, glaze.description].filter(Boolean).join(" ").toLowerCase();
  const textMatches = colorKeywords
    .filter(({ keyword }) => new RegExp(`\\b${keyword}\\b`, "i").test(colorText))
    .map(({ label }) => label);
  const imageMatches = getVendorImageColorTraits(glaze).filter((label) => label !== "White");

  return uniqueValues([...textMatches, ...imageMatches]).map(titleCase);
}

export function getColorSwatch(label: string) {
  return colorSwatchMap[label] ?? "#d8c6b8";
}

export function getGlazeColorPalette(glaze: Glaze) {
  const imageWeights = Object.entries(getVendorImageColorWeights(glaze))
    .filter(([label, weight]) => label !== "White" && weight >= 0.03)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, weight]) => ({
      label,
      weight,
      swatch: getColorSwatch(label),
    }));

  if (imageWeights.length) {
    return imageWeights;
  }

  return extractGlazeColorTraits(glaze)
    .slice(0, 4)
    .map((label) => ({
      label,
      weight: 0,
      swatch: getColorSwatch(label),
    }));
}

export function getDominantGlazeColorLabel(glaze: Glaze) {
  const palette = getGlazeColorPalette(glaze);

  if (palette.length) {
    return palette[0]?.label ?? null;
  }

  return extractGlazeColorTraits(glaze)[0] ?? null;
}

export function getGlazeColorFlowPosition(glaze: Glaze) {
  const palette = getGlazeColorPalette(glaze);

  if (!palette.length) {
    return { bucket: 2, position: 1, lightness: 1 };
  }

  let x = 0;
  let y = 0;
  let chromaticWeight = 0;
  let neutralLightness = 0;
  let neutralWeight = 0;

  for (const color of palette) {
    const meta = getColorFlowMeta(color.label);
    const weight = color.weight || 0.1;

    if (meta.chromatic) {
      const angle = meta.hue * Math.PI * 2;
      x += Math.cos(angle) * weight;
      y += Math.sin(angle) * weight;
      chromaticWeight += weight;
    } else {
      neutralLightness += meta.value * weight;
      neutralWeight += weight;
    }
  }

  if (chromaticWeight > 0) {
    const angle = Math.atan2(y, x);
    const normalized = ((angle / (Math.PI * 2)) + 1) % 1;
    const lightness = palette.reduce((total, color) => total + getColorFlowMeta(color.label).value * (color.weight || 0.1), 0);
    return {
      bucket: 0,
      position: normalized,
      lightness: lightness / palette.length,
    };
  }

  if (neutralWeight > 0) {
    return {
      bucket: 1,
      position: neutralLightness / neutralWeight,
      lightness: neutralLightness / neutralWeight,
    };
  }

  return { bucket: 2, position: 1, lightness: 1 };
}

export function summarizeGlazeColor(glaze: Glaze) {
  const extracted = extractGlazeColorTraits(glaze);

  if (extracted.length) {
    return extracted.slice(0, 3).join(" · ");
  }

  if (glaze.colorNotes?.trim()) {
    return glaze.colorNotes.trim();
  }

  return null;
}

export function hasCuratedGlazeDescription(glaze: Glaze) {
  return Boolean(
    glaze.editorialSummary ||
      glaze.editorialSurface ||
      glaze.editorialApplication ||
      glaze.editorialFiring,
  );
}

export function getGlazeSkimDescription(glaze: Glaze) {
  const derivedSurface =
    [summarizeGlazeFinish(glaze), summarizeGlazeColor(glaze)]
      .filter(Boolean)
      .join(" surface · ") || "Surface notes have not been edited yet.";

  return {
    summary:
      glaze.editorialSummary ??
      extractFirstSentence(glaze.description) ??
      "No edited summary is saved for this glaze yet.",
    surface: glaze.editorialSurface ?? derivedSurface,
    application: glaze.editorialApplication ?? null,
    firing: glaze.editorialFiring ?? formatGlazeMeta(glaze),
  };
}

export function extractQueryColorIntent(query: string) {
  const normalized = query.toLowerCase();
  const directMatches = colorKeywords
    .filter(({ keyword }) => new RegExp(`\\b${keyword}\\b`, "i").test(normalized))
    .map(({ label }) => label);
  const smartGroupMatches = Object.keys(colorSmartGroups).filter((label) =>
    new RegExp(`\\b${label.toLowerCase()}\\b`, "i").test(normalized),
  );

  return uniqueValues([...directMatches, ...smartGroupMatches]);
}

export function getGlazeColorMatchScore(glaze: Glaze, selectedColors: string[]) {
  if (!selectedColors.length) {
    return 0;
  }

  const imageWeights = Object.fromEntries(
    Object.entries(getVendorImageColorWeights(glaze)).filter(([label]) => label !== "White"),
  );
  const textTraits = extractGlazeColorTraits(glaze);

  return selectedColors.reduce((total, selected) => {
    const allowed = colorSmartGroups[selected] ?? [selected];
    const targetAngle = colorAngleMap[selected];
    const exactImageWeight = imageWeights[selected] ?? 0;
    const relatedImageWeight = Math.max(
      ...allowed
        .filter((label) => label !== selected)
        .map((label) => {
          const weight = imageWeights[label] ?? 0;

          if (!weight) {
            return 0;
          }

          const candidateAngle = colorAngleMap[label];

          if (targetAngle === null || targetAngle === undefined || candidateAngle === null || candidateAngle === undefined) {
            return weight * 0.68;
          }

          const distance = Math.abs(((candidateAngle - targetAngle + 540) % 360) - 180);
          const similarity = Math.max(0, 1 - distance / 120);
          return weight * (0.58 + similarity * 0.24);
        }),
      0,
    );
    const adjacentWheelWeight = Math.max(
      ...Object.entries(imageWeights).map(([label, weight]) => {
        if (allowed.includes(label)) {
          return 0;
        }

        const candidateAngle = colorAngleMap[label];

        if (targetAngle === null || targetAngle === undefined || candidateAngle === null || candidateAngle === undefined) {
          return 0;
        }

        const distance = Math.abs(((candidateAngle - targetAngle + 540) % 360) - 180);
        const similarity = Math.max(0, 1 - distance / 90);
        return weight * similarity * 0.35;
      }),
      0,
    );
    const textScore = textTraits.includes(selected) ? 0.04 : allowed.some((color) => textTraits.includes(color)) ? 0.015 : 0;
    return total + exactImageWeight * 1.35 + relatedImageWeight + adjacentWheelWeight + textScore;
  }, 0);
}

export function extractGlazeConeTraits(glaze: Glaze) {
  if (!glaze.cone) {
    return [] as string[];
  }

  const matches = Array.from(glaze.cone.matchAll(/\b0?\d{1,2}\b/g)).map((match) => match[0]);
  const normalized = matches.map((value) => {
    if (value.length === 1) {
      return `Cone ${value}`;
    }

    if (value.startsWith("0")) {
      return `Cone ${value}`;
    }

    return `Cone ${String(Number(value))}`;
  });

  return uniqueValues(normalized);
}

export function matchesFamilySelection(glazeFamilies: string[], selectedFamilies: string[]) {
  if (!selectedFamilies.length) {
    return true;
  }

  return selectedFamilies.some((family) => glazeFamilies.includes(family));
}

export function matchesSmartColorSelection(glazeTraits: string[], selectedColors: string[]) {
  if (!selectedColors.length) {
    return true;
  }

  return selectedColors.some((selected) => {
    const allowed = colorSmartGroups[selected] ?? [selected];
    return allowed.some((value) => glazeTraits.includes(value));
  });
}

export function matchesSmartFinishSelection(glazeTraits: string[], selectedFinishes: string[]) {
  if (!selectedFinishes.length) {
    return true;
  }

  return selectedFinishes.some((selected) => {
    const allowed = finishSmartGroups[selected] ?? [selected];
    return allowed.some((value) => glazeTraits.includes(value));
  });
}

export function matchesFiringImagePreference(
  image: GlazeFiringImage,
  preferredCone?: string | null,
  preferredAtmosphere?: string | null,
) {
  const coneMatches = preferredCone ? image.cone === preferredCone : true;
  const atmosphereMatches = preferredAtmosphere ? image.atmosphere === preferredAtmosphere : true;
  return coneMatches && atmosphereMatches;
}

function getImageUrlQualityScore(url: string) {
  let score = 0;

  if (!url) {
    return -999;
  }

  if (/ā|â|â€™|â€œ|â€|[\u0080-\u009f]/i.test(url)) {
    score -= 100;
  }

  if (url.includes("/thumbs/")) {
    score -= 25;
  }

  if (url.includes("/Tile%20Comparisons/") || url.includes("/Tile Comparisons/")) {
    score += 18;
  }

  if (url.includes("/2021/Tiles/")) {
    score += 16;
  }

  if (url.includes("/250%20Tiles/") || url.includes("/250 Tiles/")) {
    score += 10;
  }

  if (url.includes("/Images/Pots/") && !url.includes("/thumbs/")) {
    score += 6;
  }

  if (/cone10|cone6|cone06/i.test(url)) {
    score += 2;
  }

  return score;
}

export function pickPreferredGlazeImage(
  glaze: Glaze,
  firingImages: GlazeFiringImage[],
  preferredCone?: string | null,
  preferredAtmosphere?: string | null,
) {
  if (glaze.brand === "Coyote" && glaze.imageUrl?.startsWith("/vendor-images/coyote/")) {
    return glaze.imageUrl;
  }

  const exactMatches = firingImages.filter((image) =>
    matchesFiringImagePreference(image, preferredCone, preferredAtmosphere),
  );
  const coneMatches = preferredCone
    ? firingImages.filter((image) => image.cone === preferredCone)
    : [];
  const atmosphereMatches = preferredAtmosphere
    ? firingImages.filter((image) => image.atmosphere === preferredAtmosphere)
    : [];
  const candidateImages = exactMatches.length
    ? exactMatches
    : coneMatches.length
      ? coneMatches
      : atmosphereMatches.length
        ? atmosphereMatches
        : firingImages;
  const bestFiringImage = [...candidateImages].sort(
    (left, right) => getImageUrlQualityScore(right.imageUrl) - getImageUrlQualityScore(left.imageUrl),
  )[0];

  return bestFiringImage?.imageUrl ?? glaze.imageUrl ?? firingImages[0]?.imageUrl ?? null;
}
