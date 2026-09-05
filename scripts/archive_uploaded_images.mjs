// Read-only Supabase backup. Never writes to the hosted buckets or database.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase admin connection is unavailable");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const root = path.resolve("data/private-image-archive");
await fs.mkdir(root, { recursive: true });
const manifestPath = path.join(root, "manifest.json");
let previous = {};
try { previous = JSON.parse(await fs.readFile(manifestPath, "utf8")).entries; } catch {}
const entries = {};
const files = [];
async function readStorage(operation) {
  for (let attempt = 0; ; attempt++) {
    const result = await operation();
    if (!result.error) return result.data;
    if (attempt >= 4 || ![429, 500, 502, 503, 504].includes(Number(result.error.status))) throw result.error;
    await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
  }
}
const buckets = await readStorage(() => client.storage.listBuckets());
async function list(bucket, prefix = "") {
  for (let offset = 0; ; offset += 100) {
    const data = await readStorage(() => client.storage.from(bucket).list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } }));
    await new Promise(resolve => setTimeout(resolve, 200));
    for (const item of data) {
      const name = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id) await list(bucket, name);
      else if (item.metadata?.mimetype?.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif|avif|svg|bmp|tiff?)$/i.test(name)) {
        files.push({ bucket, name, updatedAt: item.updated_at, contentType: item.metadata?.mimetype });
      }
    }
    if (data.length < 100) break;
  }
}
for (const bucket of buckets) {
  const before = files.length;
  await list(bucket.name);
  console.log(`${bucket.name}: ${files.length - before} image objects`);
}
async function save() {
  const temp = `${manifestPath}.tmp`;
  await fs.writeFile(temp, JSON.stringify({ updatedAt: new Date().toISOString(), imageCount: files.length, entries }, null, 2));
  await fs.rename(temp, manifestPath);
}
let index = 0, completed = 0;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (index < files.length) {
    const item = files[index++];
    const id = `${item.bucket}/${item.name}`;
    try {
      const old = previous[id];
      if (old?.status === "downloaded" && old.updatedAt === item.updatedAt) {
        const bytes = await fs.readFile(path.join(root, old.path)).catch(() => null);
        if (bytes && crypto.createHash("sha256").update(bytes).digest("hex") === old.sha256) {
          entries[id] = old;
          continue;
        }
      }
      const data = await readStorage(() => client.storage.from(item.bucket).download(item.name));
      const bytes = Buffer.from(await data.arrayBuffer());
      const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
      const extension = path.extname(item.name).replace(/[^.a-z0-9]/gi, "") || ".image";
      const local = `objects/${sha256}${extension}`;
      await fs.mkdir(path.join(root, "objects"), { recursive: true });
      await fs.writeFile(path.join(root, local), bytes);
      entries[id] = { ...item, status: "downloaded", path: local, sha256, bytes: bytes.length };
    } catch (error) {
      entries[id] = { ...item, status: "failed", error: error.message };
    } finally {
      completed++;
      if (completed % 50 === 0) console.log(`${completed}/${files.length} objects processed`);
    }
  }
}));
await save();
console.log(JSON.stringify({ total: files.length, downloaded: Object.values(entries).filter(e => e.status === "downloaded").length, failed: Object.values(entries).filter(e => e.status === "failed").length }));
