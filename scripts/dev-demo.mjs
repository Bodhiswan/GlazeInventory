/**
 * Starts Next.js dev server in demo mode (no Supabase).
 * Overrides the Supabase env vars with empty strings so the app
 * falls back to its built-in demo data without requiring auth.
 *
 * Usage: npm run dev:demo
 */
import { spawn } from "child_process";

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
};

const child = spawn("npx", ["next", "dev"], {
  env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
