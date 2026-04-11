/**
 * Export static catalog data from Supabase into JSON files.
 *
 * Usage:  node scripts/export-catalog.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "data/catalog");

// Load env
const envFile = readFileSync(resolve(root, ".env.local"), "utf-8");
function env(key) {
  const match = envFile.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match?.[1]?.trim();
}

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing SUPABASE_URL or ANON_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function fetchAll(table, query = "", orderBy = "created_at,id") {
  const rows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const orderParams = orderBy
      .split(",")
      .map((col) => `order=${col.trim()}.asc`)
      .join("&");
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query ? query + "&" : ""}${orderParams}&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${table}: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    rows.push(...data);

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function fetchViaSql(sql) {
  const { execSync } = await import("child_process");
  const result = execSync(`npx supabase db query --linked "${sql.replace(/"/g, '\\"')}"`, {
    cwd: root,
    encoding: "utf-8",
    shell: true,
    maxBuffer: 50 * 1024 * 1024,
  });

  const jsonStart = result.indexOf("{");
  const jsonEnd = result.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const payload = JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    return Array.isArray(payload.rows) ? payload.rows : [];
  }

  throw new Error("Could not parse JSON output from `supabase db query`.");
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  console.log("Fetching glazes...");
  const glazes = await fetchAll("glazes", "created_by_user_id=is.null");
  console.log(`  ${glazes.length} glazes`);

  console.log("Fetching glaze_brand_lines...");
  const brandLines = await fetchAll("glaze_brand_lines", "", "brand,line");
  console.log(`  ${brandLines.length} brand/lines`);

  console.log("Fetching vendor_combination_examples...");
  const examples = await fetchAll("vendor_combination_examples");
  console.log(`  ${examples.length} examples`);

  console.log("Fetching vendor_combination_example_layers...");
  const layers = await fetchAll("vendor_combination_example_layers", "", "example_id,layer_order,created_at");
  console.log(`  ${layers.length} layers`);

  console.log("Fetching glaze_firing_images via supabase db query...");
  const firingImages = await fetchViaSql(
    `SELECT id, glaze_id, label, cone, atmosphere, image_url, sort_order FROM glaze_firing_images ORDER BY glaze_id, sort_order, created_at`
  );
  console.log(`  ${firingImages.length} firing images`);

  console.log("Fetching glaze_tags...");
  const tags = await fetchAll("glaze_tags");
  console.log(`  ${tags.length} tags`);

  // Nest layers into examples
  const layersByExample = new Map();
  for (const layer of layers) {
    const eid = layer.example_id;
    if (!layersByExample.has(eid)) layersByExample.set(eid, []);
    layersByExample.get(eid).push({
      id: layer.id,
      glaze_id: layer.glaze_id,
      glaze_code: layer.glaze_code,
      glaze_name: layer.glaze_name,
      layer_order: layer.layer_order,
      connector_to_next: layer.connector_to_next,
      source_image_url: layer.source_image_url,
    });
  }

  const examplesWithLayers = examples.map((ex) => ({
    id: ex.id,
    source_vendor: ex.source_vendor,
    source_collection: ex.source_collection,
    source_key: ex.source_key,
    source_url: ex.source_url,
    title: ex.title,
    image_url: ex.image_url,
    cone: ex.cone,
    atmosphere: ex.atmosphere,
    clay_body: ex.clay_body,
    application_notes: ex.application_notes,
    firing_notes: ex.firing_notes,
    layers: layersByExample.get(ex.id) ?? [],
  }));

  // Group firing images by glaze_id
  const firingImagesByGlaze = {};
  for (const img of firingImages) {
    const gid = img.glaze_id;
    if (!firingImagesByGlaze[gid]) firingImagesByGlaze[gid] = [];
    firingImagesByGlaze[gid].push({
      id: img.id,
      label: img.label,
      cone: img.cone,
      atmosphere: img.atmosphere,
      imageUrl: img.image_url,
      sortOrder: img.sort_order,
    });
  }

  // Write files
  writeFileSync(resolve(outDir, "glazes.json"), JSON.stringify(glazes, null, 2));
  console.log(`Wrote glazes.json`);

  writeFileSync(resolve(outDir, "glaze-brand-lines.json"), JSON.stringify(brandLines, null, 2));
  console.log(`Wrote glaze-brand-lines.json`);

  writeFileSync(resolve(outDir, "combination-examples.json"), JSON.stringify(examplesWithLayers, null, 2));
  console.log(`Wrote combination-examples.json`);

  writeFileSync(resolve(outDir, "firing-images.json"), JSON.stringify(firingImagesByGlaze, null, 2));
  console.log(`Wrote firing-images.json`);

  if (tags.length) {
    writeFileSync(resolve(outDir, "tags.json"), JSON.stringify(tags, null, 2));
    console.log(`Wrote tags.json`);
  } else {
    console.log(`Skipped tags.json (RLS blocked, keeping existing file)`);
  }

  console.log("\nDone! Static catalog exported to data/catalog/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
