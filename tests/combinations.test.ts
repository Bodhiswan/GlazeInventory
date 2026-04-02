import test from "node:test";
import assert from "node:assert/strict";

import { buildCombinationSummaries, createPairKey, parsePairKey } from "../src/lib/combinations";
import { demoGlazes } from "../src/lib/demo-data";

test("createPairKey is order-insensitive", () => {
  const first = createPairKey(demoGlazes[0].id, demoGlazes[1].id);
  const second = createPairKey(demoGlazes[1].id, demoGlazes[0].id);

  assert.equal(first, second);
});

test("parsePairKey returns the original ids", () => {
  const pairKey = createPairKey(demoGlazes[0].id, demoGlazes[1].id);
  const parsed = parsePairKey(pairKey);

  assert.deepEqual(parsed, [demoGlazes[0].id, demoGlazes[1].id].sort());
});

test("three owned glazes produce three unique pairs", () => {
  const pairs = buildCombinationSummaries(demoGlazes.slice(0, 3));

  assert.equal(pairs.length, 3);
  assert.equal(new Set(pairs.map((pair) => pair.pairKey)).size, 3);
});
