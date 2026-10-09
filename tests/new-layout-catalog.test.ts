import assert from "node:assert/strict";
import test from "node:test";

import { coneTag, isCone6 } from "../src/lib/new-layout/cone";
import {
  colourAwareQuery,
  comboMatches,
  comboMatchesPair,
  matchesSearch,
  matchesSmart,
  COLOR_GROUPS,
} from "../src/lib/new-layout/colour";
import type { NLCombo, NLGlaze } from "../src/lib/new-layout/types";

test("isCone6 accepts cone 5/6 ranges but not cone 06", () => {
  assert.equal(isCone6("Cone 6"), true);
  assert.equal(isCone6("Cone 5 / Cone 6"), true);
  assert.equal(isCone6("Cone 5/6"), true);
  assert.equal(isCone6("Cone 10 / Cone 6"), true);
  assert.equal(isCone6("Cone 06"), false);
  assert.equal(isCone6("Cone 06 / Cone 04"), false);
  assert.equal(isCone6("Cone 10"), false);
  assert.equal(isCone6(null), false);
});

test("coneTag labels shelf glazes outside cone 6", () => {
  assert.equal(coneTag("Cone 6"), null);
  assert.equal(coneTag("Cone 06 / Cone 04"), "Cone 06");
  assert.equal(coneTag("Cone 10"), "Cone 10");
});

test("colour words rank instead of filtering as text", () => {
  assert.deepEqual(colourAwareQuery("floating blue"), { colours: ["Blue"], text: "floating" });
  assert.deepEqual(colourAwareQuery("Teal matte"), { colours: ["Teal"], text: "matte" });
});

test("search matches every word or the squashed code", () => {
  const index = "sw 116 robin s egg mayco sw116 robinsegg";
  assert.equal(matchesSearch(index, "sw116"), true);
  assert.equal(matchesSearch(index, "SW-116"), true);
  assert.equal(matchesSearch(index, "robin egg"), true);
  assert.equal(matchesSearch(index, "robin blue"), false);
});

test("colour chips cover related shades", () => {
  assert.equal(matchesSmart(["Navy"], ["Blue"], COLOR_GROUPS), true);
  assert.equal(matchesSmart(["Red"], ["Blue"], COLOR_GROUPS), false);
  assert.equal(matchesSmart(["Red"], [], COLOR_GROUPS), true);
});

const glaze = (id: string, code: string, name: string): NLGlaze => ({
  id, brand: "Mayco", code, name, line: "", cone: "Cone 6", cone6: true, ct: [], ft: [], w: {}, pal: [],
  s: `${code.toLowerCase().replace("-", " ")} ${name.toLowerCase()} mayco ${code.toLowerCase().replace("-", "")}`,
  photos: [], buy: [], desc: "",
});

test("code searches must match one layer, and pairs need different layers", () => {
  const a = glaze("a", "PC-2", "Two");
  const b = glaze("b", "SW-20", "Twenty");
  const c = glaze("c", "PC-20", "Blue Rutile");
  const byId = new Map([a, b, c].map((g) => [g.id, g]));
  const ab: NLCombo = { id: "ab", title: "", image: null, vendor: "", url: null, clay: null, notes: null, firing: null, layers: [{ g: "a", to: "Over" }, { g: "b", to: null }] };
  const cb: NLCombo = { ...ab, id: "cb", layers: [{ g: "c", to: "Over" }, { g: "b", to: null }] };
  assert.equal(comboMatches(ab, byId, "PC-20"), false, "PC from one layer and 20 from another must not match");
  assert.equal(comboMatches(cb, byId, "PC-20"), true);
  assert.equal(comboMatchesPair(cb, byId, "PC-20", "twenty"), true);
  assert.equal(comboMatchesPair(cb, byId, "PC-20", "PC-20"), false, "one layer can't satisfy both glazes");
});
