import test from "node:test";
import assert from "node:assert/strict";

import { getAllCatalogGlazes } from "../src/lib/catalog";
import { mapInventoryItem } from "../src/lib/data/inventory";

test("mapInventoryItem resolves a bundled catalog glaze without a database join", () => {
  const catalogGlaze = getAllCatalogGlazes()[0];

  const item = mapInventoryItem({
    id: "7d5a4f35-3e1c-4d63-9a04-6fa3ca9d2e2d",
    user_id: "2b2f6c4d-72f4-4db3-8e08-ec928d1cfb55",
    glaze_id: catalogGlaze.id,
    status: "owned",
    personal_notes: null,
    created_at: "2026-08-02T00:00:00.000Z",
    inventory_item_folders: [],
  });

  assert.ok(item);
  assert.equal(item.glaze.id, catalogGlaze.id);
  assert.equal(item.glaze.name, catalogGlaze.name);
});

test("mapInventoryItem skips an unresolved stale glaze instead of rendering blank data", () => {
  const item = mapInventoryItem({
    id: "7d5a4f35-3e1c-4d63-9a04-6fa3ca9d2e2d",
    user_id: "2b2f6c4d-72f4-4db3-8e08-ec928d1cfb55",
    glaze_id: "b2a7f5b2-5b89-4dd7-a2b2-6e0c9c2f9a2c",
    status: "owned",
    personal_notes: null,
    created_at: "2026-08-02T00:00:00.000Z",
    inventory_item_folders: [],
  });

  assert.equal(item, null);
});
