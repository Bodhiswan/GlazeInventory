"use client";

import type {
  CombinationPost,
  GlazeFiringImage,
  InventoryStatus,
  UserCombinationExample,
  VendorCombinationExample,
} from "@/lib/types";
import { useCombinationsBrowser } from "./combinations-browser/use-combinations-browser";
import type { CombinationsView } from "./combinations-browser/use-combinations-browser";
import { CombinationFilters } from "./combinations-browser/combination-filters";
import { CombinationGrid } from "./combinations-browser/combination-grid";

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
  });

  return (
    <div className="space-y-6">
      <CombinationFilters
        query={browser.query}
        setQuery={browser.setQuery}
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
