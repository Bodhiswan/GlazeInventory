import test from "node:test";
import assert from "node:assert/strict";

import { buildGlazeSearchIndex, matchesGlazeSearch } from "../src/lib/utils";

test("matches glaze codes regardless of punctuation", () => {
  const searchIndex = buildGlazeSearchIndex(["Mayco", "SW-123", "Sea Salt", "Cone 6"]);

  assert.equal(matchesGlazeSearch(searchIndex, "sw123"), true);
  assert.equal(matchesGlazeSearch(searchIndex, "SW-123"), true);
  assert.equal(matchesGlazeSearch(searchIndex, "sw 123"), true);
});

test("matches multi-word glaze names in spaced and compact forms", () => {
  const searchIndex = buildGlazeSearchIndex(["Mayco", "SW-118", "Sea Salt"]);

  assert.equal(matchesGlazeSearch(searchIndex, "sea salt"), true);
  assert.equal(matchesGlazeSearch(searchIndex, "seasalt"), true);
});

test("does not match unrelated glaze codes", () => {
  const searchIndex = buildGlazeSearchIndex(["Mayco", "SW-123", "Sea Salt"]);

  assert.equal(matchesGlazeSearch(searchIndex, "sw124"), false);
});
