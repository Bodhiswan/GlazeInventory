# Best Practices Phase 2: UX / Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codify a 3-value spacing system, extract two new shared UI components (`EmptyState`, `StatTile`), and sweep all main pages to apply them consistently.

**Architecture:** Three sequential phases — add spacing tokens to `globals.css`, create missing shared components, then sweep six pages to replace inline duplicates with shared components. No layout changes, no new features, no color/typography changes.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript 5

---

## File Map

**Create:**
- `src/components/ui/empty-state.tsx` — shared empty/error state: Panel + display-font title + muted description + optional action
- `src/components/ui/stat-tile.tsx` — shared stat block: big value + label + optional sublabel + optional icon

**Modify:**
- `src/app/globals.css` — add three semantic spacing tokens to `:root`
- `src/app/(app)/community/_components/community-posts-server.tsx` — inline Panel+h2+p → `<EmptyState>`
- `src/app/combinations/_components/combinations-data-server.tsx` — hardcoded green success div → `<FormBanner variant="success">`
- `src/app/(app)/admin/analytics/page.tsx` — delete local `StatCard` function; import `StatTile`; replace 3 inline access/error Panels with `<EmptyState>`
- `src/app/(app)/admin/intake/page.tsx` — inline access Panel → `<EmptyState>`
- `src/app/(app)/admin/moderation/page.tsx` — inline access Panel → `<EmptyState>`
- `src/app/(app)/profile/page.tsx` — inline contribution-points block → `<StatTile>`; amber warning div → `<FormBanner variant="error">`; nested raw div panels → `<Panel>`
- `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-server.tsx` — inline empty state → `<EmptyState>`

---

## Task 1: Add Spacing Tokens to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add the three tokens to `:root`**

Open `src/app/globals.css`. The `:root` block currently ends at `--radius: 0px;`. Add three tokens after it:

```css
:root {
  --bg: #faf8f6;
  --foreground: #1e1e1e;
  --ink-2: #333;
  --muted: rgba(30, 30, 30, 0.52);
  --border: rgba(30, 30, 30, 0.10);
  --panel: #f3f0ed;
  --panel-strong: #f3f0ed;
  --accent: #1e1e1e;
  --accent-2: #6b5c50;
  --accent-3: #6b7a56;
  --shadow: none;
  --tile-hover: #ece8e4;
  --radius: 0px;

  /* Canonical spacing — use these contexts, not ad-hoc Tailwind values */
  --space-inner: 1rem;     /* padding inside cards/panels    → p-4 sm:p-5 lg:p-6 */
  --space-gap: 1.25rem;    /* gap between sibling components → gap-4 sm:gap-5 */
  --space-section: 2rem;   /* gap between page sections      → gap-6 sm:gap-8 */
}
```

- [ ] **Step 2: Build verify**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1 | tail -10
```

Expected: same output as before (only the pre-existing `is_anonymous` error in `admin/analytics.ts`).

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git add src/app/globals.css && git commit -m "feat: add canonical spacing tokens to globals.css"
```

---

## Task 2: Create EmptyState Component

**Files:**
- Create: `src/components/ui/empty-state.tsx`

- [ ] **Step 1: Create the component**

```typescript
import type { ReactNode } from "react";

import { Panel } from "@/components/ui/panel";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Panel>
      <h2 className="display-font text-3xl tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Panel>
  );
}
```

- [ ] **Step 2: Build verify**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1 | tail -10
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git add src/components/ui/empty-state.tsx && git commit -m "feat: add EmptyState UI component"
```

---

## Task 3: Create StatTile Component

**Files:**
- Create: `src/components/ui/stat-tile.tsx`

- [ ] **Step 1: Create the component**

```typescript
import type { ElementType } from "react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  icon?: ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "border p-4",
        accent ? "border-foreground/20 bg-foreground/5" : "border-border bg-panel",
        Icon ? "flex items-start gap-3" : undefined,
      )}
    >
      {Icon ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-background">
          <Icon className="h-3.5 w-3.5 text-muted" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums leading-none text-foreground">{value}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        {sublabel ? <p className="mt-0.5 text-xs text-muted">{sublabel}</p> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build verify**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1 | tail -10
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git add src/components/ui/stat-tile.tsx && git commit -m "feat: add StatTile UI component"
```

---

## Task 4: Sweep Community and Combinations Pages

**Files:**
- Modify: `src/app/(app)/community/_components/community-posts-server.tsx`
- Modify: `src/app/combinations/_components/combinations-data-server.tsx`

### community-posts-server.tsx

- [ ] **Step 1: Replace inline empty state**

Current `community-posts-server.tsx` (lines 8–16):
```tsx
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
```

Replace with:
```tsx
import { EmptyState } from "@/components/ui/empty-state";

// Remove: import { Panel } from "@/components/ui/panel";  ← only if Panel is no longer used elsewhere in the file

if (!posts.length) {
  return (
    <EmptyState
      title="No matches found."
      description="Try a glaze name, cone range, trait word like matte or runny, or one of the descriptive words from a caption."
    />
  );
}
```

Remove the `Panel` import if it is no longer used in the file.

### combinations-data-server.tsx

- [ ] **Step 2: Replace hardcoded success banner**

Current `combinations-data-server.tsx` (lines 58–62):
```tsx
{justPublished ? (
  <div className="border border-[#3a6642]/20 bg-[#3a6642]/10 px-4 py-3 text-sm text-[#2e5234]">
    Your combination has been published and is now visible under your examples.
  </div>
) : null}
```

Replace with:
```tsx
import { FormBanner } from "@/components/ui/form-banner";

{justPublished ? (
  <FormBanner variant="success">
    Your combination has been published and is now visible under your examples.
  </FormBanner>
) : null}
```

- [ ] **Step 3: Build verify**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1 | tail -10
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git add src/app/\(app\)/community/_components/community-posts-server.tsx src/app/combinations/_components/combinations-data-server.tsx && git commit -m "refactor: replace inline empty states and banners in community and combinations"
```

---

## Task 5: Sweep Admin Pages

**Files:**
- Modify: `src/app/(app)/admin/analytics/page.tsx`
- Modify: `src/app/(app)/admin/intake/page.tsx`
- Modify: `src/app/(app)/admin/moderation/page.tsx`

### admin/analytics/page.tsx

- [ ] **Step 1: Add imports**

At the top of `src/app/(app)/admin/analytics/page.tsx`, add:
```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
```

- [ ] **Step 2: Delete the local `StatCard` function**

Remove the entire `StatCard` function (lines 65–90 in the original file):
```tsx
// DELETE THIS ENTIRE FUNCTION:
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-3 border p-4", accent ? "border-foreground/20 bg-foreground/5" : "border-border bg-panel")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-background">
        <Icon className="h-3.5 w-3.5 text-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums leading-none text-foreground">{value}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `<StatCard ...>` with `<StatTile ...>`**

Find all calls to `<StatCard ...>` in the stats grid section and replace with `<StatTile ...>`. Change the `sub` prop to `sublabel`:

```tsx
{/* Before */}
<StatCard label="Total users" value={stats.totalUsers} icon={Users} />
<StatCard label="New users" value={stats.newUsers} icon={Users} accent />
<StatCard label="Glaze views" value={stats.glazeViews} icon={Eye} accent />
<StatCard label="Combinations" value={stats.combinationsPublished} icon={Layers3} accent />
<StatCard label="Custom glazes" value={stats.customGlazesCreated} icon={PenLine} accent />
<StatCard label="Buy clicks" value={stats.buyClicks} icon={ShoppingCart} accent />
<StatCard label="Inventory items" value={stats.totalInventoryItems} icon={Package} />

{/* After */}
<StatTile label="Total users" value={stats.totalUsers} icon={Users} />
<StatTile label="New users" value={stats.newUsers} icon={Users} accent />
<StatTile label="Glaze views" value={stats.glazeViews} icon={Eye} accent />
<StatTile label="Combinations" value={stats.combinationsPublished} icon={Layers3} accent />
<StatTile label="Custom glazes" value={stats.customGlazesCreated} icon={PenLine} accent />
<StatTile label="Buy clicks" value={stats.buyClicks} icon={ShoppingCart} accent />
<StatTile label="Inventory items" value={stats.totalInventoryItems} icon={Package} />
```

If any `<StatCard>` call had a `sub` prop, rename it to `sublabel`.

- [ ] **Step 4: Replace three inline access/error Panels with EmptyState**

The file has three early-return blocks with this pattern:
```tsx
// Pattern to replace (three times with different titles/descriptions):
return (
  <Panel>
    <h1 className="display-font text-3xl tracking-tight">Access required</h1>
    <p className="mt-3 text-sm leading-6 text-muted">This screen is only available for administrators.</p>
  </Panel>
);
```

Replace each with `<EmptyState>`:
```tsx
// 1. Admin check
return <EmptyState title="Access required" description="This screen is only available for administrators." />;

// 2. Config error check
return <EmptyState title="Configuration error" description="SUPABASE_SERVICE_ROLE_KEY is not set. Add it to Vercel environment variables." />;

// 3. Dashboard fetch error — keep the error message dynamic:
return <EmptyState title="Dashboard error" description={e instanceof Error ? e.message : String(e)} />;
```

Also remove the `Panel` import if it is no longer used in the file after these changes.

### admin/intake/page.tsx

- [ ] **Step 5: Replace inline access Panel**

Current (lines 28–37):
```tsx
if (!viewer.profile.isAdmin) {
  return (
    <Panel>
      <h1 className="display-font text-3xl tracking-tight">Intake access required</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        This queue is only available for studio administrators.
      </p>
    </Panel>
  );
}
```

Replace with:
```tsx
import { EmptyState } from "@/components/ui/empty-state";

if (!viewer.profile.isAdmin) {
  return <EmptyState title="Intake access required" description="This queue is only available for studio administrators." />;
}
```

Remove the `Panel` import if no longer used.

Also read the file fully to find any other inline empty states (e.g., "No intake records in this view") and replace them the same way.

### admin/moderation/page.tsx

- [ ] **Step 6: Replace inline access Panel**

Current (lines 17–26):
```tsx
if (!viewer.profile.isAdmin) {
  return (
    <Panel>
      <h1 className="display-font text-3xl tracking-tight">Moderation access required</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        This screen is only available for studio administrators.
      </p>
    </Panel>
  );
}
```

Replace with:
```tsx
import { EmptyState } from "@/components/ui/empty-state";

if (!viewer.profile.isAdmin) {
  return <EmptyState title="Moderation access required" description="This screen is only available for studio administrators." />;
}
```

Remove the `Panel` import if no longer used.

- [ ] **Step 7: Build verify**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1 | tail -15
```

Expected: no new errors beyond the pre-existing `is_anonymous` issue.

- [ ] **Step 8: Commit**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git add src/app/\(app\)/admin/ && git commit -m "refactor: replace inline StatCard and empty states in admin pages with shared components"
```

---

## Task 6: Sweep Profile Page

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Add imports**

Add to the existing imports at the top of `src/app/(app)/profile/page.tsx`:
```tsx
import { StatTile } from "@/components/ui/stat-tile";
```

(`FormBanner` is already imported.)

- [ ] **Step 2: Replace inline stat block with StatTile**

Current (lines 149–163 approximately):
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
```

Replace with:
```tsx
{(viewer.profile.points ?? 0) > 0 ? (
  <StatTile
    label="Contribution points"
    value={`${(viewer.profile.points ?? 0).toLocaleString()} pts`}
    sublabel={rank > 0 ? `#${rank} globally` : undefined}
  />
) : null}
```

- [ ] **Step 3: Replace amber warning div with FormBanner**

Current (lines 165–171 approximately):
```tsx
{viewer.profile.contributionsDisabled && !viewer.profile.isAdmin ? (
  <div className="border border-amber-200 bg-amber-50 p-4">
    <p className="text-sm text-amber-800">
      Your contribution access has been disabled after repeated policy violations. Contact support if you believe this is an error.
    </p>
  </div>
) : null}
```

Replace with:
```tsx
{viewer.profile.contributionsDisabled && !viewer.profile.isAdmin ? (
  <FormBanner variant="error">
    Your contribution access has been disabled after repeated policy violations. Contact support if you believe this is an error.
  </FormBanner>
) : null}
```

- [ ] **Step 4: Replace raw "Current defaults" div with Panel**

Current (lines 137–146 approximately):
```tsx
<div className="border border-border bg-panel p-4">
  <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Current defaults</p>
  <div className="mt-3 space-y-2 text-sm text-muted">
    <p>Cone: {viewer.profile.preferredCone ?? "Any cone"}</p>
    <p>
      Restrict to matching examples:{" "}
      {viewer.profile.restrictToPreferredExamples ? "Yes" : "No"}
    </p>
  </div>
</div>
```

Replace with `<Panel>` (which provides `p-4 sm:p-5 lg:p-6` automatically):
```tsx
<Panel>
  <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Current defaults</p>
  <div className="mt-3 space-y-2 text-sm text-muted">
    <p>Cone: {viewer.profile.preferredCone ?? "Any cone"}</p>
    <p>
      Restrict to matching examples:{" "}
      {viewer.profile.restrictToPreferredExamples ? "Yes" : "No"}
    </p>
  </div>
</Panel>
```

- [ ] **Step 5: Build verify**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1 | tail -10
```

Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git add src/app/\(app\)/profile/page.tsx && git commit -m "refactor: replace inline stat block and amber warning in profile with shared components"
```

---

## Task 7: Sweep Glaze Detail Page

**Files:**
- Modify: `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-server.tsx`

- [ ] **Step 1: Read the file**

Read `src/app/(app)/glazes/[glazeId]/_components/glaze-user-state-server.tsx` in full to identify:
- Any inline empty state (Panel + h2 + p for "No comments yet" or similar)
- Any raw div panels with `p-4` overrides
- Any spacing deviations from `gap-4 sm:gap-5`

- [ ] **Step 2: Replace inline empty states**

If the file has an inline empty state like:
```tsx
<Panel>
  <h2 className="display-font text-3xl tracking-tight">No comments yet.</h2>
  <p className="mt-3 text-sm leading-6 text-muted">Be the first to leave a comment.</p>
</Panel>
```

Replace with:
```tsx
import { EmptyState } from "@/components/ui/empty-state";

<EmptyState title="No comments yet." description="Be the first to leave a comment." />
```

Read the actual file to get the exact text — the above is illustrative.

- [ ] **Step 3: Fix any raw div panels**

If there are raw `<div className="border border-border bg-panel p-4">` blocks (not using the `<Panel>` component), replace them with `<Panel>` which provides consistent responsive padding.

- [ ] **Step 4: Build verify**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git add src/app/\(app\)/glazes/ && git commit -m "refactor: replace inline empty states in glaze detail with shared EmptyState"
```

---

## Task 8: Final Build Verification and Success Criteria

- [ ] **Step 1: Full build**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && npm run build 2>&1
```

Expected: only the pre-existing `is_anonymous` error. Zero new TypeScript errors.

- [ ] **Step 2: Verify success criteria**

Check each item:

```bash
# 1. Spacing tokens in globals.css
grep "space-inner\|space-gap\|space-section" "src/app/globals.css"
# Expected: 3 matches

# 2. EmptyState component exists
ls src/components/ui/empty-state.tsx

# 3. StatTile component exists
ls src/components/ui/stat-tile.tsx

# 4. EmptyState used across pages (should find 6+ usages)
grep -r "EmptyState" src/app --include="*.tsx" -l

# 5. StatTile used across pages
grep -r "StatTile" src/app --include="*.tsx" -l

# 6. No local StatCard function remaining
grep -r "function StatCard" src/ --include="*.tsx"
# Expected: no output

# 7. No hardcoded amber warning divs
grep -r "border-amber" src/ --include="*.tsx"
# Expected: no output

# 8. No hardcoded green success banners
grep -r "#3a6642" src/ --include="*.tsx"
# Expected: no output
```

- [ ] **Step 3: Commit final check if any loose files remain**

```bash
cd "C:\Users\bodh\Documents\code\Glaze Library" && git status
```

If any modified files haven't been committed:
```bash
git add -p
git commit -m "chore: phase 2 final consistency cleanup"
```
