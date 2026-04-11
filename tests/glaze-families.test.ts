import test from "node:test";
import assert from "node:assert/strict";

import { getGlazeFamilyTraits } from "../src/lib/glaze-metadata";
import { extractGlazeFinishTraits } from "../src/lib/utils";
import type { Glaze } from "../src/lib/types";

function makeGlaze(overrides: Partial<Glaze>): Glaze {
  return {
    id: "glaze-1",
    sourceType: "commercial",
    name: "Test glaze",
    ...overrides,
  };
}

test("maps Mayco Stroke & Coat into the shared low-fire gloss family", () => {
  const families = getGlazeFamilyTraits(
    makeGlaze({
      brand: "Mayco",
      line: "Stroke & Coat",
    }),
  );

  assert.deepEqual(families, ["Low-fire gloss color"]);
});

test("maps AMACO Celadon into shared celadon and durable families", () => {
  const families = getGlazeFamilyTraits(
    makeGlaze({
      brand: "AMACO",
      line: "Celadon",
    }),
  );

  assert.deepEqual(families, ["Celadon", "Durable functional"]);
});

test("maps Coyote Shino into shared shino and reactive families", () => {
  const families = getGlazeFamilyTraits(
    makeGlaze({
      brand: "Coyote",
      line: "Shino Glazes",
    }),
  );

  assert.deepEqual(families, ["Shino", "Reactive effects"]);
});

test("prefers structured families column over the brand/line map", () => {
  // `families` is populated by the 20260411120000 migration. When present,
  // it should win over whatever the in-code brand/line taxonomy would infer
  // from `brand` + `line` — that lets admins override bad mappings on a
  // per-glaze basis without waiting for a code change.
  const families = getGlazeFamilyTraits(
    makeGlaze({
      brand: "Mayco",
      line: "Stroke & Coat",
      families: ["Reactive effects"],
    }),
  );

  assert.deepEqual(families, ["Reactive effects"]);
});

test("falls back to the brand/line map when families column is empty", () => {
  const families = getGlazeFamilyTraits(
    makeGlaze({
      brand: "Mayco",
      line: "Stroke & Coat",
      families: [],
    }),
  );

  assert.deepEqual(families, ["Low-fire gloss color"]);
});

test("prefers structured finishes column over the free-text regex fallback", () => {
  // Description mentions "matte" but the structured `finishes` column says
  // Glossy — the structured value must win.
  const finishes = extractGlazeFinishTraits(
    makeGlaze({
      description: "A matte glaze with sage green blooms.",
      finishes: ["Glossy"],
    }),
  );

  assert.deepEqual(finishes, ["Glossy"]);
});

test("falls back to free-text regex extraction when finishes column is empty", () => {
  const finishes = extractGlazeFinishTraits(
    makeGlaze({
      finishNotes: "Satin sheen with crackle edges",
      description: null,
      finishes: [],
    }),
  );

  assert.deepEqual(finishes, ["Satin", "Crackle"]);
});
