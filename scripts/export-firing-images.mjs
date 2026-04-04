/**
 * Export glaze_firing_images from Supabase via `supabase db query` (bypasses RLS).
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outFile = resolve(root, "data/catalog/firing-images.json");

console.log("Fetching firing images via supabase db query...");

// Fetch in chunks by glaze brand letter to stay under response limits
const sql = `SELECT id, glaze_id, label, cone, atmosphere, image_url, sort_order FROM glaze_firing_images ORDER BY glaze_id, sort_order, created_at`;

const raw = execSync(
  `npx supabase db query --linked --output json "${sql}"`,
  { cwd: root, encoding: "utf-8", shell: true, maxBuffer: 100 * 1024 * 1024 },
);

const parsed = JSON.parse(raw);
const allImages = parsed.rows ?? parsed ?? [];
console.log(`  ${allImages.length} firing images`);

const grouped = {};
for (const img of allImages) {
  const gid = img.glaze_id;
  if (!grouped[gid]) grouped[gid] = [];
  grouped[gid].push({
    id: img.id,
    label: img.label,
    cone: img.cone,
    atmosphere: img.atmosphere,
    imageUrl: img.image_url,
    sortOrder: img.sort_order,
  });
}

writeFileSync(outFile, JSON.stringify(grouped));
console.log(`Wrote firing-images.json (${Object.keys(grouped).length} glazes)`);
