# Code Refactor Design Spec

**Date:** 2026-04-07
**Status:** Approved

## Goal

Split three monolithic files (`lib/data.ts`, `app/actions.ts`, `lib/utils.ts`) into domain-scoped modules to improve navigability and maintainability. No behavioral changes — pure code reorganization.

## Problem

Three files have grown too large to reason about efficiently:

| File | LOC | Exports |
|---|---|---|
| `src/lib/data.ts` | 2,595 | 47 |
| `src/app/actions.ts` | 2,553 | 52 |
| `src/lib/utils.ts` | 855 | 31 |

## Approach

Split by domain. Each new file owns one clear area of the codebase. Consumers update their imports to point directly at the domain file — no barrel/re-export wrappers.

## New File Structure

### `lib/data.ts` → `lib/data/`

| File | Owns |
|---|---|
| `lib/data/users.ts` | `getViewer`, `requireViewer`, `getPublicGuestViewer`, `getAdminUsers`, `getAllDisplayNames`, `lookupUserIdByDisplayName` |
| `lib/data/glazes.ts` | Glaze detail, firing images, color/finish/cone traits, descriptions |
| `lib/data/inventory.ts` | `getCatalogGlazes`, inventory items, folders, ownership |
| `lib/data/combinations.ts` | Combination summaries, vendor examples, user examples, combination detail |
| `lib/data/community.ts` | Community posts, firing images per glaze/combo, favourites, direct messages |
| `lib/data/admin.ts` | Dashboard, analytics, leaderboard, points, intake queue, moderation queue, admin user detail |

### `app/actions.ts` → `app/actions/`

| File | Owns |
|---|---|
| `app/actions/auth.ts` | Sign in, sign up, sign out, magic link, password reset/update |
| `app/actions/inventory.ts` | Inventory CRUD, folders, custom glazes, shelf/amount/notes |
| `app/actions/glazes.ts` | Toggle ownership, tag votes, favourites, descriptions, scanner, buy click tracking |
| `app/actions/combinations.ts` | Publish, delete, admin archive/edit combinations |
| `app/actions/community.ts` | Comments, firing image uploads, report post, direct messages |
| `app/actions/admin.ts` | Moderation, intake approval/rejection, admin glaze edits, false contribution flags |
| `app/actions/profile.ts` | Profile preference updates |

### `lib/utils.ts` → partial extract

| File | Owns |
|---|---|
| `lib/glaze-metadata.ts` | `ACTIVE_GLAZE_BRANDS`, `GLAZE_FAMILY_LABELS`, and all large brand/line/family mapping constants |
| `lib/utils.ts` | Stays — pure utility functions only (cn, formatters, search, matchers, color helpers) |

## Constraints

- No behavioral changes — identical function signatures and return types
- All existing tests must pass after each split
- `npm run build` must pass at the end
- Work is isolated to the `v2-refactor` branch — `main` is never touched
- Imports updated at every call site (no barrel re-exports)

## Out of Scope

- Vendor image CDN migration
- Adding new tests
- Any feature changes
