import assert from "node:assert/strict";
import test from "node:test";

import { compactCombinationBrowserPayload } from "../src/lib/combination-browser-payload";
import type { CombinationPost, Glaze, UserCombinationExample, VendorCombinationExample } from "../src/lib/types";

const glaze: Glaze = {
  id: "glaze-1",
  sourceType: "commercial",
  name: "Green Opal",
  brand: "Mayco",
  code: "SW-253",
  description: "A deliberately long vendor description that the listing does not render.",
  recipeNotes: "Recipe detail that the combination preview does not use.",
  imageUrl: "https://example.com/glaze.jpg",
  createdAt: "2026-08-01T00:00:00.000Z",
};

const example: VendorCombinationExample = {
  id: "example-1",
  sourceVendor: "Mayco",
  sourceCollection: "glaze-combinations",
  sourceKey: "source-key",
  sourceUrl: "https://example.com/source",
  title: "Green Opal over Blue",
  imageUrl: "https://example.com/example.jpg",
  applicationNotes: "Three coats over two coats.",
  firingNotes: "Fire to cone 6.",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  viewerOwnsAllGlazes: false,
  viewerOwnedLayerCount: 0,
  layers: [
    {
      id: "layer-1",
      exampleId: "example-1",
      glazeId: glaze.id,
      glaze,
      glazeCode: glaze.code,
      glazeName: glaze.name,
      layerOrder: 0,
      connectorToNext: "under",
      sourceImageUrl: "https://example.com/layer.jpg",
    },
    {
      id: "layer-2",
      exampleId: "example-1",
      glazeId: glaze.id,
      glaze,
      glazeCode: glaze.code,
      glazeName: glaze.name,
      layerOrder: 1,
    },
  ],
};

test("combination payload preserves searchable notes and preview details while trimming repeated glazes", () => {
  const payload = compactCombinationBrowserPayload({
    examples: [example],
    publishedPosts: [],
    userExamples: [],
  });
  const compactExample = payload.examples[0];
  const firstGlaze = compactExample.layers[0].glaze;
  const secondGlaze = compactExample.layers[1].glaze;

  assert.deepEqual(compactExample, {
    ...example,
    layers: example.layers.map((layer) => ({ ...layer, glaze: firstGlaze })),
  });
  assert.equal(firstGlaze?.description, undefined);
  assert.equal(firstGlaze?.recipeNotes, undefined);
  assert.equal(firstGlaze, secondGlaze);
  assert.equal(example.layers[0].glaze, glaze);
  assert.ok(glaze.description);
});

test("preserves community post order, user notes, ownership, and unmatched layers", () => {
  const secondGlaze = { ...glaze, id: "glaze-2", name: "Blue" };
  const post: CombinationPost = {
    id: "post-1", authorUserId: "user-1", authorName: "Potter",
    combinationPairId: "pair-1", pairKey: "glaze-2__glaze-1",
    glazes: [secondGlaze, glaze], imagePath: "/result.jpg",
    caption: "Blue over green", applicationNotes: "Two coats", firingNotes: "Cone 6",
    visibility: "members", status: "published", createdAt: "2026-08-01",
  };
  const userExample: UserCombinationExample = {
    id: "user-example-1", authorUserId: "user-1", authorName: "Potter",
    title: "My test", imageUrls: ["/test.jpg"], cone: "6",
    notes: "Thin rim", glazingProcess: "Dipped", kilnNotes: "Slow cool",
    status: "published", createdAt: "2026-08-01",
    viewerOwnsAllGlazes: false, viewerOwnedLayerCount: 1,
    layers: [
      { id: "owned", exampleId: "user-example-1", glazeId: glaze.id, glaze, layerOrder: 0 },
      { id: "missing", exampleId: "user-example-1", glazeId: "missing", glaze: null, layerOrder: 1 },
    ],
  };
  const payload = compactCombinationBrowserPayload({
    examples: [example], publishedPosts: [post, { ...post, glazes: undefined }],
    userExamples: [userExample],
  });
  const compactGlaze = payload.examples[0].layers[0].glaze;
  assert.deepEqual(payload.publishedPosts[0], {
    ...post, glazes: [{ ...compactGlaze, id: secondGlaze.id, name: secondGlaze.name }, compactGlaze],
  });
  assert.equal(payload.publishedPosts[1].glazes, undefined);
  assert.deepEqual(payload.userExamples[0], {
    ...userExample,
    layers: [{ ...userExample.layers[0], glaze: compactGlaze }, userExample.layers[1]],
  });
});
