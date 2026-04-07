import test from "node:test";
import assert from "node:assert/strict";

import { getGlazeFamilyTraits } from "../src/lib/glaze-metadata";
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
