import assert from "node:assert/strict";
import test from "node:test";
import { contributionUrl, isResultCone, matchesResultCone } from "../src/lib/result-cones";

test("only Cone 6 and Cone 10 are accepted for new results", () => {
  for (const cone of ["Cone 6", "Cone 10"]) assert.ok(isResultCone(cone));
  for (const cone of ["Cone 06", "Cone 5", "", "Cone 6 / Cone 10", "6"]) assert.equal(isResultCone(cone), false);
});

test("result filters distinguish leading-zero cones and respect the chosen firing", () => {
  for (const value of ["Cone 06", "Cone 05", "Cone 5", "Cone 04", "", null]) assert.equal(matchesResultCone(value), false);
  for (const value of ["Cone 6", "Cone 10", "Cone 5 / Cone 6", "Cone 06 / Cone 6"]) assert.ok(matchesResultCone(value));
  assert.equal(matchesResultCone("Cone 10", ["Cone 6"]), false);
  assert.equal(matchesResultCone("Cone 6", []), false);
});

test("result shortcuts preserve top-to-bottom order and never relabel another cone", () => {
  const url = new URL(contributionUrl(["top", "middle", "base"], "Cone 10"), "https://example.test");
  assert.deepEqual(url.searchParams.getAll("glaze"), ["top", "middle", "base"]);
  assert.equal(url.searchParams.get("cone"), "Cone 10");
  assert.equal(new URL(contributionUrl(["top"], "Cone 5"), url).searchParams.has("cone"), false);
});
