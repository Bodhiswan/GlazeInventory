<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Release ownership

- Codex is the default owner for Vercel, production pushes, deploy checks, and live URL verification unless the user explicitly delegates that to another agent.
- Do not assume a branch push means production is live. Verify the deployed URL after release.

# Release workflow

Use this whenever the user asks to "push live", "deploy", "publish", or otherwise make changes public.

1. Make the code/content changes on the working branch.
2. If the change adds or materially updates a user-facing feature or guide section, update `src/lib/changelog.ts` before the release push.
3. Run `npm run build` before release when the change affects app code.
4. If the work is on a feature branch, commit and push that branch first.
5. Promote the intended release changes to `main` without dragging in unrelated local work.
6. Verify the production deployment with Vercel tools when available.
7. Verify the public URL directly after deploy and report the result clearly.

# Guide publishing workflow

For guide-section releases, use this checklist:

1. Research files written to the relevant `data/guides/research/<topic>/` folder.
2. Arbitration notes added to `data/guides/research/arbitration/conflicts.md` when there is a real disagreement.
3. Content component created under `src/app/guides/glazing-pottery/[slug]/`.
4. `src/app/guides/glazing-pottery/[slug]/page.tsx` wired to the new content.
5. `src/app/guides/glazing-pottery/guide-data.ts` updated.
6. `src/app/sitemap.ts` updated if the section is live.
7. `src/lib/changelog.ts` updated before the release push.
8. Production guide URL verified after deploy.

# Completing Work

When you finish a task or set of tasks, always end your final response with a short plain-English summary of what was done, followed by the word **Done.** on its own line. This lets the user know the work is complete without having to guess.
