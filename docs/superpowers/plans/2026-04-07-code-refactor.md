# Code Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split three monolithic files (`lib/data.ts`, `app/actions.ts`, `lib/utils.ts`) into domain-scoped modules with no behavioral changes.

**Architecture:** Each monolithic file is split into domain files (glazes, combinations, inventory, users, community, admin, auth, profile). All consumers update their imports to point directly at the domain file — no barrel wrappers. Each split is verified with `npm test` before moving on.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, React Server Components

**Working directory:** All work is done in `.worktrees/v2-refactor` (branch `v2-refactor`). Never touch `main`.

---

## Conventions

- Every new `app/actions/` file must start with `"use server";`
- Copy the function body exactly — no refactoring
- After each task: run `npm test` from the worktree root and confirm all 15 tests pass
- Commit after each task with a short message like `refactor: split data.ts → users`

---

## Task 1: Extract `lib/glaze-metadata.ts` from `lib/utils.ts`

**Files:**
- Create: `src/lib/glaze-metadata.ts`
- Modify: `src/lib/utils.ts` (remove moved exports)
- Modify: `src/app/(app)/glazes/page.tsx`
- Modify: `src/app/(app)/glazes/[glazeId]/page.tsx`
- Modify: `src/components/glaze-catalog-explorer.tsx`

- [ ] **Step 1: Read `src/lib/utils.ts` lines 1–200** to see the exact text of `ACTIVE_GLAZE_BRANDS`, `GLAZE_FAMILY_LABELS`, `brandLineFamilyMap`, `BRAND_URLS`, `getManufacturerUrl`, and `getGlazeFamilyTraits`.

- [ ] **Step 2: Create `src/lib/glaze-metadata.ts`** with the following content (copy exact text from utils.ts):

```ts
import vendorVisualTraits from "@data/vendors/vendor-visual-traits.json";
import type { Glaze } from "@/lib/types";

// --- paste ACTIVE_GLAZE_BRANDS here ---
// --- paste GLAZE_FAMILY_LABELS here ---
// --- paste brandLineFamilyMap (private) here ---
// --- paste BRAND_URLS (private) here ---
// --- paste getManufacturerUrl here ---
// --- paste getGlazeFamilyTraits here ---
```

Adjust imports: only include what these functions actually need (check what vendorVisualTraits is used for — if not needed here, omit it).

- [ ] **Step 3: Remove from `src/lib/utils.ts`** the following (delete them, keeping everything else):
  - `ACTIVE_GLAZE_BRANDS`
  - `GLAZE_FAMILY_LABELS`
  - `brandLineFamilyMap` (private const)
  - `BRAND_URLS` (private const)
  - `getManufacturerUrl`
  - `getGlazeFamilyTraits`

- [ ] **Step 4: Update consumer imports**

`src/app/(app)/glazes/page.tsx` — change:
```ts
import { ACTIVE_GLAZE_BRANDS } from "@/lib/utils";
```
to:
```ts
import { ACTIVE_GLAZE_BRANDS } from "@/lib/glaze-metadata";
```

`src/app/(app)/glazes/[glazeId]/page.tsx` — split the `@/lib/utils` import:
- Move `getGlazeFamilyTraits` and `getManufacturerUrl` to a new import from `@/lib/glaze-metadata`
- Leave remaining utils imports unchanged

`src/components/glaze-catalog-explorer.tsx` — split the `@/lib/utils` import:
- Move `getGlazeFamilyTraits` and `getManufacturerUrl` to a new import from `@/lib/glaze-metadata`
- Leave remaining utils imports unchanged

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/lib/glaze-metadata.ts src/lib/utils.ts src/app src/components && git commit -m "refactor: extract glaze-metadata from utils"
```

---

## Task 2: Split `lib/data.ts` → `lib/data/users.ts`

**Files:**
- Create: `src/lib/data/users.ts`
- Modify: `src/lib/data.ts` (remove moved exports)
- Modify: many consumer files (listed in Step 3)

- [ ] **Step 1: Read `src/lib/data.ts` lines 1–130** (imports + module-level helpers) and lines 531–585 (`getViewer`, `getPublicGuestViewer`, `requireViewer`) and lines 2467–2595 (end of file: `getAdminUsers`, `AdminUserRow`, `getAllUsersForAdmin`, `getAllDisplayNames`, `lookupUserIdByDisplayName`).

- [ ] **Step 2: Create `src/lib/data/users.ts`**

Copy these exports from `data.ts` (preserving exact code):
- `getViewer`
- `getPublicGuestViewer`
- `requireViewer`
- `getAdminUsers`
- `AdminUserRow` (interface)
- `getAllUsersForAdmin`
- `getAllDisplayNames`
- `lookupUserIdByDisplayName`

Also copy any private module-level values only used by these functions:
- `demoViewer` (used by `getViewer`)
- `publicGuestViewer` (used by `getPublicGuestViewer`)

File header imports (copy from data.ts, keep only what these functions use):
```ts
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { demoProfiles } from "@/lib/demo-data";
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile, Viewer } from "@/lib/types";
// add any others the functions actually reference
```

- [ ] **Step 3: Remove the moved functions from `src/lib/data.ts`** (delete `getViewer`, `getPublicGuestViewer`, `requireViewer`, `demoViewer`, `publicGuestViewer`, `getAdminUsers`, `AdminUserRow`, `getAllUsersForAdmin`, `getAllDisplayNames`, `lookupUserIdByDisplayName`).

- [ ] **Step 4: Update consumer imports** — for each file below, change `"@/lib/data"` imports that reference moved symbols to `"@/lib/data/users"`. Files that import other things from `@/lib/data` keep a separate import for those.

Files importing `requireViewer`:
- `src/app/(app)/admin/analytics/[userId]/page.tsx`
- `src/app/(app)/admin/analytics/moderation/page.tsx`
- `src/app/(app)/admin/analytics/page.tsx`
- `src/app/(app)/admin/intake/[intakeId]/page.tsx`
- `src/app/(app)/admin/intake/page.tsx`
- `src/app/(app)/admin/moderation/page.tsx`
- `src/app/(app)/admin/users/page.tsx`
- `src/app/(app)/community/page.tsx`
- `src/app/(app)/contribute/firing-image/page.tsx`
- `src/app/(app)/contribute/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/glazes/[glazeId]/page.tsx`
- `src/app/(app)/glazes/new/page.tsx`
- `src/app/(app)/glazes/page.tsx`
- `src/app/(app)/inventory/[inventoryId]/edit/page.tsx`
- `src/app/(app)/inventory/new/page.tsx`
- `src/app/(app)/inventory/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/profile/page.tsx`
- `src/app/(app)/publish/page.tsx`

Files importing `getViewer`:
- `src/app/auth/reset-password/page.tsx`
- `src/app/combinations/layout.tsx`
- `src/app/page.tsx`
- `src/components/auth-entry-page.tsx`
- `src/components/auth-sign-up-page.tsx`
- `src/components/home-landing-page.tsx`

Files importing `getAllUsersForAdmin`:
- `src/app/(app)/admin/users/page.tsx`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/lib/data/ src/lib/data.ts src/app src/components && git commit -m "refactor: split data.ts → data/users"
```

---

## Task 3: Split `lib/data.ts` → `lib/data/inventory.ts`

**Files:**
- Create: `src/lib/data/inventory.ts`
- Modify: `src/lib/data.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/lib/data.ts` lines 586–696** (`getCatalogGlazes`, `getInventoryOwnership`, `getInventory`, `getInventoryFolders`, `getInventoryItem`). Also check lines 62–75 for any private helpers these functions use (`catalogGlazeByCode`, `getBundledVendorImageUrl`).

- [ ] **Step 2: Create `src/lib/data/inventory.ts`**

Copy these exports:
- `getCatalogGlazes`
- `getInventoryOwnership`
- `getInventory`
- `getInventoryFolders`
- `getInventoryItem`

Copy private helpers used exclusively by these functions (check `catalogGlazeByCode` usage — if it's also used by glazes functions, put it in a `src/lib/data/shared.ts` file instead and import from there).

File header (copy only what's needed):
```ts
import { cache } from "react";
import { demoGlazes, demoInventory, demoInventoryFolders } from "@/lib/demo-data";
import { getSupabaseEnv } from "@/lib/env";
import { parseInventoryState } from "@/lib/inventory-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllCatalogGlazes, getCatalogGlazeById } from "@/lib/catalog";
import { formatGlazeLabel } from "@/lib/utils";
import type { Glaze, InventoryFolder, InventoryItem, Viewer } from "@/lib/types";
import { requireViewer } from "@/lib/data/users";
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions from `src/lib/data.ts`.**

- [ ] **Step 4: Update consumer imports** — move `getCatalogGlazes`, `getInventoryOwnership`, `getInventory`, `getInventoryFolders`, `getInventoryItem` to import from `@/lib/data/inventory`:

- `src/app/(app)/admin/intake/[intakeId]/page.tsx` — `getCatalogGlazes`
- `src/app/(app)/contribute/firing-image/page.tsx` — `getCatalogGlazes`
- `src/app/(app)/glazes/new/page.tsx` — `getCatalogGlazes`
- `src/app/(app)/glazes/page.tsx` — `getCatalogGlazes`, `getInventory`
- `src/app/(app)/glazes/[glazeId]/page.tsx` — `getInventoryFolders`
- `src/app/(app)/dashboard/page.tsx` — `getInventory`, `getInventoryFolders`
- `src/app/(app)/inventory/[inventoryId]/edit/page.tsx` — `getInventoryItem`
- `src/app/(app)/inventory/page.tsx` — `getInventory`
- `src/app/(app)/publish/page.tsx` — `getCatalogGlazes`
- `src/app/actions.ts` — `getCatalogGlazes`, `getInventory`, `getInventoryItem`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/lib/data/ src/lib/data.ts src/app src/components && git commit -m "refactor: split data.ts → data/inventory"
```

---

## Task 4: Split `lib/data.ts` → `lib/data/glazes.ts`

**Files:**
- Create: `src/lib/data/glazes.ts`
- Modify: `src/lib/data.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/lib/data.ts` lines 697–750** (`getGlazeFiringImageMap`) and lines 1322–1391 (`getGlazeDetail`). Note any private helpers used.

- [ ] **Step 2: Create `src/lib/data/glazes.ts`**

Copy these exports:
- `getGlazeFiringImageMap`
- `getGlazeDetail`

File header (copy only what's needed):
```ts
import { demoGlazes } from "@/lib/demo-data";
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogFiringImages, getCatalogFiringImageMap, getTagDefinitions } from "@/lib/catalog";
import type { GlazeDetail, GlazeFiringImage, GlazeTagSummary, Viewer } from "@/lib/types";
import { requireViewer } from "@/lib/data/users";
// add/remove as needed
```

If `getBundledVendorImageUrl` or `catalogGlazeByCode` are needed here (check during Step 1), either copy them into this file or import from `src/lib/data/shared.ts` if they're also used by inventory.ts.

- [ ] **Step 3: Remove moved functions from `src/lib/data.ts`.**

- [ ] **Step 4: Update consumer imports**

- `src/app/(app)/glazes/page.tsx` — `getGlazeFiringImageMap` → `@/lib/data/glazes`
- `src/app/(app)/glazes/[glazeId]/page.tsx` — `getGlazeDetail` → `@/lib/data/glazes`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/lib/data/ src/lib/data.ts src/app && git commit -m "refactor: split data.ts → data/glazes"
```

---

## Task 5: Split `lib/data.ts` → `lib/data/combinations.ts`

**Files:**
- Create: `src/lib/data/combinations.ts`
- Modify: `src/lib/data.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/lib/data.ts` lines 745–952** (`getCombinationSummaries`), lines 953–976 (`getVendorCombinationExamples`, `getVendorCombinationExample`), lines 1108–1321 (`getUserCombinationExamples`, `getPublishedCombinationPosts`, `getCombinationDetail`).

- [ ] **Step 2: Create `src/lib/data/combinations.ts`**

Copy these exports:
- `getCombinationSummaries`
- `getVendorCombinationExamples`
- `getVendorCombinationExample`
- `getUserCombinationExamples`
- `getPublishedCombinationPosts`
- `getCombinationDetail`

File header:
```ts
import { demoProfiles, demoPairs, demoPosts } from "@/lib/demo-data";
import { getSupabaseEnv } from "@/lib/env";
import { buildCombinationSummaries, parsePairKey } from "@/lib/combinations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllVendorExamples, getVendorExampleById } from "@/lib/catalog";
import type {
  CombinationDetail, CombinationPair, CombinationPost,
  VendorCombinationExample, VendorCombinationExampleLayer,
  UserCombinationExample, UserCombinationExampleLayer, Viewer
} from "@/lib/types";
import { requireViewer } from "@/lib/data/users";
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions from `src/lib/data.ts`.**

- [ ] **Step 4: Update consumer imports**

- `src/app/(app)/contribute/firing-image/page.tsx` — `getUserCombinationExamples` → `@/lib/data/combinations`
- `src/app/(app)/inventory/page.tsx` — `getUserCombinationExamples`, `getPublishedCombinationPosts` → `@/lib/data/combinations`
- `src/app/combinations/[pairKey]/page.tsx` — `getCombinationDetail` → `@/lib/data/combinations`
- `src/app/combinations/examples/[exampleId]/page.tsx` — `getVendorCombinationExample` → `@/lib/data/combinations`
- `src/app/combinations/page.tsx` — read this file first to see which combination functions it imports, then update accordingly

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/lib/data/ src/lib/data.ts src/app && git commit -m "refactor: split data.ts → data/combinations"
```

---

## Task 6: Split `lib/data.ts` → `lib/data/community.ts`

**Files:**
- Create: `src/lib/data/community.ts`
- Modify: `src/lib/data.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/lib/data.ts` lines 977–1107** (community posts, firing images per glaze/combo), lines 1392–1405 (`getFavouriteIds`), lines 2359–2465 (DM interfaces and functions).

- [ ] **Step 2: Create `src/lib/data/community.ts`**

Copy these exports:
- `getCommunityPosts`
- `getPublishedPostsByAuthor`
- `getCommunityFiringImagesForGlaze`
- `getCommunityFiringImagesForCombination`
- `getFavouriteIds`
- `DirectMessageSummary` (interface)
- `DirectMessage` (interface)
- `getUnreadDirectMessageCount`
- `getDirectMessageConversations`
- `getDirectMessagesWithUser`

File header:
```ts
import { demoProfiles, demoPosts, demoReports } from "@/lib/demo-data";
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CombinationPost, UserProfile, Viewer } from "@/lib/types";
import { requireViewer } from "@/lib/data/users";
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions/interfaces from `src/lib/data.ts`.**

- [ ] **Step 4: Update consumer imports**

- `src/app/(app)/community/page.tsx` — `getCommunityPosts` → `@/lib/data/community`
- `src/app/(app)/glazes/page.tsx` — `getFavouriteIds` → `@/lib/data/community`
- `src/app/(app)/inventory/page.tsx` — check if it imports any community functions; update if so
- `src/app/(app)/profile/chats-tab.tsx` — `DirectMessageSummary`, `DirectMessage`, `getDirectMessageConversations`, `getDirectMessagesWithUser`, `getUnreadDirectMessageCount` → `@/lib/data/community`
- `src/components/app-shell.tsx` — `getUnreadDirectMessageCount` → `@/lib/data/community`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/lib/data/ src/lib/data.ts src/app src/components && git commit -m "refactor: split data.ts → data/community"
```

---

## Task 7: Split `lib/data.ts` → `lib/data/admin.ts` (and delete `data.ts`)

**Files:**
- Create: `src/lib/data/admin.ts`
- Delete: `src/lib/data.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read the remaining contents of `src/lib/data.ts`** — everything left after Tasks 2–6. These are all the admin/analytics/leaderboard/points/moderation functions. Confirm the file contains only these before deleting.

- [ ] **Step 2: Create `src/lib/data/admin.ts`**

Copy all remaining exports:
- `getDashboardData`
- `AnalyticsDashboard` (interface)
- `AdminUserDetail` (interface)
- `getAdminUserDetail`
- `getAnalyticsDashboard`
- `DashboardRange` (type)
- `AdminDashboard` (interface)
- `getAdminDashboard`
- `getLeaderboard`
- `getUserPointsRank`
- `getWeeklyLeaderboard`
- `getModerationQueue`
- `getUserPointsBreakdown`
- `getExternalExampleIntakeQueue`
- `getExternalExampleIntake`
- `getReportedPostsQueue`

File header:
```ts
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ExternalExampleAsset, ExternalExampleGlazeMention, ExternalExampleIntake,
  ExternalExampleParserOutput, IntakeStatus, LeaderboardEntry,
  ModerationItem, ModerationQueue, PointsBreakdownEntry, Report, UserProfile
} from "@/lib/types";
import { requireViewer } from "@/lib/data/users";
// add/remove as needed
```

- [ ] **Step 3: Delete `src/lib/data.ts`** (only after confirming it is now empty of exports).

- [ ] **Step 4: Update consumer imports**

- `src/app/(app)/admin/analytics/[userId]/page.tsx` — `getAdminUserDetail` → `@/lib/data/admin`
- `src/app/(app)/admin/analytics/moderation/page.tsx` — `getModerationQueue` → `@/lib/data/admin`
- `src/app/(app)/admin/analytics/page.tsx` — `AnalyticsDashboard`, `DashboardRange`, `getAdminDashboard` → `@/lib/data/admin`
- `src/app/(app)/admin/intake/[intakeId]/page.tsx` — `getExternalExampleIntake` → `@/lib/data/admin`
- `src/app/(app)/admin/intake/page.tsx` — `getExternalExampleIntakeQueue` → `@/lib/data/admin`
- `src/app/(app)/admin/moderation/page.tsx` — `getReportedPostsQueue` → `@/lib/data/admin`
- `src/app/(app)/contribute/page.tsx` — `getLeaderboard` → `@/lib/data/admin`
- `src/app/(app)/dashboard/page.tsx` — `getWeeklyLeaderboard` → `@/lib/data/admin`
- `src/app/(app)/profile/page.tsx` — `getUserPointsRank` → `@/lib/data/admin`
- `src/components/app-shell.tsx` — `getUserPointsBreakdown` → `@/lib/data/admin`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/lib/data/ src/lib/data.ts src/app src/components && git commit -m "refactor: split data.ts → data/admin, delete data.ts"
```

---

## Task 8: Split `app/actions.ts` → `app/actions/auth.ts`

**Files:**
- Create: `src/app/actions/auth.ts`
- Modify: `src/app/actions.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/app/actions.ts` lines 1–261** (imports + preamble) and lines 262–435 (`sendMagicLinkAction` through `updatePasswordAction`).

- [ ] **Step 2: Create `src/app/actions/auth.ts`**

File must start with `"use server";`. Copy these exports exactly:
- `sendMagicLinkAction`
- `signInWithPasswordAction`
- `signUpWithPasswordAction`
- `signOutAction`
- `sendPasswordResetAction`
- `updatePasswordAction`

File header (copy only what these functions use from actions.ts imports):
```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/env";
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions from `src/app/actions.ts`.**

- [ ] **Step 4: Update consumer imports**

- `src/app/auth/forgot-password/page.tsx` — `sendPasswordResetAction` → `@/app/actions/auth`
- `src/app/auth/reset-password/page.tsx` — `updatePasswordAction` → `@/app/actions/auth`
- `src/components/auth-entry-page.tsx` — `sendMagicLinkAction`, `signInWithPasswordAction`, `signOutAction` → `@/app/actions/auth`
- `src/components/auth-sign-up-page.tsx` — `signUpWithPasswordAction` → `@/app/actions/auth`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/app/actions/ src/app/actions.ts src/app src/components && git commit -m "refactor: split actions.ts → actions/auth"
```

---

## Task 9: Split `app/actions.ts` → `app/actions/inventory.ts`

**Files:**
- Create: `src/app/actions/inventory.ts`
- Modify: `src/app/actions.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/app/actions.ts` lines 436–1061** (`setGlazeInventoryStateAction` through `updateGlazeInventoryAmountAction`).

- [ ] **Step 2: Create `src/app/actions/inventory.ts`**

File must start with `"use server";`. Copy these exports:
- `setGlazeInventoryStateAction`
- `createInventoryFolderAction`
- `updateInventoryItemFoldersAction`
- `addCatalogGlazeToInventoryAction`
- `createCustomGlazeAction`
- `updateInventoryItemAction`
- `toggleInventoryEmptyAction`
- `updateInventoryItemNotesAction`
- `updateOwnedGlazeShelfAction`
- `updateGlazeInventoryAmountAction`

File header:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAllCatalogGlazes, getCatalogGlazeById } from "@/lib/catalog";
import { getCatalogGlazes, getInventory, getInventoryItem } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { serializeInventoryState } from "@/lib/inventory-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatGlazeLabel } from "@/lib/utils";
// add/remove as needed
```

Note: `src/app/actions.ts` previously imported these from `@/lib/data`. Since data.ts is now split, use `@/lib/data/inventory` and `@/lib/data/users`.

- [ ] **Step 3: Remove moved functions from `src/app/actions.ts`.**

- [ ] **Step 4: Update consumer imports**

- `src/app/(app)/inventory/[inventoryId]/edit/page.tsx` — `updateInventoryItemAction` → `@/app/actions/inventory`
- `src/app/(app)/glazes/new/page.tsx` — `createCustomGlazeAction` → `@/app/actions/inventory`
- `src/components/glaze-catalog-explorer.tsx` — `setGlazeInventoryStateAction` → `@/app/actions/inventory`
- `src/components/glaze-ownership-panel.tsx` — `setGlazeInventoryStateAction` → `@/app/actions/inventory`
- `src/components/glaze-scanner.tsx` — `setGlazeInventoryStateAction` → `@/app/actions/inventory`
- `src/components/glaze-shelf-form.tsx` — `updateGlazeInventoryAmountAction` → `@/app/actions/inventory`
- `src/components/inventory-folder-manager.tsx` — `createInventoryFolderAction`, `updateInventoryItemFoldersAction` → `@/app/actions/inventory`
- `src/components/inventory-workspace.tsx` — `setGlazeInventoryStateAction`, `updateInventoryItemNotesAction` → `@/app/actions/inventory`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/app/actions/ src/app/actions.ts src/app src/components && git commit -m "refactor: split actions.ts → actions/inventory"
```

---

## Task 10: Split `app/actions.ts` → `app/actions/glazes.ts`

**Files:**
- Create: `src/app/actions/glazes.ts`
- Modify: `src/app/actions.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read the relevant lines in `src/app/actions.ts`** for these functions: `toggleOwnedGlazeAction` (line 907), `toggleGlazeTagVoteAction` (line 1578), `toggleFavouriteInlineAction` (line 1748), `toggleGlazeFavouriteAction` (line 1780), `updateGlazeDescriptionAction` (line 1817), `getCatalogGlazesForScannerAction` (line 1906), `recognizeGlazeLabelAction` (line 1918), `trackBuyClickAction` (line 1996).

- [ ] **Step 2: Create `src/app/actions/glazes.ts`**

File must start with `"use server";`. Copy these exports:
- `toggleOwnedGlazeAction`
- `toggleGlazeTagVoteAction`
- `toggleFavouriteInlineAction`
- `toggleGlazeFavouriteAction`
- `updateGlazeDescriptionAction`
- `getCatalogGlazesForScannerAction`
- `recognizeGlazeLabelAction`
- `trackBuyClickAction`

File header:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAllCatalogGlazes } from "@/lib/catalog";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";
// Google Generative AI import if used by recognizeGlazeLabelAction
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions from `src/app/actions.ts`.**

- [ ] **Step 4: Update consumer imports**

Read each file first to confirm which functions it actually imports, then update:
- `src/app/(app)/glazes/[glazeId]/page.tsx` — read imports first; likely `updateGlazeDescriptionAction` → `@/app/actions/glazes`
- `src/components/glaze-catalog-explorer.tsx` — `toggleFavouriteInlineAction` → `@/app/actions/glazes`
- `src/components/glaze-trait-voter.tsx` — `toggleGlazeTagVoteAction` → `@/app/actions/glazes`
- `src/components/inventory-workspace.tsx` — `toggleFavouriteInlineAction`, `getCatalogGlazesForScannerAction` → `@/app/actions/glazes`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/app/actions/ src/app/actions.ts src/app src/components && git commit -m "refactor: split actions.ts → actions/glazes"
```

---

## Task 11: Split `app/actions.ts` → `app/actions/combinations.ts`

**Files:**
- Create: `src/app/actions/combinations.ts`
- Modify: `src/app/actions.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/app/actions.ts`** lines 1062–1283 (`publishUserCombinationAction`, `deleteUserCombinationAction`), line 2020 (`adminArchiveCombinationAction`), line 2190 (`adminEditCombinationAction`), line 2412 (`adminGetCombinationPreviewAction`).

- [ ] **Step 2: Create `src/app/actions/combinations.ts`**

File must start with `"use server";`. Copy these exports:
- `publishUserCombinationAction`
- `deleteUserCombinationAction`
- `adminArchiveCombinationAction`
- `adminEditCombinationAction`
- `adminGetCombinationPreviewAction`

File header:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createPairKey, parsePairKey } from "@/lib/combinations";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildAnonymizedCombinationAuthorName,
  canPublishExternalExampleIntake,
  getApprovedMatchedGlazeIds,
  resolveGlazeInput,
} from "@/lib/external-example-intakes";
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions from `src/app/actions.ts`.**

- [ ] **Step 4: Update consumer imports**

Read each file first to confirm imports, then update:
- `src/app/(app)/admin/analytics/combination-preview-modal.tsx` — `adminGetCombinationPreviewAction` → `@/app/actions/combinations`
- `src/app/(app)/admin/analytics/page.tsx` — read imports; likely `adminArchiveCombinationAction` or `adminEditCombinationAction` → `@/app/actions/combinations`
- `src/app/(app)/publish/page.tsx` — `publishUserCombinationAction` → `@/app/actions/combinations`
- `src/components/combinations-browser.tsx` — read imports; likely `deleteUserCombinationAction` → `@/app/actions/combinations`
- `src/components/inventory-workspace.tsx` — `deleteUserCombinationAction` → `@/app/actions/combinations`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/app/actions/ src/app/actions.ts src/app src/components && git commit -m "refactor: split actions.ts → actions/combinations"
```

---

## Task 12: Split `app/actions.ts` → `app/actions/community.ts`

**Files:**
- Create: `src/app/actions/community.ts`
- Modify: `src/app/actions.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/app/actions.ts`** lines for: `addGlazeCommentInlineAction` (1644), `addCombinationCommentInlineAction` (1677), `addGlazeCommentAction` (1710), `reportPostAction` (1284), `uploadCommunityFiringImageAction` (2358), `adminEditCommunityFiringImageAction` (2261), `adminDeleteCommunityFiringImageAction` (2287), `sendDirectMessageAction` (2476), `markAllDirectMessagesReadAction` (2519), `markDirectMessageReadAction` (2537).

- [ ] **Step 2: Create `src/app/actions/community.ts`**

File must start with `"use server";`. Copy these exports:
- `addGlazeCommentInlineAction`
- `addCombinationCommentInlineAction`
- `addGlazeCommentAction`
- `reportPostAction`
- `uploadCommunityFiringImageAction`
- `adminEditCommunityFiringImageAction`
- `adminDeleteCommunityFiringImageAction`
- `sendDirectMessageAction`
- `markAllDirectMessagesReadAction`
- `markDirectMessageReadAction`

File header:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions from `src/app/actions.ts`.**

- [ ] **Step 4: Update consumer imports**

- `src/app/combinations/[pairKey]/page.tsx` — `reportPostAction` → `@/app/actions/community`
- `src/app/(app)/contribute/firing-image/firing-image-form.tsx` — `uploadCommunityFiringImageAction` → `@/app/actions/community`
- `src/app/(app)/profile/auto-mark-read.tsx` — `markAllDirectMessagesReadAction` → `@/app/actions/community`
- `src/app/(app)/profile/chats-tab.tsx` — `sendDirectMessageAction` → `@/app/actions/community`
- `src/components/glaze-comments-panel.tsx` — read imports first; likely comment actions → `@/app/actions/community`
- `src/components/combinations-browser.tsx` — read imports first; likely `addCombinationCommentInlineAction` → `@/app/actions/community`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/app/actions/ src/app/actions.ts src/app src/components && git commit -m "refactor: split actions.ts → actions/community"
```

---

## Task 13: Split `app/actions.ts` → `app/actions/admin.ts`

**Files:**
- Create: `src/app/actions/admin.ts`
- Modify: `src/app/actions.ts`
- Modify: consumer files listed below

- [ ] **Step 1: Read `src/app/actions.ts`** lines for: `moderatePostAction` (1313), `updateExternalExampleGlazeMatchAction` (1334), `updateExternalExampleReviewNotesAction` (1377), `setExternalExampleIntakeStatusAction` (1408), `publishExternalExampleIntakeAction` (1442), `adminApproveSubmissionAction` (2060), `adminRejectSubmissionAction` (2081), `adminReopenSubmissionAction` (2118), `adminPermanentDeleteSubmissionAction` (2139), `adminFlagFalseContributionAction` (2302), `adminDeleteCustomGlazeAction` (2166), `adminEditCustomGlazeAction` (2222).

- [ ] **Step 2: Create `src/app/actions/admin.ts`**

File must start with `"use server";`. Copy these exports:
- `moderatePostAction`
- `updateExternalExampleGlazeMatchAction`
- `updateExternalExampleReviewNotesAction`
- `setExternalExampleIntakeStatusAction`
- `publishExternalExampleIntakeAction`
- `adminApproveSubmissionAction`
- `adminRejectSubmissionAction`
- `adminReopenSubmissionAction`
- `adminPermanentDeleteSubmissionAction`
- `adminFlagFalseContributionAction`
- `adminDeleteCustomGlazeAction`
- `adminEditCustomGlazeAction`

File header:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canPublishExternalExampleIntake,
  getApprovedMatchedGlazeIds,
  resolveGlazeInput,
} from "@/lib/external-example-intakes";
// add/remove as needed
```

- [ ] **Step 3: Remove moved functions from `src/app/actions.ts`.**

- [ ] **Step 4: Update consumer imports**

Read each file first to confirm imports, then update:
- `src/app/(app)/admin/analytics/moderation/page.tsx` — read imports; likely multiple admin actions → `@/app/actions/admin`
- `src/app/(app)/admin/analytics/page.tsx` — read imports; likely `adminFlagFalseContributionAction` etc → `@/app/actions/admin`
- `src/app/(app)/admin/intake/[intakeId]/page.tsx` — read imports; likely intake actions → `@/app/actions/admin`
- `src/app/(app)/admin/moderation/page.tsx` — `moderatePostAction` → `@/app/actions/admin`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/app/actions/ src/app/actions.ts src/app && git commit -m "refactor: split actions.ts → actions/admin"
```

---

## Task 14: Split `app/actions.ts` → `app/actions/profile.ts` (and delete `actions.ts`)

**Files:**
- Create: `src/app/actions/profile.ts`
- Delete: `src/app/actions.ts`
- Modify: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Read the remaining contents of `src/app/actions.ts`** — confirm it only contains `updateProfilePreferencesAction` (line 1868). If there are any other remaining functions, they were missed in earlier tasks — handle them before deleting.

- [ ] **Step 2: Create `src/app/actions/profile.ts`**

File must start with `"use server";`. Copy:
- `updateProfilePreferencesAction`

File header:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";
// add/remove as needed
```

- [ ] **Step 3: Delete `src/app/actions.ts`** (only after confirming it is empty of exports).

- [ ] **Step 4: Update consumer imports**

- `src/app/(app)/profile/page.tsx` — `updateProfilePreferencesAction` → `@/app/actions/profile`

- [ ] **Step 5: Run tests**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 6: Commit**
```bash
cd ".worktrees/v2-refactor" && git add src/app/actions/ src/app/actions.ts src/app && git commit -m "refactor: split actions.ts → actions/profile, delete actions.ts"
```

---

## Task 15: Final build verification

- [ ] **Step 1: Run the full test suite**
```bash
cd ".worktrees/v2-refactor" && npm test
```
Expected: 15 passing, 0 failing.

- [ ] **Step 2: Run the TypeScript build**
```bash
cd ".worktrees/v2-refactor" && npm run build 2>&1
```
Expected: exits with code 0, no TypeScript errors.

- [ ] **Step 3: If build fails**, read the error output carefully. TypeScript errors will point to exact files and lines with unresolved imports. Fix each one — they will all be import path issues.

- [ ] **Step 4: Final commit (if any fixes were needed)**
```bash
cd ".worktrees/v2-refactor" && git add -A && git commit -m "fix: resolve remaining import errors after refactor"
```

- [ ] **Step 5: Report result** — confirm all tests pass, build succeeds, and list the new file structure.
