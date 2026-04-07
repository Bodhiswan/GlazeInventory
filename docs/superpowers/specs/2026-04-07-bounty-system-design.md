# Bounty / Points System — Design Spec

**Date:** 2026-04-07
**Status:** Approved

---

## Overview

A points system that rewards users for contributing content to the Glaze Library. Points are cosmetic now — raw score on profile, global all-time leaderboard on the Contribute page — with the architecture in place to unlock features later. Admins are fully excluded from the system.

---

## Goals

- Drive contribution volume (glazes, combinations, firing photos)
- Surface and celebrate top contributors via a "people to thank" leaderboard
- Deter abuse with a strike-based moderation flow

---

## Point Values

| Action | Points | Notes |
|---|---|---|
| Add a new glaze to the catalog | **10 pts** | Per glaze, non-admin authors only |
| Share a combination (multi-layer kiln result) | **5 pts** | Per published combination example |
| Upload a community firing photo | **2 pts** | Per photo attached to a glaze or combination |
| Leave a comment | **0.1 pts** | Capped at **50 pts total** across all comments |
| Vote on a glaze tag | **0.1 pts** | Capped at **50 pts total** across all tag votes |
| Receive an upvote/rating on your content | **1 pt** | Awarded to the content author, per rating received |

---

## Architecture: Points Ledger

**Approach:** A `points_ledger` table (one row per earning event) combined with a cached `points` total on `profiles` for fast leaderboard reads.

### New table: `points_ledger`

```sql
create table points_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  action          text not null,  -- see enum below
  points          numeric not null,
  reference_id    uuid,           -- the glaze / combo / photo that triggered it
  reference_type  text,           -- 'glaze' | 'combination' | 'community_image' | 'comment' | 'tag_vote' | 'rating'
  voided          boolean not null default false,
  created_at      timestamptz not null default now()
);
```

**Action enum values:** `glaze_added`, `combination_shared`, `firing_photo_uploaded`, `comment_left`, `tag_voted`, `upvote_received`

### Additions to `profiles`

```sql
alter table profiles
  add column points                 integer not null default 0,
  add column contribution_strikes   integer not null default 0,
  add column contributions_disabled boolean not null default false;
```

---

## Point Earning Logic

Every contribution server action that awards points does the following **atomically**:

1. Writes the contribution (glaze, combination, photo, comment, etc.)
2. Inserts a row into `points_ledger`
3. Increments `profiles.points` by the awarded amount

**Admin exclusion:** If `profiles.is_admin = true` for the acting user, skip steps 2 and 3 entirely. No ledger rows are ever written for admins, so testing and moderation actions have no effect on the points system.

**Comment and tag vote caps:** Before awarding 0.1 pts, the action queries the user's un-voided ledger total for that action type (`comment_left` or `tag_voted`). If they have already reached 50 pts from that action type, no ledger row is inserted and no points are awarded.

**Upvote/rating points:** When a user submits a rating for a glaze or combination, the *author* of that content earns 1 pt. A ledger row is inserted for the author (`action = 'upvote_received'`, `reference_id` = the rated content). The rater earns nothing.

**Contribution gate:** Every contribution server action checks `profiles.contributions_disabled` at the start. If `true`, the action returns an error immediately and the UI shows a locked/disabled state on all contribution forms.

---

## Strike System (Admin-Initiated)

When an admin flags a glaze, combination, or community photo as a false contribution:

1. Find all un-voided `points_ledger` rows where `reference_id` matches the flagged content
2. Set `voided = true` on those rows
3. Deduct their points sum from `profiles.points` (floor at 0)
4. Increment `profiles.contribution_strikes` by 1
5. If `contribution_strikes >= 3`, set `contributions_disabled = true`

This action is triggered from the existing admin analytics/moderation dashboard — no new admin page required. The admin themselves never has their own points affected.

---

## UI

### Contribute page (`/contribute`)

Below the three contribution cards, a **"People to thank"** section:
- All-time leaderboard, ordered by `profiles.points DESC`
- Shows top 20 contributors
- Each row: avatar, display name, studio name (if set), points total
- No monthly view to start — can be added later without schema changes

### Profile page (`/profile`)

A small widget visible only to the signed-in user:
- Shows their total points and global rank (e.g. "247 pts · #12 globally")
- Hidden entirely if points = 0
- If `contributions_disabled = true`, show a clear message explaining they have been locked out of contributing

---

## What's Explicitly Out of Scope

- Named tiers or badges (may be added later)
- Monthly leaderboards (architecture supports it, not built now)
- Point redemption or unlocking features (cosmetic only for now)
- Per-contribution public point history (ledger is internal/admin only)

---

## Open Questions / Future Considerations

- **Point decay?** Not in scope, but the ledger `created_at` field supports time-weighted scoring later.
- **Appeal process for strikes?** Not in scope — admin decision is final for now.
- **Public profile scores?** Currently only the signed-in user sees their own score. Leaderboard is public.
