/**
 * Starts the full local test environment:
 *   1. Checks Docker is running
 *   2. Starts local Supabase (idempotent)
 *   3. Resets DB (applies all migrations + seed data)
 *   4. Starts Next.js dev server pointed at local Supabase
 *
 * Usage: npm run dev:test
 */
import { execSync, spawn } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/** Run a command synchronously, returning true if it succeeds. */
function run(cmd, label) {
  console.log(`\n▶ ${label}...`);
  try {
    execSync(cmd, { cwd: root, stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

/** Parse a .env file into an object. */
function parseEnvFile(filePath) {
  const vars = {};
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return vars;
}

// ── 1. Check Docker ──────────────────────────────────────────
console.log("\n▶ Checking Docker...");
try {
  execSync("docker info", { stdio: "ignore" });
} catch {
  console.error(
    "\n✖ Docker is not running.\n" +
    "  Start Docker Desktop and try again.\n"
  );
  process.exit(1);
}
console.log("  ✔ Docker is running.");

// ── 2. Start Supabase (idempotent) ──────────────────────────
run("npx supabase start", "Starting local Supabase");

// ── 3. Reset DB (migrations + seed) ─────────────────────────
if (!run("npx supabase db reset", "Resetting database (migrations + seed)")) {
  console.error("\n✖ Database reset failed. Check migration errors above.\n");
  process.exit(1);
}

// ── 4. Load .env.local.test and start Next.js ────────────────
const testEnv = parseEnvFile(resolve(root, ".env.local.test"));

const env = {
  ...process.env,
  ...testEnv,
  // Ensure the legacy anon key alias is also set
  NEXT_PUBLIC_SUPABASE_ANON_KEY: testEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

console.log("\n▶ Starting Next.js dev server (local Supabase)...\n");

const child = spawn("npx", ["next", "dev"], {
  env,
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
