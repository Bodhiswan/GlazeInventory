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
if (!run("npx supabase start", "Starting local Supabase")) {
  console.error("\n✖ Supabase failed to start. Check Docker and port availability.\n");
  process.exit(1);
}

// ── 3. Reset DB (migrations + seed) ─────────────────────────
// supabase db reset may exit non-zero due to a storage health-check timeout
// even when migrations + seed succeeded. Capture output to check for real failures.
console.log("\n▶ Resetting database (migrations + seed)...");
try {
  execSync("npx supabase db reset", {
    cwd: root,
    stdio: ["inherit", "inherit", "pipe"],
    timeout: 300_000,
  });
} catch (e) {
  const stderr = e.stderr?.toString() ?? "";
  // If the only error is a storage/container timeout, warn but continue
  if (stderr.includes("context deadline exceeded") && !stderr.includes("ERROR")) {
    console.warn("\n⚠ Storage health-check timed out (non-fatal). Continuing...\n");
  } else {
    console.error("\n✖ Database reset failed. Check migration errors above.\n");
    process.exit(1);
  }
}

// ── 4. Restart auth + gateway (required after DB reset) ─────
// supabase db reset recreates the auth schema, but GoTrue keeps a stale
// connection. Restarting auth and the API gateway fixes this.
console.log("\n▶ Restarting auth services...");
try {
  execSync("docker restart supabase_auth_glaze-library supabase_kong_glaze-library", {
    cwd: root,
    stdio: "ignore",
    timeout: 30_000,
  });
  // Give GoTrue time to reconnect to the database
  execSync("node -e \"setTimeout(()=>{},8000)\"", { stdio: "ignore" });
  console.log("  ✔ Auth services restarted.");
} catch {
  console.warn("  ⚠ Could not restart auth services (non-fatal).\n");
}

// ── 5. Read keys from running Supabase instance ─────────────
// The CLI generates keys dynamically — we parse them from `supabase status`.
console.log("\n▶ Reading local Supabase keys...");
let statusOutput;
try {
  statusOutput = execSync("npx supabase status", { cwd: root, encoding: "utf-8" });
} catch {
  console.error("\n✖ Could not read Supabase status.\n");
  process.exit(1);
}

function extractField(output, label) {
  const re = new RegExp(`${label}\\s*│\\s*(\\S+)`);
  const m = output.match(re);
  return m?.[1] ?? "";
}

const supabaseUrl = extractField(statusOutput, "Project URL");
const publishableKey = extractField(statusOutput, "Publishable");
const secretKey = extractField(statusOutput, "Secret");

if (!publishableKey || !secretKey) {
  console.error("\n✖ Could not parse Supabase keys from status output.\n");
  process.exit(1);
}

console.log(`  URL:  ${supabaseUrl}`);
console.log(`  Key:  ${publishableKey.slice(0, 20)}...`);

// ── 5. Start Next.js pointed at local Supabase ──────────────
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
  SUPABASE_SERVICE_ROLE_KEY: secretKey,
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

console.log("\n▶ Starting Next.js dev server (local Supabase)...\n");

const child = spawn("npx", ["next", "dev"], {
  env,
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
