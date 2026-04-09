import test from "node:test";
import assert from "node:assert/strict";

import { buildGlazeSearchIndex, extractColorAwareQuery, getGlazeColorMatchScore, matchesGlazeSearch } from "../src/lib/utils";
import type { Glaze } from "../src/lib/types";

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

test("separates color intent from the remaining text query", () => {
  assert.deepEqual(extractColorAwareQuery("red"), {
    colorIntent: ["Red"],
    textQuery: "",
    shadeIntent: null,
  });

  assert.deepEqual(extractColorAwareQuery("mayco red"), {
    colorIntent: ["Red"],
    textQuery: "mayco",
    shadeIntent: null,
  });

  assert.deepEqual(extractColorAwareQuery("blue cone 6"), {
    colorIntent: ["Blue"],
    textQuery: "cone 6",
    shadeIntent: null,
  });

  assert.deepEqual(extractColorAwareQuery("light blue"), {
    colorIntent: ["Blue"],
    textQuery: "",
    shadeIntent: "light",
  });

  assert.deepEqual(extractColorAwareQuery("dark red mayco"), {
    colorIntent: ["Red"],
    textQuery: "mayco",
    shadeIntent: "dark",
  });
});

test("ranks glazes by palette proximity for red searches", () => {
  const redGlaze: Glaze = {
    id: "red",
    sourceType: "commercial",
    brand: "BOTZ",
    code: "9611",
    name: "Pillar Box Red",
  };
  const blueGlaze: Glaze = {
    id: "blue",
    sourceType: "commercial",
    brand: "BOTZ",
    code: "9542",
    name: "Blue Effect",
  };

  assert.ok(
    getGlazeColorMatchScore(redGlaze, ["Red"]) > getGlazeColorMatchScore(blueGlaze, ["Red"]),
  );
});

test("keeps true white glazes ahead of colored glazes for white searches", () => {
  const whiteGlaze: Glaze = {
    id: "white",
    sourceType: "commercial",
    brand: "BOTZ",
    code: "9101",
    name: "Glossy White",
  };
  const redGlaze: Glaze = {
    id: "red",
    sourceType: "commercial",
    brand: "BOTZ",
    code: "9611",
    name: "Pillar Box Red",
  };

  assert.ok(
    getGlazeColorMatchScore(whiteGlaze, ["White"]) > getGlazeColorMatchScore(redGlaze, ["White"]),
  );
});

test("prefers lighter blues for light blue searches", () => {
  const lightBlueGlaze: Glaze = {
    id: "light-blue",
    sourceType: "commercial",
    brand: "Mayco",
    code: "SW-446",
    name: "Light Flux",
  };
  const darkBlueGlaze: Glaze = {
    id: "dark-blue",
    sourceType: "commercial",
    brand: "BOTZ",
    code: "9542",
    name: "Blue Effect",
  };

  assert.ok(
    getGlazeColorMatchScore(lightBlueGlaze, ["Blue"], "light") >
      getGlazeColorMatchScore(darkBlueGlaze, ["Blue"], "light"),
  );
});
