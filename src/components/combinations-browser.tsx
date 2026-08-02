"use client";

import { Search, X } from "lucide-react";

import type {
  CombinationPost,
  GlazeFiringImage,
  InventoryStatus,
  UserCombinationExample,
  VendorCombinationExample,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { ScrollRevealSearch } from "@/components/scroll-reveal-search";
import { useCombinationsBrowser } from "./combinations-browser/use-combinations-browser";
import type { CombinationsView } from "./combinations-browser/use-combinations-browser";
import { CombinationFilters } from "./combinations-browser/combination-filters";
import { CombinationGrid } from "./combinations-browser/combination-grid";
import { PageHeader } from "@/components/page-header";

export function CombinationsBrowser({
  examples,
  publishedPosts,
  myPosts,
  userExamples = [],
  glazeFiringImages,
  inventoryStatusByGlazeId,
  initialView = "all",
  initialQuery = "",
  viewerUserId = null,
  favouriteCombinationIds = [],
  lockedConeScope = null,
  availableViews,
}: {
  examples: VendorCombinationExample[];
  publishedPosts: CombinationPost[];
  myPosts: CombinationPost[];
  userExamples?: UserCombinationExample[];
  glazeFiringImages: Record<string, GlazeFiringImage[]>;
  inventoryStatusByGlazeId: Record<string, InventoryStatus>;
  initialView?: CombinationsView;
  initialQuery?: string;
  viewerUserId?: string | null;
  favouriteCombinationIds?: string[];
  lockedConeScope?: "lowfire" | "midfire" | null;
  availableViews?: CombinationsView[];
}) {
  const browser = useCombinationsBrowser({
    examples,
    publishedPosts,
    myPosts,
    userExamples,
    glazeFiringImages,
    inventoryStatusByGlazeId,
    initialView,
    initialQuery,
    viewerUserId,
    favouriteCombinationIds,
    lockedConeScope,
    availableViews,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={viewerUserId ? "Your workspace" : "Public library"}
        title="Glaze combinations"
        description="Explore tested pairings, check what your shelf can make, and save ideas for your next firing."
      />
      <ScrollRevealSearch>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-2.5 sm:px-4">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <Input
              value={browser.query}
              onChange={(event) => browser.setQuery(event.target.value)}
              aria-label="Search combinations by glaze"
              placeholder="Search a glaze, code, or keyword"
              className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
            />
            {browser.query.trim() ? (
              <button
                type="button"
                onClick={() => browser.setQuery("")}
                aria-label="Clear first combination search"
                className="text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-2.5 sm:px-4">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <Input
              value={browser.query2}
              onChange={(event) => browser.setQuery2(event.target.value)}
              aria-label="Search combinations by a second glaze"
              placeholder="And another glaze to narrow down"
              className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
            />
            {browser.query2.trim() ? (
              <button
                type="button"
                onClick={() => browser.setQuery2("")}
                aria-label="Clear second combination search"
                className="text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </ScrollRevealSearch>
      <CombinationFilters
        query={browser.query}
        setQuery={browser.setQuery}
        query2={browser.query2}
        setQuery2={browser.setQuery2}
        view={browser.view}
        setView={browser.setView}
        viewFilters={browser.viewFilters}
        viewLabel={browser.viewLabel}
        brandFilters={browser.brandFilters}
        setBrandFilters={browser.setBrandFilters}
        brandOptions={browser.brandOptions}
        brandOptionCounts={browser.brandOptionCounts}
        showCone5={browser.showCone5}
        setShowCone5={browser.setShowCone5}
        showCone6={browser.showCone6}
        setShowCone6={browser.setShowCone6}
        showCone10={browser.showCone10}
        setShowCone10={browser.setShowCone10}
        filtersOpen={browser.filtersOpen}
        setFiltersOpen={browser.setFiltersOpen}
        openFilterSections={browser.openFilterSections}
        setOpenFilterSections={browser.setOpenFilterSections}
        activeTilesLength={browser.activeTiles.length}
        hasFilters={browser.hasFilters}
        resetFilters={browser.resetFilters}
        INITIAL_TILE_BATCH={browser.INITIAL_TILE_BATCH}
        setVisibleCount={browser.setVisibleCount}
        hideConeFilter={lockedConeScope !== null}
      />
      <CombinationGrid
        activeTile={browser.activeTile}
        activeTiles={browser.activeTiles}
        visibleTiles={browser.visibleTiles}
        remainingCount={browser.remainingCount}
        loadMoreRef={browser.loadMoreRef}
        viewLabel={browser.viewLabel}
        view={browser.view}
        setActiveTileId={browser.setActiveTileId}
        glazeFiringImages={browser.glazeFiringImages}
        inventoryStatusByGlazeId={browser.inventoryStatusByGlazeId}
        handleInventoryStatusChange={browser.handleInventoryStatusChange}
        favouritedCombinationIds={browser.favouritedCombinationIds}
        pendingFavouriteIds={browser.pendingFavouriteIds}
        handleFavouriteToggle={browser.handleFavouriteToggle}
        viewerUserId={browser.viewerUserId}
        visibleCount={browser.visibleCount}
        setVisibleCount={browser.setVisibleCount}
        TILE_BATCH_STEP={browser.TILE_BATCH_STEP}
      />
    </div>
  );
}
