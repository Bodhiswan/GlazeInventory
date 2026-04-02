import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExternalExampleParserOutput,
  canPublishExternalExampleIntake,
  extractAtmosphereFromCaption,
  extractClayBodyFromCaption,
  extractConeFromCaption,
  getApprovedMatchedGlazeIds,
  parseExternalExampleCaption,
  resolveGlazeInput,
} from "../src/lib/external-example-intakes";
import type { Glaze } from "../src/lib/types";

const testGlazes: Glaze[] = [
  {
    id: "glaze-1",
    sourceType: "commercial",
    brand: "Mayco",
    code: "SW-100",
    name: "Blue Surf",
  },
  {
    id: "glaze-2",
    sourceType: "commercial",
    brand: "Mayco",
    code: "SW-172",
    name: "Macadamia",
  },
  {
    id: "glaze-3",
    sourceType: "commercial",
    brand: "AMACO",
    code: "PC-20",
    name: "Blue Rutile",
  },
];

test("extracts cone, atmosphere, and clay body from captions", () => {
  const caption = "Cone 6 oxidation on speckled buff with Blue Surf over Macadamia.";

  assert.equal(extractConeFromCaption(caption), "Cone 6");
  assert.equal(extractAtmosphereFromCaption(caption), "Oxidation");
  assert.equal(extractClayBodyFromCaption(caption), "Speckled buff");
});

test("parses code-based glaze mentions from the raw caption", () => {
  const parsed = parseExternalExampleCaption(
    "Layered SW-100 over SW172 on cone 6 oxidation.",
    testGlazes,
  );

  assert.deepEqual(
    parsed.mentions.map((mention) => mention.matchedGlazeId),
    ["glaze-1", "glaze-2"],
  );
  assert.equal(parsed.parserOutput.extractedCone, "Cone 6");
});

test("parses explicit name matches when a code is not present", () => {
  const parsed = parseExternalExampleCaption(
    "Tried Blue Rutile over Macadamia on a mug.",
    testGlazes,
  );

  assert.deepEqual(
    parsed.mentions.map((mention) => mention.matchedGlazeId).sort(),
    ["glaze-2", "glaze-3"],
  );
});

test("resolveGlazeInput supports exact labels and codes", () => {
  assert.equal(resolveGlazeInput(testGlazes, "Mayco SW-100 Blue Surf")?.id, "glaze-1");
  assert.equal(resolveGlazeInput(testGlazes, "PC20")?.id, "glaze-3");
  assert.equal(resolveGlazeInput(testGlazes, "unknown"), null);
});

test("buildExternalExampleParserOutput includes duplicate hints", () => {
  const parserOutput = buildExternalExampleParserOutput(
    "Cone 6 reduction on porcelain.",
    [],
    {
      duplicateSourceUrl: true,
      duplicateSha256s: ["abc123"],
    },
  );

  assert.equal(parserOutput.extractedAtmosphere, "Reduction");
  assert.equal(parserOutput.extractedClayBody, "Porcelain");
  assert.equal(parserOutput.duplicateSourceUrl, true);
  assert.deepEqual(parserOutput.duplicateSha256s, ["abc123"]);
});

test("publish validation requires exactly two approved unique glazes", () => {
  const validMentions = [
    { matchedGlazeId: "glaze-1", isApproved: true },
    { matchedGlazeId: "glaze-2", isApproved: true },
  ];
  const singleMention = [{ matchedGlazeId: "glaze-1", isApproved: true }];
  const threeMentions = [
    { matchedGlazeId: "glaze-1", isApproved: true },
    { matchedGlazeId: "glaze-2", isApproved: true },
    { matchedGlazeId: "glaze-3", isApproved: true },
  ];

  assert.deepEqual(getApprovedMatchedGlazeIds(validMentions), ["glaze-1", "glaze-2"]);
  assert.equal(canPublishExternalExampleIntake("queued", validMentions), true);
  assert.equal(canPublishExternalExampleIntake("queued", singleMention), false);
  assert.equal(canPublishExternalExampleIntake("queued", threeMentions), false);
  assert.equal(canPublishExternalExampleIntake("duplicate", validMentions), false);
  assert.equal(canPublishExternalExampleIntake("published", validMentions), false);
});
