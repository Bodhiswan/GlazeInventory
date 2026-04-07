# Best Practices Phase 1: Code Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four accumulated architecture gaps: coarse Suspense boundaries, monolithic client components, hand-written DB types, and page-level-only error boundaries.

**Architecture:** Supabase-typed clients replace `Record<string, unknown>` casts throughout the data layer. Section-level React error boundaries wrap independently failable UI sections. Pages extract secondary async fetches into nested Server Components behind `<Suspense>` boundaries, rendering page structure immediately. Large client components are split into a state hook + thin container + presentational pieces.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase SSR (`@supabase/ssr`), TypeScript 5, Tailwind CSS 4

---

## File Map

**Create:**
- `src/lib/supabase/database.types.ts` — generated Supabase types (auto-generated, not hand-edited)
- `src/components/section-error-boundary.tsx` — reusable `SectionErrorBoundary` class component + `SectionErrorFallback` UI
- `src/app/(app)/glazes/_components/glaze-catalog-server.tsx` — nested Server Component wrapping all catalog data fetching
- `src/app/(app)/glazes/_components/glaze-catalog-skeleton.tsx` — skeleton for catalog Suspense fallback
- `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-server.tsx` — streams ownership + comments into glaze detail
- `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-skeleton.tsx` — skeleton for user-state Suspense
- `src/components/glaze-catalog/use-glaze-explorer.ts` — extracted state hook (search, filters, pagination)
- `src/components/glaze-catalog/glaze-grid.tsx` — presentational glaze grid
- `src/components/glaze-catalog/glaze-card.tsx` — presentational glaze card
- `src/components/glaze-catalog/glaze-filters.tsx` — presentational filter panel
- `src/lib/data/admin/intake.ts` — intake queries extracted from admin.ts
- `src/lib/data/admin/analytics.ts` — analytics queries extracted from admin.ts
- `src/lib/data/admin/moderation.ts` — moderation queries extracted from admin.ts
- `src/lib/data/admin/index.ts` — re-exports all admin data functions

**Modify:**
- `package.json` — add `types:generate` script
- `src/lib/supabase/server.ts` — add `Database` generic to `createServerClient`
- `src/lib/supabase/browser.ts` — add `Database` generic to `createBrowserClient`
- `src/lib/supabase/admin.ts` — add `Database` generic to `createClient`
- `src/lib/data/inventory.ts` — replace `type Row = Record<string, unknown>` with typed rows
- `src/lib/data/glazes.ts` — replace untyped row casts with typed rows
- `src/lib/data/community.ts` — replace untyped row casts with typed rows
- `src/app/(app)/glazes/page.tsx` — wrap in `<Suspense>` via nested server component
- `src/app/(app)/glazes/[glazeId]/page.tsx` — add Suspense for user state + section error boundaries
- `src/app/combinations/[pairKey]/page.tsx` — add section error boundaries
- `src/app/(app)/profile/page.tsx` — add section error boundaries per tab
- `src/components/glaze-catalog-explorer.tsx` — replace inline state with `use-glaze-explorer` hook, inline presentational pieces with imports

**Delete:**
- `src/lib/data/admin.ts` — replaced by `src/lib/data/admin/` directory (after all imports updated)

---

## Task 1: Add Supabase Type Generation

**Files:**
- Create: `src/lib/supabase/database.types.ts`
- Modify: `package.json`

- [ ] **Step 1: Start the local Supabase stack**

```bash
npm run dev:test
```

Wait until you see `supabase local development setup is running`. This is required for type generation.

- [ ] **Step 2: Generate types**

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

- [ ] **Step 3: Verify the output**

```bash
head -30 src/lib/supabase/database.types.ts
```

Expected: File starts with `export type Json = ...` and contains `export type Database = {`.

- [ ] **Step 4: Add the script to `package.json`**

In `package.json`, add to the `"scripts"` section after `"supabase:status"`:

```json
"types:generate": "supabase gen types typescript --local > src/lib/supabase/database.types.ts"
```

- [ ] **Step 5: Verify the script runs**

```bash
npm run types:generate
```

Expected: No errors; `src/lib/supabase/database.types.ts` is updated.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/database.types.ts package.json
git commit -m "feat: add supabase type generation script and generated types"
```

---

## Task 2: Wire Generated Types Into Supabase Clients

**Files:**
- Modify: `src/lib/supabase/server.ts`
- Modify: `src/lib/supabase/browser.ts`
- Modify: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Update `src/lib/supabase/server.ts`**

Replace the entire file with:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createSupabaseServerClient() {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          return;
        }
      },
    },
  });
}
```

- [ ] **Step 2: Update `src/lib/supabase/browser.ts`**

Replace the entire file with:

```typescript
import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  return createBrowserClient<Database>(env.url, env.anonKey);
}
```

- [ ] **Step 3: Update `src/lib/supabase/admin.ts`**

Replace the entire file with:

```typescript
import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseAdminClient() {
  const env = getSupabaseAdminEnv();

  if (!env) {
    return null;
  }

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

- [ ] **Step 4: Verify the build passes**

```bash
npm run build
```

Expected: Build completes. TypeScript errors will appear in data files that use `as Row` — these are caught type errors that will be fixed in Task 3. If errors appear ONLY in `src/lib/data/` files, that is expected and correct. If errors appear elsewhere, investigate before proceeding.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/browser.ts src/lib/supabase/admin.ts
git commit -m "feat: add Database type generic to all supabase clients"
```

---

## Task 3: Replace Untyped Row Casts In Data Files

**Files:**
- Modify: `src/lib/data/inventory.ts`
- Modify: `src/lib/data/glazes.ts`

The `type Row = Record<string, unknown>` pattern exists because the clients weren't typed. Now that they are, TypeScript knows the shape of each table row. Replace the unsafe casts.

- [ ] **Step 1: Open `src/lib/data/inventory.ts`**

Find the line:
```typescript
type Row = Record<string, unknown>;
```

Delete it. Then find every instance of `row as Row` and `(row as Row` and replace with the actual typed row. The Supabase client now infers row types from the query's `.from('table_name')` call.

For each function, the `data` returned by Supabase is now typed. Remove all `as Row` casts. Where you need to access a field, TypeScript will now tell you the actual field names and types.

Run:
```bash
npm run build 2>&1 | grep "inventory.ts"
```

Fix each type error by removing the cast and using the correct typed field. The generated `database.types.ts` is the source of truth for field names.

- [ ] **Step 2: Open `src/lib/data/glazes.ts`**

Same process: remove `type Row = Record<string, unknown>` and all `as Row` casts. Check:

```bash
npm run build 2>&1 | grep "glazes.ts"
```

- [ ] **Step 3: Full build check**

```bash
npm run build
```

Expected: Build passes with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data/inventory.ts src/lib/data/glazes.ts
git commit -m "refactor: replace untyped Row casts with Supabase-generated types"
```

---

## Task 4: Create SectionErrorBoundary Component

**Files:**
- Create: `src/components/section-error-boundary.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/section-error-boundary.tsx
"use client";

import React from "react";

function SectionErrorFallback({ reset }: { reset?: () => void }) {
  return (
    <div className="border border-border bg-panel px-4 py-4">
      <p className="text-sm text-muted">This section failed to load.</p>
      {reset ? (
        <button
          onClick={reset}
          className="mt-2 text-xs uppercase tracking-[0.16em] text-muted underline transition hover:text-foreground"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? <SectionErrorFallback reset={this.reset} />
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "section-error-boundary"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/section-error-boundary.tsx
git commit -m "feat: add SectionErrorBoundary component for section-level error handling"
```

---

## Task 5: Add Section Error Boundaries to Glaze Detail Page

**Files:**
- Modify: `src/app/(app)/glazes/[glazeId]/page.tsx`

The glaze detail page has three independently failable sections: ownership panel, comments section, and (if added later) tag voting. Wrap each.

- [ ] **Step 1: Add the import**

At the top of `src/app/(app)/glazes/[glazeId]/page.tsx`, add:

```typescript
import { SectionErrorBoundary } from "@/components/section-error-boundary";
```

- [ ] **Step 2: Wrap the ownership panel**

Find the `<GlazeOwnershipPanel ... />` JSX and wrap it:

```tsx
{glaze.sourceType === "commercial" ? (
  <SectionErrorBoundary>
    <GlazeOwnershipPanel
      glazeId={glaze.id}
      initialStatus={detail.viewerInventoryItem?.status ?? null}
      initialFillLevel={detail.viewerInventoryItem?.fillLevel ?? "full"}
      initialQuantity={detail.viewerInventoryItem?.quantity ?? 1}
      initialInventoryId={detail.viewerInventoryItem?.id ?? null}
      initialFolderIds={detail.viewerInventoryItem?.folderIds ?? []}
      folders={folders}
    />
  </SectionErrorBoundary>
) : null}
```

- [ ] **Step 3: Wrap the comments section**

Find the entire `<section className="space-y-4">` block that contains the comments heading, comment form, and comment list. Wrap it:

```tsx
<SectionErrorBoundary>
  <section className="space-y-4">
    {/* ... existing comments section content unchanged ... */}
  </section>
</SectionErrorBoundary>
```

- [ ] **Step 4: Verify build and visual check**

```bash
npm run build
```

Then start the dev server and open `http://localhost:3000/glazes/<any-glaze-id>` to confirm the page still renders correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/glazes/[glazeId]/page.tsx
git commit -m "feat: add section error boundaries to glaze detail page"
```

---

## Task 6: Add Section Error Boundaries to Combination Detail Page

**Files:**
- Modify: `src/app/combinations/[pairKey]/page.tsx`

- [ ] **Step 1: Add the import**

```typescript
import { SectionErrorBoundary } from "@/components/section-error-boundary";
```

- [ ] **Step 2: Read the full page file to identify sections**

```bash
cat src/app/combinations/[pairKey]/page.tsx
```

Identify any `<section>` or `<Panel>` blocks that contain: comments, community images, or reporting forms. These are the independently failable sections.

- [ ] **Step 3: Wrap each independent section**

For each independently failable section (at minimum the posts/comments area), wrap with:

```tsx
<SectionErrorBoundary>
  {/* existing section content */}
</SectionErrorBoundary>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/combinations/[pairKey]/page.tsx
git commit -m "feat: add section error boundaries to combination detail page"
```

---

## Task 7: Add Section Error Boundaries to Profile Page

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Add the import**

```typescript
import { SectionErrorBoundary } from "@/components/section-error-boundary";
```

- [ ] **Step 2: Wrap the ChatsTab**

Find `<ChatsTab ... />` and wrap it:

```tsx
{activeTab === "chats" ? (
  <SectionErrorBoundary>
    <ChatsTab viewerUserId={viewer.profile.id} activeOtherId={activeWith || undefined} viewerIsAdmin={viewer.profile.isAdmin === true} />
  </SectionErrorBoundary>
) : (
  /* profile tab unchanged */
)}
```

- [ ] **Step 3: Wrap the points widget**

Find the points display block (the `(viewer.profile.points ?? 0) > 0` conditional) and wrap it:

```tsx
<SectionErrorBoundary>
  {(viewer.profile.points ?? 0) > 0 ? (
    <div className="border border-border bg-panel p-4">
      {/* ... existing points content ... */}
    </div>
  ) : null}
</SectionErrorBoundary>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/profile/page.tsx
git commit -m "feat: add section error boundaries to profile page"
```

---

## Task 8: Add Suspense Streaming to Glaze Detail Page

**Files:**
- Create: `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-server.tsx`
- Create: `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-skeleton.tsx`
- Modify: `src/app/(app)/glazes/[glazeId]/page.tsx`

The glaze detail page currently awaits `getGlazeDetail` (includes Supabase calls for inventory + comments) and `getInventoryFolders` before rendering anything. We can render the static glaze content immediately and stream the user-specific data.

- [ ] **Step 1: Understand what's slow**

`getGlazeDetail` makes 3 Supabase queries: inventory item, comments, and favourites. `getInventoryFolders` is a 4th query. The glaze metadata itself (`getCatalogGlazeById`, `getCatalogFiringImages`) is synchronous static data.

Refactor `src/lib/data/glazes.ts` to split `getGlazeDetail` into two functions:
- `getGlazeStaticDetail(glazeId)` — synchronous, returns glaze + firing images (no Supabase)
- `getGlazeUserState(viewerId, glazeId)` — async, returns inventory item + comments + favourite status

In `src/lib/data/glazes.ts`, add:

```typescript
export function getGlazeStaticDetail(glazeId: string) {
  const rawGlaze = getCatalogGlazeById(glazeId);
  if (!rawGlaze) return null;
  const firingImages = getCatalogFiringImages(glazeId);
  return { glaze: rawGlaze, firingImages };
}

export async function getGlazeUserState(viewerId: string, glazeId: string) {
  const supabase = await getSupabase();

  if (!supabase) {
    return {
      comments: [] as GlazeComment[],
      viewerInventoryItem: null,
      viewerHasFavourited: false,
    };
  }

  const [
    { data: inventoryRows },
    { data: commentRows },
    { data: favouriteRows },
  ] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id,user_id,glaze_id,status,personal_notes,fill_level,quantity,glaze:glazes(*),inventory_item_folders(folder:inventory_folders(*))")
      .eq("user_id", viewerId)
      .eq("glaze_id", glazeId)
      .limit(1),
    supabase
      .from("glaze_comments")
      .select("*, author:profiles(display_name)")
      .eq("glaze_id", glazeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_favourites")
      .select("id")
      .eq("user_id", viewerId)
      .eq("target_type", "glaze")
      .eq("target_id", glazeId)
      .limit(1),
  ]);

  const comments: GlazeComment[] = (commentRows ?? []).map((row) => ({
    id: String(row.id),
    glazeId: String(row.glaze_id),
    authorUserId: String(row.author_user_id),
    authorName: String((row.author as { display_name?: string } | null)?.display_name ?? "Glaze member"),
    body: String(row.body),
    createdAt: String(row.created_at),
  }));

  return {
    comments,
    viewerInventoryItem: inventoryRows?.length ? mapInventoryItem(inventoryRows[0]) : null,
    viewerHasFavourited: Boolean(favouriteRows?.length),
  };
}
```

- [ ] **Step 2: Create the skeleton**

Create `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-skeleton.tsx`:

```typescript
export function GlazeUserStateSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 rounded bg-muted/30" />
      <div className="h-10 w-full rounded bg-muted/20" />
      <div className="space-y-3 pt-4">
        <div className="h-4 w-24 rounded bg-muted/20" />
        <div className="h-16 w-full rounded bg-muted/20" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the streaming server component**

Create `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-server.tsx`:

```typescript
import { format } from "date-fns";

import { addGlazeCommentAction } from "@/app/actions/community";
import { GlazeOwnershipPanel } from "@/components/glaze-ownership-panel";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { getInventoryFolders } from "@/lib/data/inventory";
import { getGlazeUserState } from "@/lib/data/glazes";
import { attachTagSummariesToGlazes } from "@/lib/data/tags";
import { getCatalogGlazeById } from "@/lib/catalog";

export async function GlazeUserStateServer({
  viewerId,
  glazeId,
  glazeSourceType,
}: {
  viewerId: string;
  glazeId: string;
  glazeSourceType: "commercial" | "nonCommercial";
}) {
  const [userState, folders] = await Promise.all([
    getGlazeUserState(viewerId, glazeId),
    getInventoryFolders(viewerId),
  ]);

  return (
    <>
      {glazeSourceType === "commercial" ? (
        <GlazeOwnershipPanel
          glazeId={glazeId}
          initialStatus={userState.viewerInventoryItem?.status ?? null}
          initialFillLevel={userState.viewerInventoryItem?.fillLevel ?? "full"}
          initialQuantity={userState.viewerInventoryItem?.quantity ?? 1}
          initialInventoryId={userState.viewerInventoryItem?.id ?? null}
          initialFolderIds={userState.viewerInventoryItem?.folderIds ?? []}
          folders={folders}
        />
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Comments</p>
          <h2 className="display-font mt-2 text-3xl tracking-tight">Studio notes under this glaze</h2>
        </div>

        <Panel className="space-y-4">
          <form action={addGlazeCommentAction} className="space-y-4">
            <input type="hidden" name="glazeId" value={glazeId} />
            <input type="hidden" name="returnTo" value={`/glazes/${glazeId}`} />
            <Textarea
              name="body"
              placeholder="Add a useful note about application, clay body, fit, layering, or firing results."
              required
            />
            <div className="flex justify-end">
              <button type="submit" className={buttonVariants({ size: "sm" })}>
                Post comment
              </button>
            </div>
          </form>
        </Panel>

        {userState.comments.length ? (
          <div className="space-y-3">
            {userState.comments.map((comment) => (
              <Panel key={comment.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{comment.authorName}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                    {format(new Date(comment.createdAt), "d MMM yyyy")}
                  </p>
                </div>
                <p className="text-sm leading-6 text-muted">{comment.body}</p>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel>
            <p className="text-sm leading-6 text-muted">
              No comments yet. Start the page with the first note about how this glaze behaves.
            </p>
          </Panel>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 4: Update the glaze detail page**

In `src/app/(app)/glazes/[glazeId]/page.tsx`:

1. Change the import: replace `getGlazeDetail` with `getGlazeStaticDetail`
2. Remove the `getInventoryFolders` import from data/inventory (now inside the stream component)
3. Remove the `await Promise.all([getGlazeDetail, getInventoryFolders])` call
4. Add the new imports and Suspense:

```typescript
import { Suspense } from "react";
import { getGlazeStaticDetail } from "@/lib/data/glazes";
import { GlazeUserStateServer } from "./_components/glaze-user-state-server";
import { GlazeUserStateSkeleton } from "./_components/glaze-user-state-skeleton";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
```

5. Update the page body — the static detail loads immediately, user state streams in:

```typescript
export default async function GlazeDetailPage({ params, searchParams }) {
  const viewer = await requireViewer();
  const { glazeId } = await params;
  const pageParams = await searchParams;

  const detail = getGlazeStaticDetail(glazeId); // synchronous now
  if (!detail) notFound();

  const { glaze } = detail;

  after(async () => { /* unchanged analytics tracking */ });

  // ... all the static data processing (coyoteGalleryImages, familyTraits, skim, heroImage) unchanged ...

  return (
    <div className="space-y-8">
      {/* PageHeader, error banners — unchanged */}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          {/* GlazeImageGallery, badges, glaze metadata — unchanged */}

          {/* Replace the old GlazeOwnershipPanel with the streaming version */}
          <SectionErrorBoundary>
            <Suspense fallback={<GlazeUserStateSkeleton />}>
              <GlazeUserStateServer
                viewerId={viewer.profile.id}
                glazeId={glaze.id}
                glazeSourceType={glaze.sourceType}
              />
            </Suspense>
          </SectionErrorBoundary>
        </Panel>
      </section>

      {/* Remove the old comments section — it's now inside GlazeUserStateServer */}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Fix any TypeScript errors. The key change is removing `getGlazeDetail` calls and replacing with `getGlazeStaticDetail`.

- [ ] **Step 6: Visual verification**

Start dev server and open a glaze detail page. Confirm:
- The page header, glaze info, and gallery render immediately
- The ownership panel and comments section stream in (you should see the skeleton briefly on a cold load)

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/glazes.ts \
        src/app/(app)/glazes/[glazeId]/page.tsx \
        src/app/(app)/glazes/[glazeId]/_components/
git commit -m "feat: add Suspense streaming to glaze detail page"
```

---

## Task 9: Add Suspense Streaming to /glazes Catalog Page

**Files:**
- Create: `src/app/(app)/glazes/_components/glaze-catalog-server.tsx`
- Create: `src/app/(app)/glazes/_components/glaze-catalog-skeleton.tsx`
- Modify: `src/app/(app)/glazes/page.tsx`

- [ ] **Step 1: Create the catalog skeleton**

Create `src/app/(app)/glazes/_components/glaze-catalog-skeleton.tsx`:

```typescript
export function GlazeCatalogSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-4 border border-border bg-panel p-4 sm:p-5">
        <div className="h-11 w-full rounded bg-muted/20" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-20 rounded bg-muted/20" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="border border-border bg-panel p-4">
            <div className="h-40 w-full rounded bg-muted/20" />
            <div className="mt-3 h-4 w-3/4 rounded bg-muted/30" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the catalog server component**

Create `src/app/(app)/glazes/_components/glaze-catalog-server.tsx`:

```typescript
import { GlazeCatalogExplorer } from "@/components/glaze-catalog-explorer";
import { getFavouriteIds } from "@/lib/data/community";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { getCatalogGlazes, getInventory } from "@/lib/data/inventory";
import type { UserProfile } from "@/lib/types";
import { ACTIVE_GLAZE_BRANDS } from "@/lib/glaze-metadata";

export async function GlazeCatalogServer({ profile }: { profile: UserProfile }) {
  const [catalog, inventory, favouriteGlazeIds] = await Promise.all([
    getCatalogGlazes(profile.id),
    getInventory(profile.id),
    getFavouriteIds(profile.id, "glaze"),
  ]);

  const commercial = catalog.filter((g) => g.sourceType === "commercial");
  const custom = catalog.filter((g) => g.sourceType === "nonCommercial");
  const visibleBrands = new Set(ACTIVE_GLAZE_BRANDS);
  const featuredGlazes = [
    ...commercial.filter((g) => g.brand && visibleBrands.has(g.brand as (typeof ACTIVE_GLAZE_BRANDS)[number])),
    ...custom,
  ];
  const inventoryStates = Object.fromEntries(
    inventory.map((item) => [item.glazeId, { inventoryId: item.id, status: item.status }]),
  );
  const commercialFeatured = featuredGlazes.filter((g) => g.sourceType === "commercial");
  const brandCounts = Array.from(
    commercialFeatured.reduce<Map<string, number>>((counts, g) => {
      const brand = g.brand ?? "Other";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
      return counts;
    }, new Map()),
  ).sort((l, r) => l[0].localeCompare(r[0]));
  const firingImageMap = getGlazeFiringImageMap(featuredGlazes.map((g) => g.id));

  return (
    <GlazeCatalogExplorer
      glazes={featuredGlazes}
      brandCounts={brandCounts}
      inventoryStates={inventoryStates}
      isGuest={false}
      firingImageMap={firingImageMap}
      preferredCone={profile.preferredCone ?? null}
      preferredAtmosphere={profile.preferredAtmosphere ?? null}
      restrictToPreferredExamples={Boolean(profile.restrictToPreferredExamples)}
      isAdmin={false}
      reviewMode={false}
      favouriteGlazeIds={favouriteGlazeIds}
    />
  );
}
```

- [ ] **Step 3: Simplify the page**

Replace the entire body of `src/app/(app)/glazes/page.tsx` with:

```typescript
import { Suspense } from "react";
import { requireViewer } from "@/lib/data/users";
import { GlazeCatalogServer } from "./_components/glaze-catalog-server";
import { GlazeCatalogSkeleton } from "./_components/glaze-catalog-skeleton";

export default async function GlazesPage() {
  const viewer = await requireViewer();

  return (
    <Suspense fallback={<GlazeCatalogSkeleton />}>
      <GlazeCatalogServer profile={viewer.profile} />
    </Suspense>
  );
}
```

Note: The `searchParams` for `review` mode was unused (`reviewMode` was hardcoded `false`). If that param is needed later, add it back.

- [ ] **Step 4: Delete `src/app/(app)/glazes/loading.tsx`**

The `loading.tsx` file is now superseded by the `<Suspense fallback={...}>` in the page. Delete it:

```bash
git rm src/app/(app)/glazes/loading.tsx
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Open `http://localhost:3000/glazes` and confirm the skeleton shows briefly before the catalog loads.

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/glazes/page.tsx \
        src/app/(app)/glazes/_components/
git commit -m "feat: add Suspense streaming to glazes catalog page"
```

---

## Task 10: Add Suspense Streaming to Combinations Page

**Files:**
- Modify: `src/app/combinations/page.tsx`

The combinations page fetches 5 things in parallel. Split into: primary (vendor examples + inventory ownership — needed for the initial grid and filters) and secondary (published posts + user examples + favourites — enhance the grid but aren't needed for initial render).

- [ ] **Step 1: Read the rest of the combinations page**

```bash
cat src/app/combinations/page.tsx
```

Identify the full prop list passed to `<CombinationsBrowser>`.

- [ ] **Step 2: Create a nested server component**

Create `src/app/combinations/_components/combinations-data-server.tsx` with the full data fetching and `CombinationsBrowser` render (move all the current logic from `page.tsx` into this component).

```typescript
// src/app/combinations/_components/combinations-data-server.tsx

import { CombinationsBrowser } from "@/components/combinations-browser";
import { getFavouriteIds } from "@/lib/data/community";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { getInventoryOwnership } from "@/lib/data/inventory";
import {
  getPublishedCombinationPosts,
  getUserCombinationExamples,
  getVendorCombinationExamples,
} from "@/lib/data/combinations";
import type { InventoryStatus, UserProfile } from "@/lib/types";

export async function CombinationsDataServer({
  profile,
  initialQuery,
  selectedView,
  justPublished,
}: {
  profile: UserProfile;
  initialQuery: string;
  selectedView: "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";
  justPublished: boolean;
}) {
  const [examples, publishedPosts, ownership, userExamplesRaw, favouriteCombinationIds] = await Promise.all([
    getVendorCombinationExamples(profile.id),
    getPublishedCombinationPosts(profile.id),
    getInventoryOwnership(profile.id),
    getUserCombinationExamples(profile.id).catch(() => []),
    getFavouriteIds(profile.id, "combination"),
  ]);

  const userExamples = (userExamplesRaw ?? []).filter((ue) => ue && ue.id);
  const myPosts = publishedPosts.filter((post) => post.authorUserId === profile.id);
  const inventoryStatusByGlazeId = ownership.reduce<Record<string, InventoryStatus>>((map, item) => {
    map[item.glazeId] = item.status;
    return map;
  }, {});

  const allGlazeIds = new Set<string>();
  for (const ex of examples) {
    for (const layer of ex.layers) {
      if (layer.glaze?.id) allGlazeIds.add(layer.glaze.id);
    }
  }
  for (const post of publishedPosts) {
    if (post.glazes) {
      allGlazeIds.add(post.glazes[0].id);
      allGlazeIds.add(post.glazes[1].id);
    }
  }

  const firingImageMap = getGlazeFiringImageMap([...allGlazeIds]);

  return (
    <CombinationsBrowser
      examples={examples}
      publishedPosts={publishedPosts}
      myPosts={myPosts}
      inventoryStatusByGlazeId={inventoryStatusByGlazeId}
      userExamples={userExamples}
      firingImageMap={firingImageMap}
      favouriteCombinationIds={favouriteCombinationIds}
      viewerId={profile.id}
      preferredCone={profile.preferredCone ?? null}
      preferredAtmosphere={profile.preferredAtmosphere ?? null}
      initialQuery={initialQuery}
      selectedView={selectedView}
      justPublished={justPublished}
    />
  );
}
```

(Adjust props to match what `CombinationsBrowser` actually accepts — read the component signature first with `head -20 src/components/combinations-browser.tsx`.)

- [ ] **Step 3: Create combinations skeleton**

Create `src/app/combinations/_components/combinations-skeleton.tsx`:

```typescript
export function CombinationsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="border border-border bg-panel p-4">
        <div className="h-10 w-full rounded bg-muted/20" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="border border-border bg-panel p-4">
            <div className="h-48 w-full rounded bg-muted/20" />
            <div className="mt-3 h-4 w-3/4 rounded bg-muted/30" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Simplify the page**

Replace `src/app/combinations/page.tsx` with:

```typescript
import { Suspense } from "react";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";
import { CombinationsDataServer } from "./_components/combinations-data-server";
import { CombinationsSkeleton } from "./_components/combinations-skeleton";

const validViews = new Set(["all", "possible", "plus1", "mine", "user", "manufacturer"]);
type CombinationsView = "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";

export default async function CombinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; published?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const initialQuery = formatSearchQuery(params.q) ?? "";
  const justPublished = formatSearchQuery(params.published) === "1";
  const requestedView = formatSearchQuery(params.view);
  const selectedView: CombinationsView =
    requestedView && validViews.has(requestedView) ? (requestedView as CombinationsView) : "all";

  return (
    <Suspense fallback={<CombinationsSkeleton />}>
      <CombinationsDataServer
        profile={viewer.profile}
        initialQuery={initialQuery}
        selectedView={selectedView}
        justPublished={justPublished}
      />
    </Suspense>
  );
}
```

- [ ] **Step 5: Delete `src/app/combinations/loading.tsx` if it exists**

```bash
ls src/app/combinations/loading.tsx && git rm src/app/combinations/loading.tsx || echo "no loading.tsx"
```

- [ ] **Step 6: Build and verify**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/combinations/page.tsx src/app/combinations/_components/
git commit -m "feat: add Suspense streaming to combinations page"
```

---

## Task 11: Extract use-glaze-explorer Custom Hook

**Files:**
- Create: `src/components/glaze-catalog/use-glaze-explorer.ts`
- Modify: `src/components/glaze-catalog-explorer.tsx`

The `glaze-catalog-explorer.tsx` is a large client component mixing search/filter state with rendering. Extract all state into a custom hook.

- [ ] **Step 1: Read the full component**

```bash
cat src/components/glaze-catalog-explorer.tsx
```

Identify all `useState`, `useReducer`, and derived state (`useMemo`, `useDeferredValue`) calls. These move to the hook.

- [ ] **Step 2: Create the hook**

Create `src/components/glaze-catalog/use-glaze-explorer.ts`. The hook should contain:
- All filter state (brands, families, colors, finishes, cones, search query)
- All derived state (filtered glaze list, paginated slice, brand counts derived from filtered set)
- All handler functions (toggle filter, clear filters, load more, set search)

The hook signature should be:

```typescript
import type { Glaze, GlazeFiringImage, InventoryStatus } from "@/lib/types";

interface GlazeExplorerInput {
  glazes: Glaze[];
  brandCounts: [string, number][];
  inventoryStates: Record<string, { inventoryId: string; status: InventoryStatus }>;
  firingImageMap: Record<string, GlazeFiringImage[]>;
  preferredCone: string | null;
  preferredAtmosphere: string | null;
  restrictToPreferredExamples: boolean;
  favouriteGlazeIds: string[];
}

export function useGlazeExplorer(input: GlazeExplorerInput) {
  // All useState / useMemo / useDeferredValue calls moved here
  // Returns: { filteredGlazes, visibleGlazes, searchQuery, setSearchQuery,
  //            selectedBrands, toggleBrand, selectedFamilies, toggleFamily,
  //            selectedColors, toggleColor, selectedFinishes, toggleFinish,
  //            selectedCones, toggleCone, clearAllFilters, loadMore,
  //            hasMore, totalCount, indexedGlazes, ... }
}
```

Move all state logic from `glaze-catalog-explorer.tsx` into this hook.

- [ ] **Step 3: Update `glaze-catalog-explorer.tsx` to use the hook**

At the top of the component function, replace all inline state with:

```typescript
const explorer = useGlazeExplorer({
  glazes, brandCounts, inventoryStates, firingImageMap,
  preferredCone, preferredAtmosphere, restrictToPreferredExamples, favouriteGlazeIds,
});
```

Then update all references to use `explorer.filteredGlazes`, `explorer.searchQuery`, etc.

- [ ] **Step 4: Build verify**

```bash
npm run build
```

Expected: Build passes. Component behavior is unchanged — this is a pure refactor.

- [ ] **Step 5: Commit**

```bash
git add src/components/glaze-catalog/use-glaze-explorer.ts src/components/glaze-catalog-explorer.tsx
git commit -m "refactor: extract useGlazeExplorer state hook from GlazeCatalogExplorer"
```

---

## Task 12: Extract Presentational Components from GlazeCatalogExplorer

**Files:**
- Create: `src/components/glaze-catalog/glaze-card.tsx`
- Create: `src/components/glaze-catalog/glaze-grid.tsx`
- Create: `src/components/glaze-catalog/glaze-filters.tsx`
- Modify: `src/components/glaze-catalog-explorer.tsx`

- [ ] **Step 1: Extract `GlazeCard`**

In `glaze-catalog-explorer.tsx`, find the JSX that renders a single glaze in the grid (the repeating item in the map). Move it to `src/components/glaze-catalog/glaze-card.tsx`:

```typescript
"use client";
// Props: all the data a single card needs (glaze, inventoryState, firingImages, ...)
// No state — accepts everything as props
// Includes the expanded detail panel (if the component has inline expansion)
export function GlazeCard({ glaze, inventoryState, firingImages, isExpanded, onToggle, ... }) {
  return (/* JSX for a single glaze card */);
}
```

- [ ] **Step 2: Extract `GlazeFilters`**

Move the filter sidebar/panel JSX into `src/components/glaze-catalog/glaze-filters.tsx`:

```typescript
"use client";
// Props: all filter state + toggle handlers from useGlazeExplorer
export function GlazeFilters({ selectedBrands, toggleBrand, brandCounts, ... }) {
  return (/* filter panel JSX */);
}
```

- [ ] **Step 3: Extract `GlazeGrid`**

Move the grid container JSX into `src/components/glaze-catalog/glaze-grid.tsx`:

```typescript
"use client";
// Props: visibleGlazes, inventoryStates, firingImageMap, ...
// Renders GlazeCard[] + Load More button
export function GlazeGrid({ glazes, inventoryStates, firingImageMap, hasMore, onLoadMore, ... }) {
  return (
    <div className="grid ...">
      {glazes.map((indexed) => <GlazeCard key={indexed.glaze.id} ... />)}
      {hasMore ? <button onClick={onLoadMore}>Load more</button> : null}
    </div>
  );
}
```

- [ ] **Step 4: Update `glaze-catalog-explorer.tsx`**

The container now imports and wires these components:

```typescript
import { GlazeFilters } from "./glaze-catalog/glaze-filters";
import { GlazeGrid } from "./glaze-catalog/glaze-grid";
import { useGlazeExplorer } from "./glaze-catalog/use-glaze-explorer";

export function GlazeCatalogExplorer(props: GlazeCatalogExplorerProps) {
  const explorer = useGlazeExplorer(props);
  return (
    <div>
      {/* search input */}
      <GlazeFilters {...explorerFilterProps} />
      <GlazeGrid {...explorerGridProps} />
    </div>
  );
}
```

- [ ] **Step 5: Build and visual verify**

```bash
npm run build
```

Open `http://localhost:3000/glazes` and verify:
- Glaze grid renders correctly
- Search works
- Filters toggle correctly
- Load more works

- [ ] **Step 6: Commit**

```bash
git add src/components/glaze-catalog/ src/components/glaze-catalog-explorer.tsx
git commit -m "refactor: extract GlazeCard, GlazeGrid, GlazeFilters from GlazeCatalogExplorer"
```

---

## Task 13: Split src/lib/data/admin.ts

**Files:**
- Create: `src/lib/data/admin/intake.ts`
- Create: `src/lib/data/admin/analytics.ts`
- Create: `src/lib/data/admin/moderation.ts`
- Create: `src/lib/data/admin/index.ts`
- Delete: `src/lib/data/admin.ts`

`src/lib/data/admin.ts` is 1250 lines covering three distinct domains: intake queue, analytics, and moderation. Split by domain.

- [ ] **Step 1: Read the file and identify domain boundaries**

```bash
cat src/lib/data/admin.ts
```

Group functions by domain:
- **Intake:** Functions related to `external_example_intakes`, `external_example_assets`, `external_example_glaze_mentions`
- **Analytics:** Functions related to leaderboards, user stats, contribution history, `getUserPointsRank`
- **Moderation:** Functions related to `moderation_items`, `reports`, `moderate_posts`, content flagging

- [ ] **Step 2: Create `src/lib/data/admin/intake.ts`**

Move all intake-related functions here. Keep the same function signatures and any shared helpers they need. Add `"use server"` only if the original had it; otherwise keep as a plain module.

- [ ] **Step 3: Create `src/lib/data/admin/analytics.ts`**

Move all analytics-related functions here, including `getUserPointsRank`.

- [ ] **Step 4: Create `src/lib/data/admin/moderation.ts`**

Move all moderation-related functions here.

- [ ] **Step 5: Create the barrel file**

Create `src/lib/data/admin/index.ts`:

```typescript
export * from "./intake";
export * from "./analytics";
export * from "./moderation";
```

- [ ] **Step 6: Update all imports**

Find all files that import from `@/lib/data/admin`:

```bash
grep -r "from.*lib/data/admin" src/ --include="*.ts" --include="*.tsx"
```

For each import, update to either the specific subdomain file (preferred) or the barrel `@/lib/data/admin/index` (acceptable).

- [ ] **Step 7: Delete the original**

```bash
git rm src/lib/data/admin.ts
```

- [ ] **Step 8: Build verify**

```bash
npm run build
```

Expected: Build passes. All imports resolve.

- [ ] **Step 9: Commit**

```bash
git add src/lib/data/admin/ src/lib/data/
git commit -m "refactor: split data/admin.ts into intake, analytics, moderation subdomain files"
```

---

## Task 14: Add Suspense Streaming to /community Page

**Files:**
- Modify: `src/app/(app)/community/page.tsx`

The community page has a single `getCommunityPosts` query. Streaming benefit is modest but consistent with the pattern — page header renders immediately while posts load.

- [ ] **Step 1: Create community skeleton**

Create `src/app/(app)/community/_components/community-posts-skeleton.tsx`:

```typescript
export function CommunityPostsSkeleton() {
  return (
    <div className="animate-pulse grid gap-6 lg:grid-cols-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border border-border bg-panel p-4">
          <div className="h-48 w-full rounded bg-muted/20" />
          <div className="mt-3 h-4 w-3/4 rounded bg-muted/30" />
          <div className="mt-2 h-3 w-1/2 rounded bg-muted/20" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create community posts server component**

Create `src/app/(app)/community/_components/community-posts-server.tsx`:

```typescript
import { PostCard } from "@/components/post-card";
import { Panel } from "@/components/ui/panel";
import { getCommunityPosts } from "@/lib/data/community";

export async function CommunityPostsServer({ query }: { query: string }) {
  const posts = await getCommunityPosts(query);

  if (!posts.length) {
    return (
      <Panel>
        <h2 className="display-font text-3xl tracking-tight">No matches found.</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Try a glaze name, cone range, trait word like matte or runny, or one of the descriptive words from a caption.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update the community page**

Replace `src/app/(app)/community/page.tsx` with:

```typescript
import { Suspense } from "react";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";
import { CommunityPostsServer } from "./_components/community-posts-server";
import { CommunityPostsSkeleton } from "./_components/community-posts-skeleton";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;
  const query = formatSearchQuery(params.q);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community"
        title="Shared kiln-tested combinations"
        description="Browse what other members have published, then jump into the pair detail page when a result overlaps with your shelf."
      />

      <Panel>
        <form className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by glaze name, trait tag, caption, firing note, or application note"
            className="border-0 bg-transparent px-0"
          />
        </form>
      </Panel>

      <Suspense fallback={<CommunityPostsSkeleton />}>
        <CommunityPostsServer query={query} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 4: Build verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/community/page.tsx src/app/(app)/community/_components/
git commit -m "feat: add Suspense streaming to community page"
```

---

## Task 15: Split CombinationsBrowser

**Files:**
- Create: `src/components/combinations-browser/use-combinations-browser.ts`
- Create: `src/components/combinations-browser/combination-grid.tsx`
- Create: `src/components/combinations-browser/combination-filters.tsx`
- Modify: `src/components/combinations-browser.tsx`

- [ ] **Step 1: Read the full component**

```bash
cat src/components/combinations-browser.tsx
```

Identify all `useState`, `useMemo`, `useEffect` calls (these move to the hook) and the rendering sections (filter panel, grid, individual cards).

- [ ] **Step 2: Create the state hook**

Create `src/components/combinations-browser/use-combinations-browser.ts`.

The hook receives all input data as props and returns all state + handlers:

```typescript
import type { VendorCombinationExample, CombinationPost, UserCombinationExample, GlazeFiringImage, InventoryStatus } from "@/lib/types";

interface CombinationsBrowserInput {
  examples: VendorCombinationExample[];
  publishedPosts: CombinationPost[];
  myPosts: CombinationPost[];
  userExamples: UserCombinationExample[];
  inventoryStatusByGlazeId: Record<string, InventoryStatus>;
  firingImageMap: Record<string, GlazeFiringImage[]>;
  favouriteCombinationIds: string[];
  viewerId: string;
  preferredCone: string | null;
  preferredAtmosphere: string | null;
  initialQuery: string;
  selectedView: "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";
  justPublished: boolean;
}

export function useCombinationsBrowser(input: CombinationsBrowserInput) {
  // All useState / useMemo moved here
  // Returns: { filteredExamples, filteredPosts, searchQuery, setSearchQuery,
  //            activeView, setActiveView, ... }
}
```

- [ ] **Step 3: Extract `CombinationFilters`**

Create `src/components/combinations-browser/combination-filters.tsx` with the filter/tab bar JSX.

- [ ] **Step 4: Extract `CombinationGrid`**

Create `src/components/combinations-browser/combination-grid.tsx` with the grid and card rendering.

- [ ] **Step 5: Slim down `combinations-browser.tsx`**

The container component uses the hook and composes the two pieces:

```typescript
import { useCombinationsBrowser } from "./combinations-browser/use-combinations-browser";
import { CombinationFilters } from "./combinations-browser/combination-filters";
import { CombinationGrid } from "./combinations-browser/combination-grid";

export function CombinationsBrowser(props: CombinationsBrowserProps) {
  const browser = useCombinationsBrowser(props);
  return (
    <div className="space-y-6">
      <CombinationFilters {...browser.filterProps} />
      <CombinationGrid {...browser.gridProps} />
    </div>
  );
}
```

- [ ] **Step 6: Build and visual verify**

```bash
npm run build
```

Open `http://localhost:3000/combinations` and verify filters, search, and grid all work.

- [ ] **Step 7: Commit**

```bash
git add src/components/combinations-browser.tsx src/components/combinations-browser/
git commit -m "refactor: extract useCombinationsBrowser hook + presentational components"
```

---

## Task 16: Split InventoryWorkspace and CommunityImagesPanel

**Files:**
- Create: `src/components/inventory-workspace/use-inventory-workspace.ts`
- Create: `src/components/inventory-workspace/inventory-grid.tsx`
- Create: `src/components/inventory-workspace/inventory-card.tsx`
- Create: `src/components/community-images/use-community-images.ts`
- Create: `src/components/community-images/community-image-grid.tsx`
- Modify: `src/components/inventory-workspace.tsx`
- Modify: `src/components/community-images-panel.tsx`

- [ ] **Step 1: Read both components**

```bash
cat src/components/inventory-workspace.tsx
cat src/components/community-images-panel.tsx
```

- [ ] **Step 2: Extract `useInventoryWorkspace` hook**

Create `src/components/inventory-workspace/use-inventory-workspace.ts` with all state from `inventory-workspace.tsx`. Same pattern as Task 11 (hook returns state + handlers, no JSX).

- [ ] **Step 3: Extract `InventoryGrid` and `InventoryCard`**

Create `inventory-workspace/inventory-grid.tsx` and `inventory-workspace/inventory-card.tsx` with the rendering logic. Props only — no state.

- [ ] **Step 4: Slim down `inventory-workspace.tsx`**

Container wires the hook to the extracted components.

- [ ] **Step 5: Extract `useCommunityImages` hook**

Create `src/components/community-images/use-community-images.ts` with all state from `community-images-panel.tsx`.

- [ ] **Step 6: Extract `CommunityImageGrid`**

Create `src/components/community-images/community-image-grid.tsx` with the image grid rendering.

- [ ] **Step 7: Slim down `community-images-panel.tsx`**

Container wires hook to `CommunityImageGrid`.

- [ ] **Step 8: Build and verify**

```bash
npm run build
```

Open `http://localhost:3000/inventory` and `http://localhost:3000/glazes/<id>` and verify both sections render and interact correctly.

- [ ] **Step 9: Commit**

```bash
git add src/components/inventory-workspace.tsx src/components/inventory-workspace/ \
        src/components/community-images-panel.tsx src/components/community-images/
git commit -m "refactor: extract hooks + presentational components from InventoryWorkspace and CommunityImagesPanel"
```

---

## Task 17: Final Build Verification + Checklist

- [ ] **Step 1: Full clean build**

```bash
npm run build
```

Expected: Zero TypeScript errors, zero build failures.

- [ ] **Step 2: Dev server smoke test**

```bash
npm run dev:test
```

Open each of these pages and confirm they render without console errors:
- `http://localhost:3000/glazes`
- `http://localhost:3000/glazes/<any-glaze-id>`
- `http://localhost:3000/combinations`
- `http://localhost:3000/combinations/<any-pair-key>`
- `http://localhost:3000/profile`

- [ ] **Step 3: Confirm success criteria from spec**

- [ ] All five pages listed in the spec have Suspense boundaries with skeleton fallbacks
- [ ] All four large client components split into hook + container + presentational pieces (`glaze-catalog-explorer`, `combinations-browser`, `inventory-workspace`, `community-images-panel`)
- [ ] `src/lib/data/admin.ts` deleted, replaced by `admin/` directory
- [ ] `src/lib/supabase/database.types.ts` committed
- [ ] `types:generate` script in `package.json`
- [ ] All three Supabase clients (`server.ts`, `browser.ts`, `admin.ts`) use `Database` generic
- [ ] `SectionErrorBoundary` component created and used on glaze detail, combination detail, profile pages
- [ ] `npm run build` passes with no type errors

- [ ] **Step 4: Final commit if any loose files remain**

```bash
git status
git add -p  # stage only relevant files
git commit -m "chore: phase 1 architecture cleanup final check"
```
