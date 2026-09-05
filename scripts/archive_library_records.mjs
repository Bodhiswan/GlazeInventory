// Read-only snapshot of glaze, combination, and image records, including private intake records.
import fs from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase admin connection is unavailable");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const tables = ["glazes", "glaze_firing_images", "community_firing_images", "combination_pairs",
  "combination_posts", "vendor_combination_examples", "vendor_combination_example_layers",
  "user_combination_examples", "user_combination_example_layers", "external_example_intakes",
  "external_example_assets", "external_example_glaze_mentions"];
const root = path.resolve("data/private-image-archive/records");
await fs.mkdir(root, { recursive: true });
const summary = {};
for (const table of tables) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from(table).select("*").order("id").range(offset, offset + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 500) break;
  }
  await fs.writeFile(path.join(root, `${table}.json`), JSON.stringify(rows, null, 2));
  summary[table] = rows.length;
  console.log(`${table}: ${rows.length} records`);
}
await fs.writeFile(path.join(root, "manifest.json"), JSON.stringify({ capturedAt: new Date().toISOString(), tables: summary }, null, 2));
