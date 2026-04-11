/**
 * One-shot backfill that updates `data/catalog/glazes.json` in place to
 * include the new structured fields introduced by migration
 * 20260411120000_add_structured_glaze_taxonomy.sql:
 *
 *   - `finishes` — populated by regex-matching the existing finish keyword
 *     list (mirrors `finishKeywords` in src/lib/utils.ts).
 *   - `families` — derived from the brand/line taxonomy that the migration
 *     seeds into `public.glaze_brand_lines` (mirrors `brandLineFamilyMap` in
 *     src/lib/glaze-metadata.ts).
 *   - `brand_line_id` — stable UUID assigned here from a deterministic
 *     hash of `(brand, line)` so the catalog JSON and the DB can reference
 *     the same identity without running a live Supabase query.
 *
 * It also writes a new `data/catalog/glaze-brand-lines.json` that the app
 * can use as a canonical brand/line reference without hitting the DB.
 *
 * Usage:  node scripts/backfill-glaze-taxonomy.mjs
 *
 * This script is idempotent — running it repeatedly yields the same output.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

// Mirrors `brandLineFamilyMap` in src/lib/glaze-metadata.ts. Keep in sync
// with the seed in migration 20260411120000_add_structured_glaze_taxonomy.sql.
const brandLineFamilyMap = {
  Mayco: {
    "Fundamentals Underglaze": ["Underglaze"],
    "E-Z Stroke Translucent Underglazes": ["Translucent underglaze"],
    "Stroke & Coat": ["Low-fire gloss color"],
    "Speckled Stroke & Coat": ["Low-fire gloss color"],
    Foundations: ["Low-fire gloss color"],
    "Low Fire Clear": ["Durable functional"],
    "Stoneware Engobes": ["Engobe"],
    "Stoneware Clear": ["Durable functional"],
    Stoneware: ["Reactive effects"],
    "Stoneware Specialty": ["Reactive effects"],
    "Elements and Elements Chunkies": ["Reactive effects"],
    Elements: ["Reactive effects"],
    "Elements Chunkies": ["Reactive effects"],
    "Jungle Gems": ["Reactive effects"],
    "Pottery Cascade": ["Reactive effects"],
    Flux: ["Reactive effects"],
    "Classic Crackles": ["Crawl / crackle"],
    Cobblestone: ["Crawl / crackle"],
    Raku: ["Reactive effects"],
    Washes: ["Specialty additive"],
    "Designer Liner": ["Underglaze"],
    "French Dimensions": ["Specialty additive"],
    "Melt Gloop": ["Specialty additive"],
    Bead: ["Specialty additive"],
    "Snow Gems": ["Specialty additive"],
    Snowfall: ["Specialty additive"],
  },
  AMACO: {
    "Velvet Underglaze": ["Underglaze"],
    "Liquid Underglaze": ["Underglaze"],
    "Semi-Moist Underglaze": ["Underglaze"],
    "Velvet Sprayz": ["Underglaze"],
    "Teacher's Palette Light": ["Low-fire gloss color"],
    "Teacher's Palette": ["Low-fire gloss color"],
    "Low Fire Gloss": ["Low-fire gloss color"],
    "Low Fire Matte": ["Low-fire matte color"],
    Celadon: ["Celadon", "Durable functional"],
    "Satin Matte": ["Satin / matte functional"],
    "High Fire": ["Durable functional"],
    "Dipping & Layering": ["Durable functional", "Reactive effects"],
    "Dipping Glazes": ["Durable functional"],
    Opalescent: ["Reactive effects"],
    "Potter's Choice": ["Reactive effects"],
    "Potter's Choice Flux": ["Reactive effects"],
    Cosmos: ["Reactive effects"],
    "Kiln Ice": ["Reactive effects", "Crawl / crackle"],
    "Phase Glaze": ["Reactive effects"],
    Crawls: ["Crawl / crackle"],
    Shino: ["Shino", "Reactive effects"],
    Texturizer: ["Specialty additive"],
  },
  Coyote: {
    "Enduro-Color Glazes": ["Durable functional"],
    "Vibro-Color Glazes": ["Durable functional"],
    "Gloss Glazes": ["Durable functional"],
    "Satin Glazes": ["Satin / matte functional"],
    "Matt Glazes & Crawl Glazes": ["Satin / matte functional", "Crawl / crackle"],
    "Frank's Colored Celadon Glazes": ["Celadon"],
    "Shino Glazes": ["Shino", "Reactive effects"],
    "Archie's Glazes": ["Reactive effects"],
    "Fantasy Glazes": ["Reactive effects"],
    "Copper & Iron Glazes": ["Reactive effects"],
    "Mottled Glazes": ["Reactive effects"],
    "Texas Two-Step Oilspot Glazes": ["Reactive effects"],
  },
  Duncan: {
    "E-Z Stroke® Translucent Underglazes": ["Translucent underglaze"],
    "French Dimensions™": ["Specialty additive"],
    "Clear Glazes": ["Durable functional"],
  },
  "Clay Art Center": {
    "Base Glazes": ["Durable functional"],
    "Craftsman Glazes": ["Reactive effects"],
    "Frost Series Glazes": ["Satin / matte functional"],
    "Glossy Series Glazes": ["Durable functional"],
    "High Fire Glazes": ["Durable functional"],
    "Lead-Free Low Fire Glossy Glazes": ["Low-fire gloss color"],
    "Mica Terra Sigillata": ["Engobe"],
    "P Series Glazes": ["Durable functional"],
    "Rainbow Glazes": ["Reactive effects"],
    "Raku Glazes": ["Reactive effects"],
    "Satin Matte Glazes": ["Satin / matte functional"],
    "Strontium Matte Glazes": ["Reactive effects"],
    "Terra Sigillata": ["Engobe"],
  },
  Spectrum: {
    "100 Series Crackle Glazes": ["Crawl / crackle"],
    "150 Series Metallic Glazes": ["Reactive effects"],
    "200 Series Rhinestone Glazes": ["Reactive effects"],
    "250 Series Satin Glazes": ["Satin / matte functional"],
    "300 Series Majolica Glazes": ["Low-fire gloss color"],
    "700 Series Opaque Gloss Glazes": ["Low-fire gloss color"],
    "800 Series Semi-Transparent Glazes": ["Low-fire gloss color"],
    "850 Series Raku Glazes": ["Reactive effects"],
    "900 Series Low Stone Glazes": ["Satin / matte functional"],
    "1100 Series Clear Gloss Glazes": ["Durable functional"],
    "1100 Series Clear Satin Glazes": ["Satin / matte functional"],
    "1100 Series Clear Crackle Glazes": ["Crawl / crackle"],
    "1100 Series Opaque Gloss Glazes": ["Durable functional"],
    "1100 Series Opaque Satin Glazes": ["Satin / matte functional"],
    "1100 Series Metallic Glazes": ["Reactive effects"],
    "1100 Series Reactive Glazes": ["Reactive effects"],
    "1100 Series Textured Glazes": ["Reactive effects"],
    "1200 Series Cone 9/10 Glazes": ["Durable functional"],
    "1400 Series Shino Glazes": ["Shino", "Reactive effects"],
    "1420 Series Ash Glazes": ["Reactive effects"],
    "1430 Series Floating Glazes": ["Reactive effects"],
    "1460 Series Celadon Glazes": ["Celadon"],
    "1500 Series NOVA Glazes": ["Reactive effects"],
  },
  Speedball: {
    Underglazes: ["Underglaze"],
    "Mid-Fire Glazes": ["Reactive effects"],
    "Mid-Fire Flux Glazes": ["Reactive effects"],
    "Earthenware Glazes": ["Low-fire gloss color"],
  },
  Laguna: {
    "EZ Stroke Low-Fire": ["Underglaze"],
    "Silky Underglaze": ["Underglaze"],
    "Moroccan Fusion": ["Reactive effects"],
    "Moroccan Color": ["Low-fire gloss color"],
    "Moroccan Sand Series": ["Reactive effects"],
    "Moroccan Sand Clear": ["Durable functional"],
    "Laguna Glazes High-Fire (Cone 10)": ["Durable functional"],
    "Vintage High-Fire (Cone 10)": ["Durable functional"],
    "WC High-Fire (Cone 10)": ["Durable functional"],
    "Versa-5": ["Durable functional"],
    "SG Studio Glazes": ["Durable functional"],
    "Flameware (Cone 10)": ["Durable functional"],
    "Crystal Blossom": ["Reactive effects"],
    "Watercolor Crackle": ["Crawl / crackle"],
    "Watercolor Mystic": ["Reactive effects"],
    "Reactive Glazes": ["Reactive effects"],
    "Designer Effects - Dry Lake": ["Crawl / crackle"],
    "Designer Effects - Metallic": ["Reactive effects"],
    Raku: ["Reactive effects"],
  },
  Northcote: {
    "Midfire Glaze": ["Durable functional"],
    "Midfire Glaze - Gloss": ["Durable functional"],
    "Midfire Glaze - Pearl": ["Satin / matte functional"],
    "Midfire Glaze - Chun": ["Reactive effects"],
  },
  "Penguin Pottery": {
    "Flux Series": ["Reactive effects"],
    "Opaque Series": ["Durable functional"],
    "Specialty Series": ["Reactive effects"],
  },
  "Dick Blick Essentials": {
    "Gloss Glazes": ["Low-fire gloss color"],
  },
  BOTZ: {
    Unidekor: ["Underglaze"],
    Earthenware: ["Low-fire gloss color"],
    Stoneware: ["Reactive effects"],
    Engobes: ["Engobe"],
    PRO: ["Durable functional", "Reactive effects"],
    "Ceramic Ink": ["Specialty additive"],
  },
};

// Deterministic UUIDv5-style identifier derived from `(brand, line)`. Using
// a SHA-1 hash with the standard UUID namespace layout so the IDs in the
// catalog JSON and the ones generated by gen_random_uuid() on the DB side
// can be reconciled via the unique `(brand, line)` index.
function hashBrandLineId(brand, line) {
  const hash = createHash("sha1").update(`glaze-brand-line:${brand}|${line}`).digest();
  const bytes = Array.from(hash.subarray(0, 16));
  // RFC 4122 v5 flags
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function extractFinishes(glaze) {
  const source = [glaze.finish_notes, glaze.description].filter(Boolean).join(" ");
  if (!source) return [];
  const matches = finishKeywords
    .filter(({ pattern }) => pattern.test(source))
    .map(({ label }) => label);
  return Array.from(new Set(matches)).sort();
}

function main() {
  const glazesPath = resolve(root, "data/catalog/glazes.json");
  const brandLinesPath = resolve(root, "data/catalog/glaze-brand-lines.json");

  const glazes = JSON.parse(readFileSync(glazesPath, "utf-8"));

  // 1. Build the brand_lines index and emit the canonical JSON.
  const brandLines = [];
  const brandLineIdByKey = new Map();
  for (const [brand, lines] of Object.entries(brandLineFamilyMap)) {
    for (const [line, families] of Object.entries(lines)) {
      const id = hashBrandLineId(brand, line);
      const entry = {
        id,
        brand,
        line,
        families,
        product_url: null,
        description: null,
      };
      brandLines.push(entry);
      brandLineIdByKey.set(`${brand}\u0001${line}`, id);
    }
  }
  brandLines.sort((a, b) => a.brand.localeCompare(b.brand) || a.line.localeCompare(b.line));
  writeFileSync(brandLinesPath, JSON.stringify(brandLines, null, 2) + "\n");

  // 2. Backfill each glaze row with the new structured fields.
  let finishCount = 0;
  let familyCount = 0;
  for (const glaze of glazes) {
    const finishes = extractFinishes(glaze);
    glaze.finishes = finishes;
    if (finishes.length) finishCount += 1;

    const brand = glaze.brand ?? null;
    const line = glaze.line ?? null;
    if (brand && line) {
      const id = brandLineIdByKey.get(`${brand}\u0001${line}`);
      if (id) {
        glaze.brand_line_id = id;
        glaze.families = brandLineFamilyMap[brand][line];
        familyCount += 1;
        continue;
      }
    }
    glaze.brand_line_id = null;
    glaze.families = [];
  }

  writeFileSync(glazesPath, JSON.stringify(glazes, null, 2));

  console.log(`Backfilled ${glazes.length} glazes`);
  console.log(`  finishes assigned: ${finishCount}`);
  console.log(`  families assigned: ${familyCount}`);
  console.log(`  brand lines emitted: ${brandLines.length}`);
}

main();
