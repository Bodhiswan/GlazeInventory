# Bounty / Points System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a points ledger that rewards users for adding glazes (+10), sharing combinations (+5), uploading firing photos (+2), leaving comments (+0.1, cap 50), voting on tags (+0.1, cap 50), and receiving ratings (+1 to author); surface scores on the Contribute page leaderboard and the user's profile; let admins void points and issue strikes (3 = contribution lockout).

**Architecture:** Points ledger table (`points_ledger`) stores one row per earning event; a cached `points` integer on `profiles` keeps leaderboard queries fast. Admins are fully excluded from earning or losing points. All point writes go through the `awardPoints()` helper in `src/lib/points.ts` using the admin Supabase client, bypassing RLS.

**Tech Stack:** Next.js 16 server actions (`"use server"`), Supabase (Postgres + admin client), TypeScript, Tailwind CSS.

---

## File Map

| Status | Path | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/20260407230000_add_points_system.sql` | DB schema: points_ledger table, profile columns, SQL helper fn |
| Modify | `src/lib/types.ts` | Add `points`, `contributionStrikes`, `contributionsDisabled` to `UserProfile` |
| Modify | `src/lib/data.ts` | Add `mapProfile` fields; add `getLeaderboard()`, `getUserPointsRank()` |
| Create | `src/lib/points.ts` | `awardPoints()` utility with admin exclusion, caps, ledger write |
| Modify | `src/app/actions.ts` | Add `requireContributingMember`; wire points into 5 existing actions; add `adminFlagFalseContributionAction` |
| Modify | `src/app/(app)/contribute/page.tsx` | Add "People to thank" leaderboard below the contribution cards |
| Modify | `src/app/(app)/profile/page.tsx` | Add points widget (score + global rank) |
| Modify | `src/app/(app)/admin/analytics/page.tsx` | Add "Flag as false contribution" button on glaze and combination cards |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260407230000_add_points_system.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260407230000_add_points_system.sql

-- 1. New columns on profiles
alter table profiles
  add column if not exists points                 integer not null default 0,
  add column if not exists contribution_strikes   integer not null default 0,
  add column if not exists contributions_disabled boolean not null default false;

-- 2. Points ledger table
create table if not exists points_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  action          text not null,
  points          numeric not null,
  reference_id    uuid,
  reference_type  text,
  voided          boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists points_ledger_user_id_idx on points_ledger(user_id);
create index if not exists points_ledger_reference_id_idx on points_ledger(reference_id);
create index if not exists points_ledger_action_idx on points_ledger(action);

-- 3. RLS on points_ledger
alter table points_ledger enable row level security;

-- Members can read their own ledger rows
create policy "members_read_own_ledger"
  on points_ledger for select
  using (auth.uid() = user_id);

-- No direct inserts/updates from clients — all writes go through admin client
```

- [ ] **Step 2: Apply the migration to production via Supabase MCP**

Use the Supabase MCP `apply_migration` tool with project `wrvtwhzmwokpfcsszuiu` and the SQL above. Confirm it succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260407230000_add_points_system.sql
git commit -m "feat: add points_ledger table and profile points columns"
```

---

## Task 2: Update Types and mapProfile

**Files:**
- Modify: `src/lib/types.ts` (lines 12–24)
- Modify: `src/lib/data.ts` (lines 378–399)

- [ ] **Step 1: Add fields to `UserProfile` in `src/lib/types.ts`**

Replace the `UserProfile` interface (currently ends at line 24):

```typescript
export interface UserProfile {
  id: string;
  email?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  studioName?: string | null;
  location?: string | null;
  isAdmin?: boolean;
  isAnonymous?: boolean;
  preferredCone?: string | null;
  preferredAtmosphere?: string | null;
  restrictToPreferredExamples?: boolean;
  points?: number;
  contributionStrikes?: number;
  contributionsDisabled?: boolean;
}
```

- [ ] **Step 2: Update `mapProfile` in `src/lib/data.ts` to read the new columns**

The `mapProfile` function currently ends with `restrictToPreferredExamples`. Add three lines inside the return object, after `restrictToPreferredExamples`:

```typescript
    points: typeof row.points === "number" ? row.points : 0,
    contributionStrikes: typeof row.contribution_strikes === "number" ? row.contribution_strikes : 0,
    contributionsDisabled: Boolean(row.contributions_disabled ?? false),
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/data.ts
git commit -m "feat: add points fields to UserProfile type and mapProfile"
```

---

## Task 3: Points Utility

**Files:**
- Create: `src/lib/points.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/points.ts
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PointsAction =
  | "glaze_added"
  | "combination_shared"
  | "firing_photo_uploaded"
  | "comment_left"
  | "tag_voted"
  | "upvote_received";

/** Actions that have a lifetime cap on total points earned */
const ACTION_CAPS: Partial<Record<PointsAction, number>> = {
  comment_left: 50,
  tag_voted: 50,
};

/**
 * Award points to a user. No-ops for admins.
 * Writes a ledger row and increments the cached total on profiles.
 */
export async function awardPoints(
  userId: string,
  isAdmin: boolean,
  action: PointsAction,
  points: number,
  referenceId?: string,
  referenceType?: string,
): Promise<void> {
  if (isAdmin) return;

  const admin = createSupabaseAdminClient();
  const cap = ACTION_CAPS[action];

  if (cap !== undefined) {
    const { data: rows } = await admin
      .from("points_ledger")
      .select("points")
      .eq("user_id", userId)
      .eq("action", action)
      .eq("voided", false);

    const earned = (rows ?? []).reduce((sum, r) => sum + Number(r.points), 0);
    if (earned >= cap) return;
  }

  await admin.from("points_ledger").insert({
    user_id: userId,
    action,
    points,
    reference_id: referenceId ?? null,
    reference_type: referenceType ?? null,
  });

  // Increment cached total on profiles (floored at 0 by DB default of 0)
  const { data: profile } = await admin
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single();

  await admin
    .from("profiles")
    .update({ points: Math.max(0, (profile?.points ?? 0) + points) })
    .eq("id", userId);
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/points.ts
git commit -m "feat: add awardPoints utility with admin exclusion and caps"
```

---

## Task 4: Contribution Gate

**Files:**
- Modify: `src/app/actions.ts`

- [ ] **Step 1: Add `requireContributingMember` helper after `requireMemberSupabase` (around line 204)**

```typescript
async function requireContributingMember(returnTo = "/contribute") {
  const context = await requireMemberSupabase(returnTo);
  if (context.viewer.profile.contributionsDisabled) {
    redirect(
      `${returnTo}?error=${encodeURIComponent(
        "Your contribution access has been disabled after repeated policy violations",
      )}`,
    );
  }
  return context;
}
```

- [ ] **Step 2: Replace `requireMemberSupabase` with `requireContributingMember` in the five contribution actions**

In each of these functions, change the first line:

| Function | Current line | Change to |
|---|---|---|
| `createCustomGlazeAction` | `requireMemberSupabase("/glazes/new")` | `requireContributingMember("/glazes/new")` |
| `publishUserCombinationAction` | `requireMemberSupabase("/publish")` | `requireContributingMember("/publish")` |
| `uploadCommunityFiringImageAction` | `requireMemberSupabase(...)` | `requireContributingMember("/contribute/firing-image")` |
| `addGlazeCommentAction` | `requireMemberSupabase(...)` | `requireContributingMember("/glazes")` |
| `toggleGlazeTagVoteAction` | `requireMemberSupabase(...)` | `requireContributingMember("/glazes")` |

For `addCombinationCommentInlineAction` (returns data, no redirect), add this check at the top of the function body after getting the viewer:

```typescript
if (viewer.profile.contributionsDisabled) {
  return { error: "Your contribution access has been disabled" };
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: gate contribution actions behind contributions_disabled check"
```

---

## Task 5: Award Points — Glaze Added

**Files:**
- Modify: `src/app/actions.ts` (`createCustomGlazeAction`, around line 736)

- [ ] **Step 1: Import `awardPoints` at the top of `src/app/actions.ts`**

Add to the existing imports block:

```typescript
import { awardPoints } from "@/lib/points";
```

- [ ] **Step 2: Call `awardPoints` in `createCustomGlazeAction` after the glaze insert succeeds (after line ~737, where the analytics event is fired)**

Add immediately after the `void supabase.from("analytics_events").insert(...)` call:

```typescript
  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "glaze_added",
    10,
    glaze.id,
    "glaze",
  );
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: award 10 points when a custom glaze is added"
```

---

## Task 6: Award Points — Combination Shared

**Files:**
- Modify: `src/app/actions.ts` (`publishUserCombinationAction`, around line 1208)

- [ ] **Step 1: Call `awardPoints` in `publishUserCombinationAction` after the analytics event (around line 1214)**

Add immediately after `void supabase.from("analytics_events").insert(...)`:

```typescript
  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "combination_shared",
    5,
    exampleRow.id,
    "combination",
  );
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: award 5 points when a combination is published"
```

---

## Task 7: Award Points — Firing Photo Uploaded

**Files:**
- Modify: `src/app/actions.ts` (`uploadCommunityFiringImageAction`, around line 1991)

- [ ] **Step 1: Call `awardPoints` in `uploadCommunityFiringImageAction` after the successful DB insert**

Find the `supabase.from("community_firing_images").insert(...)` call. After it succeeds (before returning `{ success: true }`), add:

```typescript
  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "firing_photo_uploaded",
    2,
    insertedRow.id,   // use the inserted row ID if selected, otherwise omit referenceId
    "community_image",
  );
```

If the insert doesn't currently select back the row ID, change the insert to `.select("id").single()` and use the returned `id` as `referenceId`. If that's not feasible, omit `referenceId` (pass `undefined`).

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: award 2 points when a community firing photo is uploaded"
```

---

## Task 8: Award Points — Comments

**Files:**
- Modify: `src/app/actions.ts` (`addGlazeCommentAction` and `addCombinationCommentInlineAction`)

- [ ] **Step 1: Add `awardPoints` call in `addGlazeCommentAction` after the successful insert**

```typescript
  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "comment_left",
    0.1,
    undefined,
    "comment",
  );
```

- [ ] **Step 2: Add `awardPoints` call in `addCombinationCommentInlineAction` after the successful insert (just before `return { authorName: ... }`)**

```typescript
  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "comment_left",
    0.1,
    undefined,
    "comment",
  );
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: award 0.1 points per comment (capped at 50 lifetime)"
```

---

## Task 9: Award Points — Tag Votes

**Files:**
- Modify: `src/app/actions.ts` (`toggleGlazeTagVoteAction`, around line 1547)

- [ ] **Step 1: Find the branch in `toggleGlazeTagVoteAction` that inserts a new vote (as opposed to deleting an existing one). Add `awardPoints` only in the insert branch.**

The function checks for an existing vote: if it exists → delete; if not → insert. Add inside the insert branch only:

```typescript
  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "tag_voted",
    0.1,
    undefined,
    "tag_vote",
  );
```

Do NOT add it in the delete branch — removing a vote does not award points.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: award 0.1 points per tag vote added (capped at 50 lifetime)"
```

---

## Task 10: Admin Strike Action

**Files:**
- Modify: `src/app/actions.ts`

- [ ] **Step 1: Add `adminFlagFalseContributionAction` near the other admin actions**

```typescript
export async function adminFlagFalseContributionAction(input: {
  referenceId: string;
  authorUserId: string;
}): Promise<{ error?: string; success?: true }> {
  await requireAdminSupabase();

  const admin = createSupabaseAdminClient();

  // 1. Find un-voided ledger rows for this reference
  const { data: rows } = await admin
    .from("points_ledger")
    .select("id, points")
    .eq("reference_id", input.referenceId)
    .eq("voided", false);

  const pointsToDeduct = (rows ?? []).reduce((sum, r) => sum + Number(r.points), 0);

  // 2. Void those rows
  if (rows && rows.length > 0) {
    await admin
      .from("points_ledger")
      .update({ voided: true })
      .eq("reference_id", input.referenceId)
      .eq("voided", false);
  }

  // 3. Load current profile state
  const { data: profile } = await admin
    .from("profiles")
    .select("points, contribution_strikes")
    .eq("id", input.authorUserId)
    .single();

  const newPoints = Math.max(0, (profile?.points ?? 0) - pointsToDeduct);
  const newStrikes = (profile?.contribution_strikes ?? 0) + 1;
  const shouldDisable = newStrikes >= 3;

  // 4. Apply strike + points deduction
  await admin
    .from("profiles")
    .update({
      points: newPoints,
      contribution_strikes: newStrikes,
      contributions_disabled: shouldDisable ? true : undefined,
    })
    .eq("id", input.authorUserId);

  return { success: true };
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: add adminFlagFalseContributionAction with strike system"
```

---

## Task 11: Leaderboard Data Helpers

**Files:**
- Modify: `src/lib/data.ts`

- [ ] **Step 1: Add the `LeaderboardEntry` interface to `src/lib/types.ts`**

```typescript
export interface LeaderboardEntry {
  id: string;
  displayName: string;
  studioName: string | null;
  points: number;
}
```

- [ ] **Step 2: Add `getLeaderboard` and `getUserPointsRank` to `src/lib/data.ts`**

Add near the end of the file, before the last closing bracket:

```typescript
export async function getLeaderboard(): Promise<import("@/lib/types").LeaderboardEntry[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, studio_name, points")
    .eq("contributions_disabled", false)
    .gt("points", 0)
    .order("points", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    displayName: (row.display_name as string | null) ?? "Glaze member",
    studioName: (row.studio_name as string | null) ?? null,
    points: typeof row.points === "number" ? row.points : 0,
  }));
}

export async function getUserPointsRank(userId: string): Promise<number> {
  const supabase = await getSupabase();
  if (!supabase) return 0;

  // Get the user's own points first
  const { data: self } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single();

  const userPoints = self?.points ?? 0;
  if (userPoints === 0) return 0;

  // Count how many profiles have strictly more points
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gt("points", userPoints);

  return (count ?? 0) + 1;
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/data.ts
git commit -m "feat: add getLeaderboard and getUserPointsRank data helpers"
```

---

## Task 12: Admin UI — Flag Button

**Files:**
- Modify: `src/app/(app)/admin/analytics/page.tsx`

- [ ] **Step 1: Import `adminFlagFalseContributionAction` at the top of the analytics page**

Add to the existing import from `@/app/actions`:

```typescript
import {
  adminArchiveCombinationAction,
  adminDeleteCustomGlazeAction,
  adminFlagFalseContributionAction,
} from "@/app/actions";
```

- [ ] **Step 2: Add a "Flag as false" form button to each combination card in the "Recent combinations" section**

Find where the combination cards are rendered (look for `recentCombinations.map` or similar). Inside each card, add a form alongside the existing action buttons:

```tsx
<form
  action={async () => {
    "use server";
    await adminFlagFalseContributionAction({
      referenceId: combo.id,
      authorUserId: combo.authorUserId,
    });
  }}
>
  <button
    type="submit"
    className="inline-flex items-center border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-100"
  >
    Flag as false
  </button>
</form>
```

Note: `combo.authorUserId` must be available from the dashboard data. If the current dashboard query doesn't include `author_user_id`, add it to the `getAdminDashboard` query in `src/lib/data.ts`.

- [ ] **Step 3: Add the same "Flag as false" button to each custom glaze card in the "Recent custom glazes" section**

```tsx
<form
  action={async () => {
    "use server";
    await adminFlagFalseContributionAction({
      referenceId: glaze.id,
      authorUserId: glaze.createdByUserId ?? "",
    });
  }}
>
  <button
    type="submit"
    className="inline-flex items-center border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-100"
  >
    Flag as false
  </button>
</form>
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/admin/analytics/page.tsx
git commit -m "feat: add flag-as-false-contribution button to admin analytics"
```

---

## Task 13: Contribute Page Leaderboard

**Files:**
- Modify: `src/app/(app)/contribute/page.tsx`

- [ ] **Step 1: Import `getLeaderboard` and update the page**

Replace the full file content with:

```tsx
import Link from "next/link";
import { Camera, Layers3, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireViewer } from "@/lib/data";
import { getLeaderboard } from "@/lib/data";

export default async function ContributePage() {
  await requireViewer();
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Contribute · Beta"
        title="Share your knowledge"
        description="Help build the library by sharing combination results or adding glazes that aren't in the catalog yet."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* ── Share a combination ── */}
        <Link
          href="/publish"
          className="group flex flex-col gap-4 border border-border bg-panel p-6 transition-colors hover:border-foreground/30 hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors group-hover:border-foreground/30">
            <Layers3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="space-y-1.5">
            <span className="block text-base font-medium text-foreground">Share a combination</span>
            <span className="block text-sm leading-6 text-muted">
              Document a kiln-tested layered result — fired surface photo, layer order, cone, and atmosphere. Helps others repeat or avoid it.
            </span>
          </span>
          <span className="mt-auto text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-foreground">
            Go to publish →
          </span>
        </Link>

        {/* ── Add a custom glaze ── */}
        <Link
          href="/glazes/new"
          className="group flex flex-col gap-4 border border-border bg-panel p-6 transition-colors hover:border-foreground/30 hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors group-hover:border-foreground/30">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="space-y-1.5">
            <span className="block text-base font-medium text-foreground">Add a custom glaze</span>
            <span className="block text-sm leading-6 text-muted">
              Got a studio glaze, recipe glaze, or brand not yet in the catalog? Add it so it appears in the library and combination search.
            </span>
          </span>
          <span className="mt-auto text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-foreground">
            Go to add glaze →
          </span>
        </Link>

        {/* ── Upload a firing photo ── */}
        <Link
          href="/contribute/firing-image"
          className="group flex flex-col gap-4 border border-border bg-panel p-6 transition-colors hover:border-foreground/30 hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors group-hover:border-foreground/30">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="space-y-1.5">
            <span className="block text-base font-medium text-foreground">Upload a firing photo</span>
            <span className="block text-sm leading-6 text-muted">
              Attach a fired result photo to any glaze or combination in the library. Helps others see real-world results across different kilns and bodies.
            </span>
          </span>
          <span className="mt-auto text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-foreground">
            Go to upload →
          </span>
        </Link>
      </div>

      {/* ── People to thank ── */}
      {leaderboard.length > 0 ? (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">People to thank</p>
            <p className="mt-1 text-sm text-muted">Top contributors who have helped build this library</p>
          </div>
          <div className="divide-y divide-border border border-border">
            {leaderboard.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{contributor.displayName}</p>
                  {contributor.studioName ? (
                    <p className="truncate text-xs text-muted">{contributor.studioName}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  {contributor.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/contribute/page.tsx
git commit -m "feat: add People to thank leaderboard on contribute page"
```

---

## Task 14: Profile Page Points Widget

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Import `getUserPointsRank` and fetch rank**

At the top of `ProfilePage`, after `const viewer = await requireViewer();`:

```typescript
  import { getUserPointsRank } from "@/lib/data";
  // ...inside the component:
  const rank = (viewer.profile.points ?? 0) > 0
    ? await getUserPointsRank(viewer.profile.id)
    : 0;
```

Note: Add this import at the top of the file with the existing `requireViewer` import.

- [ ] **Step 2: Add the points widget inside the `<Panel className="space-y-4">` (the right-hand explanatory panel), after the existing "Current defaults" box**

```tsx
{(viewer.profile.points ?? 0) > 0 ? (
  <div className="border border-border bg-panel p-4">
    <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Contribution points</p>
    <div className="mt-3 flex items-baseline gap-3">
      <span className="text-2xl font-semibold tabular-nums text-foreground">
        {(viewer.profile.points ?? 0).toLocaleString()}
      </span>
      <span className="text-sm text-muted">pts</span>
    </div>
    {rank > 0 ? (
      <p className="mt-1 text-sm text-muted">#{rank} globally</p>
    ) : null}
  </div>
) : null}

{viewer.profile.contributionsDisabled ? (
  <div className="border border-amber-200 bg-amber-50 p-4">
    <p className="text-sm text-amber-800">
      Your contribution access has been disabled after repeated policy violations. Contact support if you believe this is an error.
    </p>
  </div>
) : null}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: clean build, all pages compile.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/profile/page.tsx
git commit -m "feat: show points and global rank on profile page"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Glaze added → 10 pts (Task 5)
- [x] Combination shared → 5 pts (Task 6)
- [x] Firing photo uploaded → 2 pts (Task 7)
- [x] Comment → 0.1 pts, cap 50 (Task 8)
- [x] Tag vote → 0.1 pts, cap 50 (Task 9)
- [ ] Rating received → 1 pt to author — **deferred**: no rating server actions exist yet; requires building the rating UI/action before hooking in points
- [x] Admin exclusion (Task 3, `isAdmin` check in `awardPoints`)
- [x] Strike system, 3 strikes = disabled (Task 10)
- [x] Points reversed on false flag (Task 10)
- [x] Contribution gate (Task 4)
- [x] Leaderboard on contribute page (Task 13)
- [x] Points widget on profile (Task 14)
- [x] Admin flag button (Task 12)

**Known gap:** Upvote/rating points (1 pt per) require a rating server action that does not yet exist. When rating actions are added, wire in `awardPoints(..., "upvote_received", 1, ratedContentId, "rating")` for the content author.
