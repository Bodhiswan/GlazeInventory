# Best Practices Phase 1: Code Architecture

**Date:** 2026-04-07
**Status:** Approved
**Scope:** Phase 1 of a 3-phase best-practices effort. Phases 2 (UX/Design System) and 3 (Database & Data Layer) will be specced separately after this phase ships.

---

## Background

The codebase grew significantly after initial creation without a deliberate architecture review. The server/client split is fundamentally sound — all pages are Server Components fetching data, all interactive pieces are Client Components, and Server Actions handle mutations. However, four specific gaps have accumulated:

1. No granular Suspense streaming — pages block on all data before rendering anything
2. Large client components mixing state, rendering, and event handling in one file
3. Hand-written types that drift silently from the database schema
4. Only page-level error boundaries — one failing section crashes the whole page

This spec covers fixing all four.

---

## 1. Granular Suspense Streaming

### Problem

Every page uses `await Promise.all([...all data fetches...])` before rendering. The page waits for the slowest query. The only fallback is a coarse `loading.tsx` skeleton at the page level.

### Solution

Identify independent data streams per page and extract them into nested Server Component wrappers, each with its own `<Suspense>` boundary and skeleton fallback.

**Pattern:**
```tsx
// Before — whole page waits for everything
const [catalog, inventory, favourites] = await Promise.all([
  getCatalogGlazes(viewerId),
  getInventory(viewerId),
  getFavouriteIds(viewerId),
])
return <GlazeCatalogExplorer catalog={catalog} inventory={inventory} favourites={favourites} />

// After — catalog renders immediately, ownership state streams in
return (
  <Suspense fallback={<GlazeCatalogSkeleton />}>
    <GlazeCatalogServer viewerId={viewerId} />
  </Suspense>
)

// GlazeCatalogServer (nested Server Component)
async function GlazeCatalogServer({ viewerId }) {
  const catalog = await getCatalogGlazes(viewerId)
  return (
    <GlazeCatalogExplorer catalog={catalog}>
      <Suspense fallback={<OwnershipBadgesSkeleton />}>
        <OwnershipServer viewerId={viewerId} />
      </Suspense>
    </GlazeCatalogExplorer>
  )
}
```

### Pages to update

| Page | Primary stream | Secondary stream(s) |
|------|---------------|---------------------|
| `/glazes` | Catalog grid | Inventory ownership, favourites |
| `/combinations` | Combinations grid | Published examples, user examples |
| `/community` | Community feed | User's own contribution status |
| `/glazes/[glazeId]` | Glaze detail | Comments, community images, tag votes |
| `/combinations/[pairKey]` | Combination detail | Comments, community images |

### Skeleton components

Each Suspense boundary gets a purpose-built skeleton, not a generic spinner. Skeletons match the shape of the content they replace (card grids, comment lists, badge rows).

### Implementation note

Passing a Server Component as `children` to a Client Component is valid in the App Router (the "server component in client component children" pattern). However, the client components listed above (`GlazeCatalogExplorer`, etc.) currently don't accept a `children` prop. Each will need `children?: React.ReactNode` added and rendered at the appropriate slot in their JSX as part of this change.

---

## 2. Component Splitting

### Problem

Large client components mix state management, rendering logic, and event handling in a single file. Examples:
- `glaze-catalog-explorer.tsx` — search state, filter state, pagination, card rendering, server action calls
- `combinations-browser.tsx` — similar pattern
- `inventory-workspace.tsx` — folder management, state picker, drag interactions
- `data/admin.ts` — 1250 lines covering intake, analytics, and moderation queries

### Solution

Split each large component into three layers:

**1. State hook** (`use-glaze-explorer.ts`)
All filter/search/pagination state. Returns state values and handlers. No JSX.

**2. Container** (`glaze-catalog-explorer.tsx`)
Thin shell. Wires hook to view. Handles server action calls. Minimal logic.

**3. Presentational pieces** (`glaze-grid.tsx`, `glaze-filters.tsx`, `glaze-card.tsx`)
Pure render. Accept props, return JSX. No state. Independently reusable.

**Admin data files** split by subdomain:
- `src/lib/data/admin/intake.ts`
- `src/lib/data/admin/analytics.ts`
- `src/lib/data/admin/moderation.ts`
- `src/lib/data/admin/index.ts` — re-exports all for consumers that import from `data/admin`

### Components to split

| Current file | Extract |
|---|---|
| `glaze-catalog-explorer.tsx` | `use-glaze-explorer.ts`, `glaze-grid.tsx`, `glaze-filters.tsx`, `glaze-card.tsx` |
| `combinations-browser.tsx` | `use-combinations-browser.ts`, `combination-grid.tsx`, `combination-filters.tsx` |
| `inventory-workspace.tsx` | `use-inventory-workspace.ts`, `inventory-grid.tsx`, `inventory-card.tsx` |
| `community-images-panel.tsx` | `use-community-images.ts`, `community-image-grid.tsx` |
| `src/lib/data/admin.ts` | Split into `admin/intake.ts`, `admin/analytics.ts`, `admin/moderation.ts` |

---

## 3. End-to-End Type Safety

### Problem

Types in `src/lib/types.ts` are hand-written and manually kept in sync with the PostgreSQL schema. As migrations land, drift accumulates silently — a renamed column or added field goes unnoticed until a runtime error surfaces.

### Solution

Wire Supabase's type generation into the dev workflow:

**Generated file:** `src/lib/supabase/database.types.ts`
Generated by `supabase gen types typescript --local`. Committed to the repo so CI can detect drift.

**Script added to `package.json`:**
```json
"types:generate": "supabase gen types typescript --local > src/lib/supabase/database.types.ts"
```

**Existing map functions updated:**
`mapGlaze()`, `mapProfile()`, `mapCombination()`, etc. already exist in `src/lib/data/`. Their input types change from hand-written interfaces to rows derived from `Database['public']['Tables']['glazes']['Row']`. The output (app-level) types in `lib/types.ts` remain as-is — they're the stable interface the rest of the app uses.

**CI check:**
Add a step that runs `types:generate` and fails if the output differs from the committed file. This catches schema changes that weren't accompanied by a type regeneration.

---

## 4. Consistent Error Handling

### Problem

Three error boundaries exist at the page level. If one section of a page fails (e.g., the comments panel throws), the entire page crashes and shows the generic error boundary.

### Solution

Add a middle tier of section-level error boundaries around independently failable features.

**New shared component:** `src/components/section-error-fallback.tsx`
Simple, consistent UI: a muted message ("This section failed to load") with an optional retry button that calls the error boundary's `reset`. Used everywhere.

**Wrap independently failable sections:**
- Glaze detail page: comments panel, community images panel, tag voting
- Combination detail page: comments panel, community images panel
- Admin analytics: each metric section wrapped independently
- Profile page: each tab wrapped independently

**Implementation:** React's `ErrorBoundary` class component wrapping each section, using `SectionErrorFallback` as the fallback UI. The existing page-level `error.tsx` files stay as the last resort.

---

## Architecture Diagram

```
Page (Server Component)
├── Primary content (Suspense boundary + skeleton)
│   └── Nested Server Component → fetches primary data → Client Component
│       └── Secondary data (Suspense boundary + skeleton)
│           └── Nested Server Component → fetches secondary data → props
└── Independent section (ErrorBoundary)
    └── Suspense boundary
        └── Section content
```

---

## Out of Scope (Phase 1)

- UX/Design System (design tokens, component library, accessibility) — Phase 2
- Database optimizations, RLS audit, FK indexes — Phase 3
- Testing infrastructure (Playwright E2E, CI pipeline) — separate initiative
- Points/bounty system — separate spec already exists

---

## Success Criteria

- [ ] All five pages listed in section 1 have granular Suspense boundaries with skeleton fallbacks
- [ ] All four large client components split into hook + container + presentational layers
- [ ] `admin.ts` data file split into three subdomain files
- [ ] `src/lib/supabase/database.types.ts` generated and committed
- [ ] `types:generate` script in `package.json`
- [ ] All `map*()` functions typed against the generated file
- [ ] `SectionErrorFallback` component created
- [ ] All independently failable sections on glaze detail, combination detail, admin analytics, and profile pages wrapped with section-level error boundaries
- [ ] `npm run build` passes with no type errors
- [ ] Dev server renders all affected pages without console errors
