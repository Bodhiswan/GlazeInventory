/**
 * deploy.mjs — run with `npm run deploy`
 *
 * 1. Pushes to GitHub (for backup/history)
 * 2. Temporarily removes the GitHub remote so Vercel CLI doesn't try to
 *    use the (private-repo-incompatible) GitHub integration
 * 3. Deploys to Vercel production
 * 4. Restores the GitHub remote
 */

import { execSync } from "child_process";

const GITHUB_REMOTE = "https://github.com/Bodhiswan/GlazeInventory.git";

function run(cmd, label) {
  console.log(`\n▶ ${label ?? cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
}

// 1. Push to GitHub
run("git push origin main", "Pushing to GitHub...");

// 2. Remove remote so Vercel CLI deploys without GitHub integration
run("git remote remove origin", "Detaching GitHub remote for deploy...");

try {
  // 3. Deploy to Vercel production
  run("npx vercel deploy --prod", "Deploying to Vercel...");
} finally {
  // 4. Always restore the remote, even if deploy fails
  run(`git remote add origin ${GITHUB_REMOTE}`, "Restoring GitHub remote...");
}
