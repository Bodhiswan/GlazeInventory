<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Local Test Environment

## When to use it
- Any feature that touches data, auth, server actions, or RLS policies.
- New pages that read from the database.
- Changes to Supabase migrations.

## When to skip it
- Pure CSS/styling changes.
- Static content updates.
- Changes to `demo-data.ts` or client-only logic.

## Workflow
1. Before starting data-touching work, run `npm run dev:test` if not already running.
2. After making changes, use Claude Preview to open `http://localhost:3000` and visually verify.
3. Test the happy path AND at least one edge case (logged out, empty data, etc.).
4. If the feature involves RLS or auth, test as both the seeded test user and as a logged-out visitor.
5. Before declaring work complete, confirm `npm run build` passes and the dev server renders without console errors.

## Test user
- **Email:** `test@glazelibrary.app`
- **Password:** `testpassword123`
- **Login via Inbucket:** Open `http://localhost:54324` and click the magic link in the test user's inbox.

## Key URLs (local)
| Service          | URL                          |
|------------------|------------------------------|
| App              | http://localhost:3000         |
| Supabase Studio  | http://localhost:54323        |
| Inbucket (email) | http://localhost:54324        |
| Supabase API     | http://localhost:54321        |
| PostgreSQL       | postgresql://postgres:postgres@localhost:54322/postgres |

## Teardown
Run `npm run dev:test:stop` to stop local Supabase and free Docker resources.

# Pending cleanup

The following files are kept around as redirect stubs after the unified
contribution form launched at `/contribute`. They can be deleted once we're
confident no external links / inbound traffic still hits the old routes:

- Routes (currently redirect to `/contribute`):
  - `src/app/(app)/publish/page.tsx`
  - `src/app/(app)/glazes/new/page.tsx`
  - `src/app/(app)/contribute/firing-image/`
- Form components (no longer rendered anywhere):
  - `src/components/publish-combination-form.tsx`
  - `src/components/custom-glaze-form.tsx`
  - `src/app/(app)/contribute/firing-image/firing-image-form.tsx`
- Server actions (replaced by `submitContributionAction` in
  `src/app/actions/contribute.ts`):
  - `publishUserCombinationAction` in `src/app/actions/combinations.ts`
  - `createCustomGlazeAction` in `src/app/actions/inventory.ts`
  - `uploadCommunityFiringImageAction` in `src/app/actions/community.ts`

# Completing Work

When you finish a task or set of tasks, always end your final response with a short plain-English summary of what was done, followed by the word **Done.** on its own line. This lets the user know the work is complete without having to guess.
