import test from "node:test";
import assert from "node:assert/strict";

import { getAllCatalogGlazes } from "../src/lib/catalog";
import { ACTIVE_GLAZE_BRANDS, getGlazeFamilyTraits } from "../src/lib/glaze-metadata";
import { buildGlazeSearchIndex, extractGlazeColorTraits, matchesGlazeSearch } from "../src/lib/utils";
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

test("exposes UK supplier catalog rows as active searchable brands", () => {
  const catalog = getAllCatalogGlazes();
  const activeBrands = new Set(ACTIVE_GLAZE_BRANDS);

  for (const brand of ["Bath Potters", "Potterycrafts", "Scarva"]) {
    assert.equal(activeBrands.has(brand as (typeof ACTIVE_GLAZE_BRANDS)[number]), true);
    assert.ok(catalog.some((glaze) => glaze.brand === brand), `${brand} rows should exist`);
  }
});

test("maps UK supplier lines into family tags and color search traits", () => {
  const catalog = getAllCatalogGlazes();
  const bathSlip = catalog.find((glaze) => glaze.brand === "Bath Potters" && glaze.code === "SLIP-10");
  const potterycraftsGlaze = catalog.find((glaze) => glaze.brand === "Potterycrafts" && glaze.code === "P2073");

  assert.ok(bathSlip);
  assert.deepEqual(getGlazeFamilyTraits(bathSlip), ["Engobe"]);
  assert.ok(extractGlazeColorTraits(bathSlip).includes("Blue"));

  assert.ok(potterycraftsGlaze);
  assert.deepEqual(getGlazeFamilyTraits(potterycraftsGlaze), ["Low-fire gloss color"]);
  assert.equal(
    matchesGlazeSearch(
      buildGlazeSearchIndex([
        potterycraftsGlaze.brand,
        potterycraftsGlaze.code,
        potterycraftsGlaze.name,
        potterycraftsGlaze.line,
        potterycraftsGlaze.colorNotes,
      ]),
      "turquoise potterycrafts",
    ),
    true,
  );
});
