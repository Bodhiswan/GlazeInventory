# Best Practices Phase 2: UX / Design System

**Date:** 2026-04-08
**Status:** Approved
**Scope:** Phase 2 of a 3-phase best-practices effort. Phase 1 (Code Architecture) is complete. Phase 3 (Database & Data Layer) will be specced separately.

---

## Background

Phase 1 fixed the architectural gaps (Suspense streaming, component splitting, type safety, error boundaries). The site now has a clean server/client structure but the visual layer has accumulated inconsistency: spacing values vary arbitrarily across pages, and several UI patterns (empty states, stat tiles, page headers) are built from scratch on each page rather than drawn from shared components.

The two most painful symptoms identified:
1. **Spacing inconsistency** — margins, padding, and gaps vary across pages with no governing system
2. **Same UI built differently** — empty states, stat blocks, and page headers reinvented per page

The goal is to fix both: polish the existing UI to feel cohesive, and lay down a system that prevents future drift.

---

## Approach: Systematic (tokens → components → pages)

Three sequential phases, each building on the previous:

1. Codify a spacing system into `globals.css`
2. Extract the highest-value duplicated patterns into shared components
3. Sweep all main pages to apply the system

---

## 1. Spacing System

### Problem

Tailwind v4's full spacing scale is available but no rule governs which values to use for which purpose. The best parts of the codebase already use a consistent responsive pattern (`p-4 sm:p-5`, `gap-4 sm:gap-5`), but other places deviate arbitrarily.

### Solution

Add three semantic spacing tokens to `globals.css` under the existing `@theme inline` block:

```css
/* Canonical spacing scale — use these contexts, not ad-hoc values */
--space-inner: 1rem;     /* padding inside cards/panels    → p-4 sm:p-5 */
--space-gap: 1.25rem;    /* gap between sibling components → gap-4 sm:gap-5 */
--space-section: 2rem;   /* gap between page sections      → gap-6 sm:gap-8 */
```

These map to Tailwind classes that the app already uses in its best places. The tokens make intent explicit and serve as documentation.

**Page-level horizontal padding** (`px-3 sm:px-4 lg:px-6`) is already consistent via AppShell — no change needed.

### Out of scope

- No new spacing values beyond these three
- No changes to the visual design language (flat, no radius, earthy palette)
- No typography scale changes (Crimson Text / Inter pairing stays as-is)

---

## 2. Component Extraction

### New components

#### `<EmptyState>` — `src/components/ui/empty-state.tsx`

Currently, every page with no data builds its own inline `<Panel>` with a heading, description, and optional button. A single shared component handles this everywhere.

**Props:**
```typescript
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;  // optional Button or Link
}
```

**Renders:** a `<Panel>` with the title in display font, description in muted text, and action centered below.

#### `<StatTile>` — `src/components/ui/stat-tile.tsx`

Number + label blocks used in admin analytics and leaderboard views, currently built inline with varying styles.

**Props:**
```typescript
interface StatTileProps {
  label: string;
  value: number | string;
  sublabel?: string;  // optional context (e.g., "this week")
}
```

**Renders:** a `<Panel>` variant with a large `value` in display font, `label` as muted eyebrow text above, and optional `sublabel` below.

### Existing components to audit & enforce

| Component | Current issue | Fix |
|-----------|--------------|-----|
| `<PageHeader>` | Exists but some pages build their own heading structure inline | Sweep pages to replace inline headers with `<PageHeader>` |
| `<Panel>` | Padding overridden in some callsites with `p-3`, `p-6`, etc. | Remove overrides — let Panel control its own padding |
| `<Badge>` | One-off `<span>` badge-like elements exist in some pages | Replace with `<Badge>` |

---

## 3. Page Consistency Sweep

After the spacing system and components are in place, sweep each main page. The scope for each page is:
- Replace inline empty states with `<EmptyState>`
- Replace inline stat blocks with `<StatTile>`
- Replace hand-rolled page headers with `<PageHeader>`
- Fix spacing that deviates from canonical values
- Remove Panel padding overrides

**Pages in priority order:**

| Page | Likely issues |
|------|--------------|
| `/glazes` | Spacing between filter panel and grid |
| `/glazes/[glazeId]` | Section spacing in detail panel |
| `/combinations` | Inline empty state, spacing gaps |
| `/community` | Inline empty state, post grid spacing |
| `/profile` | Tab spacing, empty states per tab |
| `/admin` | Inline stat tiles, section spacing |

### What the sweep does NOT change

- No layout changes (column structure, sidebar placement, etc.)
- No color or typography changes
- No new features or interactions
- No changes to component behavior

---

## Success Criteria

- [ ] Three semantic spacing tokens defined in `globals.css`
- [ ] `<EmptyState>` component created and used on all pages that show a no-data state
- [ ] `<StatTile>` component created and used in admin/leaderboard views
- [ ] All main pages use `<PageHeader>` (no inline hand-rolled page headers)
- [ ] `<Panel>` has no callsite padding overrides
- [ ] All badge-like inline elements replaced with `<Badge>`
- [ ] All six pages pass a visual consistency check: spacing values match canonical scale, no inline duplicates of extracted components
- [ ] `npm run build` passes with no new type errors
- [ ] Dev server renders all affected pages without console errors

---

## Out of Scope (Phase 2)

- Navigation structure changes — identified as a secondary concern, not addressed here
- Information density changes — addressed as a side effect of consistent spacing, not a primary target
- New page layouts or features
- Accessibility audit — baseline is already solid; no WCAG-specific work in this phase
- Database & Data Layer — Phase 3
