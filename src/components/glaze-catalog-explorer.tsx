"use client";

import Link from "next/link";
import { Heart, Search, X } from "lucide-react";

import { BuyLinksDropdown } from "@/components/buy-links-dropdown";
import { GlazeCommentsPanel } from "@/components/glaze-comments-panel";
import { CommunityImagesPanel } from "@/components/community-images-panel";
import { GlazeImageGallery } from "@/components/glaze-image-gallery";
import { InventoryStatePicker } from "@/components/inventory-state-picker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import type { Glaze, GlazeFiringImage, InventoryStatus } from "@/lib/types";
import { getManufacturerUrl } from "@/lib/glaze-metadata";
import { cn, formatGlazeLabel, getGlazeSkimDescription } from "@/lib/utils";
import { useGlazeExplorer } from "@/components/glaze-catalog/use-glaze-explorer";
import { GlazeFilters } from "@/components/glaze-catalog/glaze-filters";
import { GlazeGrid } from "@/components/glaze-catalog/glaze-grid";

export function GlazeCatalogExplorer({
  glazes,
  brandCounts,
  inventoryStates,
  isGuest,
  firingImageMap,
  preferredCone,
  preferredAtmosphere,
  restrictToPreferredExamples,
  isAdmin,
  reviewMode,
  favouriteGlazeIds = [],
  hideConeFilter = false,
  groupByLine = false,
}: {
  glazes: Glaze[];
  brandCounts: Array<[string, number]>;
  inventoryStates: Record<string, { inventoryId: string; status: InventoryStatus }>;
  isGuest: boolean;
  firingImageMap: Record<string, GlazeFiringImage[]>;
  preferredCone: string | null;
  preferredAtmosphere: string | null;
  restrictToPreferredExamples: boolean;
  isAdmin: boolean;
  reviewMode: boolean;
  favouriteGlazeIds?: string[];
  hideConeFilter?: boolean;
  groupByLine?: boolean;
}) {
  const {
    query,
    setQuery,
    brandFilters,
    setBrandFilters,
    familyFilters,
    setFamilyFilters,
    colorFilters,
    setColorFilters,
    finishFilters,
    setFinishFilters,
    coneFilters,
    setConeFilters,
    filtersOpen,
    setFiltersOpen,
    openFilterSections,
    setOpenFilterSections,
    visibleCount,
    setVisibleCount,
    activeGridGlazeId,
    setActiveGridGlazeId,
    optimisticInventoryStates,
    pendingGlazeIds,
    ownershipErrors,
    handleInventoryStateChange,
    favouritedGlazeIds,
    pendingFavouriteIds,
    handleFavouriteToggle,
    colorOptions,
    finishOptions,
    coneOptions,
    brandOptions,
    familyOptions,
    brandOptionCounts,
    familyOptionCounts,
    colorOptionCounts,
    finishOptionCounts,
    coneOptionCounts,
    sortedGlazes,
    displayGlazes,
    visibleGradientGlazes,
    activeGridItem,
    hasFilters,
    hasActiveQuery,
    selectedFilterCount,
    selectedFilterLabels,
    visibleGlazeCount,
    remainingGlazeCount,
    previewCone,
    currentBrandCounts,
    loadMoreRef,
    INITIAL_GLAZE_BATCH,
    GLAZE_BATCH_STEP,
    activeGridPreviewImage,
  } = useGlazeExplorer({
    glazes,
    brandCounts,
    inventoryStates,
    firingImageMap,
    preferredCone,
    preferredAtmosphere,
    restrictToPreferredExamples,
    favouriteGlazeIds,
    isAdmin,
    reviewMode,
  });

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <div className="flex justify-end">
          <Link
            href={reviewMode ? "/glazes" : "/glazes?review=descriptions"}
            className={buttonVariants({ variant: reviewMode ? "primary" : "ghost" })}
          >
            {reviewMode ? "Back to library" : "Description review queue"}
          </Link>
        </div>
      ) : null}
      <section className="grid gap-5">
        <Panel className="space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-3 sm:px-4 sm:py-4">
              <Search className="h-4 w-4 text-muted" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(INITIAL_GLAZE_BATCH);
                }}
                placeholder="Search by code, name, colour, finish, cone, or keyword"
                className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
              />
            </div>

            <GlazeFilters
              brandFilters={brandFilters}
              setBrandFilters={setBrandFilters}
              familyFilters={familyFilters}
              setFamilyFilters={setFamilyFilters}
              colorFilters={colorFilters}
              setColorFilters={setColorFilters}
              finishFilters={finishFilters}
              setFinishFilters={setFinishFilters}
              coneFilters={coneFilters}
              setConeFilters={setConeFilters}
              filtersOpen={filtersOpen}
              setFiltersOpen={setFiltersOpen}
              openFilterSections={openFilterSections}
              setOpenFilterSections={setOpenFilterSections}
              brandOptions={brandOptions}
              familyOptions={familyOptions}
              colorOptions={colorOptions}
              finishOptions={finishOptions}
              coneOptions={coneOptions}
              brandOptionCounts={brandOptionCounts}
              familyOptionCounts={familyOptionCounts}
              colorOptionCounts={colorOptionCounts}
              finishOptionCounts={finishOptionCounts}
              coneOptionCounts={coneOptionCounts}
              currentBrandCounts={currentBrandCounts}
              selectedFilterCount={selectedFilterCount}
              selectedFilterLabels={selectedFilterLabels}
              hasActiveQuery={hasActiveQuery}
              hasFilters={hasFilters}
              sortedGlazesLength={sortedGlazes.length}
              displayGlazesLength={displayGlazes.length}
              visibleGlazeCount={visibleGlazeCount}
              remainingGlazeCount={remainingGlazeCount}
              onVisibleCountReset={() => setVisibleCount(INITIAL_GLAZE_BATCH)}
              onShowMore={() =>
                setVisibleCount((current) =>
                  Math.min(current + GLAZE_BATCH_STEP, displayGlazes.length),
                )
              }
              onShowAll={() => setVisibleCount(displayGlazes.length)}
              onClearFilters={() => {
                setQuery("");
                setBrandFilters([]);
                setFamilyFilters([]);
                setColorFilters([]);
                setFinishFilters([]);
                setConeFilters([]);
                setVisibleCount(INITIAL_GLAZE_BATCH);
              }}
              GLAZE_BATCH_STEP={GLAZE_BATCH_STEP}
              hideConeFilter={hideConeFilter}
            />
          </div>

          {sortedGlazes.length ? (
            <GlazeGrid
              visibleGradientGlazes={visibleGradientGlazes}
              optimisticInventoryStates={optimisticInventoryStates}
              previewCone={previewCone}
              preferredAtmosphere={preferredAtmosphere}
              onSelectGlaze={setActiveGridGlazeId}
              visibleGlazeCount={visibleGlazeCount}
              displayGlazesLength={displayGlazes.length}
              hasActiveQuery={hasActiveQuery}
              loadMoreRef={loadMoreRef}
              visibleCount={visibleCount}
              reviewMode={reviewMode}
              groupByLine={groupByLine}
            />
          ) : (
            <Panel>
              <h2 className="display-font text-3xl tracking-tight">
                {reviewMode ? "No descriptions are waiting for review." : "No glaze matches yet."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {reviewMode
                  ? "Every glaze in this filtered view already has an edited skim summary."
                  : "Try a different brand, code, glaze name, color family, finish, or cone value."}
              </p>
            </Panel>
          )}
        </Panel>
      </section>

      {activeGridItem ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#2d1c16]/35 p-2 sm:items-center sm:p-4"
          onClick={() => setActiveGridGlazeId(null)}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden border border-border bg-background sm:mt-[4vh]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Sticky header — title + favourite + close */}
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    {activeGridItem.glaze.brand} {activeGridItem.glaze.code}
                  </p>
                  <h3 className="truncate text-lg font-semibold leading-tight text-foreground sm:text-2xl">{activeGridItem.glaze.name}</h3>
                </div>
                {isGuest ? null : (
                  <button
                    type="button"
                    disabled={pendingFavouriteIds.includes(activeGridItem.glaze.id)}
                    onClick={() => void handleFavouriteToggle(activeGridItem.glaze.id)}
                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition disabled:opacity-50 ${
                      favouritedGlazeIds.has(activeGridItem.glaze.id)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-white text-muted hover:text-foreground"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${favouritedGlazeIds.has(activeGridItem.glaze.id) ? "fill-current" : ""}`} />
                    {favouritedGlazeIds.has(activeGridItem.glaze.id) ? "Favourited" : "Favourite"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveGridGlazeId(null)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-white text-foreground transition hover:-translate-y-px"
                  aria-label="Close glaze details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Inventory state + links — hidden for guest / studio visitors */}
              {isGuest ? null : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <InventoryStatePicker
                    status={optimisticInventoryStates[activeGridItem.glaze.id]?.status ?? "none"}
                    showEmpty={Boolean(optimisticInventoryStates[activeGridItem.glaze.id])}
                    allowRemove={Boolean(optimisticInventoryStates[activeGridItem.glaze.id])}
                    onChange={(nextStatus) => {
                      void handleInventoryStateChange(activeGridItem.glaze.id, nextStatus);
                    }}
                    pending={pendingGlazeIds.includes(activeGridItem.glaze.id)}
                    error={ownershipErrors[activeGridItem.glaze.id] ?? null}
                    tiny
                  />
                  {activeGridItem.glaze.code ? (
                    <Link
                      href={`/combinations?q=${encodeURIComponent(activeGridItem.glaze.code)}`}
                      className="inline-flex items-center border border-border bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-muted transition hover:text-foreground"
                    >
                      Combinations
                    </Link>
                  ) : null}
                  {activeGridItem.glaze.brand && getManufacturerUrl(activeGridItem.glaze.brand) ? (
                    <a
                      href={getManufacturerUrl(activeGridItem.glaze.brand)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center border border-border bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-muted transition hover:text-foreground"
                    >
                      {activeGridItem.glaze.brand} website
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,220px)_1fr]">
                {/* Images column — gallery with lightbox */}
                <div className="mx-auto w-full max-w-[280px] lg:mx-0">
                  <GlazeImageGallery
                    baseImageUrl={activeGridItem.glaze.imageUrl}
                    baseImageAlt={formatGlazeLabel(activeGridItem.glaze)}
                    firingImages={activeGridItem.firingImages}
                    initialImageUrl={activeGridPreviewImage}
                  />
                </div>

                {/* Info column */}
                <div className="space-y-4">
                  {/* Buy from store — hidden for guests */}
                  {isGuest ? null : <BuyLinksDropdown glaze={activeGridItem.glaze} />}

                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={activeGridItem.glaze.sourceType === "commercial" ? "neutral" : "accent"}>
                      {activeGridItem.glaze.sourceType === "commercial" ? "Commercial" : "Custom"}
                    </Badge>
                    {activeGridItem.glaze.cone ? <Badge tone="neutral">{activeGridItem.glaze.cone}</Badge> : null}
                    {activeGridItem.familyTraits.map((family) => (
                      <Badge key={`${activeGridItem.glaze.id}-${family}-overlay`} tone="accent">
                        {family}
                      </Badge>
                    ))}
                    {activeGridItem.colorTraits.slice(0, 4).map((trait) => (
                      <Badge key={`${activeGridItem.glaze.id}-${trait}-overlay`} tone="neutral">
                        {trait}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
                    <p><span className="font-semibold text-foreground">Brand:</span> {activeGridItem.glaze.brand ?? "Unknown"}</p>
                    <p><span className="font-semibold text-foreground">Line:</span> {activeGridItem.glaze.line ?? "Unknown"}</p>
                    {activeGridItem.finishSummary ? <p><span className="font-semibold text-foreground">Finish:</span> {activeGridItem.finishSummary}</p> : null}
                    {activeGridItem.colorSummary ? <p><span className="font-semibold text-foreground">Colour:</span> {activeGridItem.colorSummary}</p> : null}
                  </div>

                  {/* Skim read panel */}
                  {(() => {
                    const skim = getGlazeSkimDescription(activeGridItem.glaze);
                    return (
                      <div className="border border-border bg-panel p-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Skim read</p>
                        <div className="mt-2 grid gap-2 text-sm leading-6 text-muted">
                          <p><span className="font-semibold text-foreground">Overview:</span> {skim.summary}</p>
                          <p><span className="font-semibold text-foreground">Surface:</span> {skim.surface}</p>
                          {skim.application ? (
                            <p><span className="font-semibold text-foreground">Application:</span> {skim.application}</p>
                          ) : null}
                          <p><span className="font-semibold text-foreground">Firing:</span> {skim.firing}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {activeGridItem.glaze.description ? (
                    <details className="border border-border bg-panel px-3 py-2">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                        Official vendor description
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-muted">{activeGridItem.glaze.description}</p>
                    </details>
                  ) : null}

                  <CommunityImagesPanel target={{ glazeId: activeGridItem.glaze.id }} altPrefix={formatGlazeLabel(activeGridItem.glaze)} />

                  {isGuest ? null : <GlazeCommentsPanel glazeId={activeGridItem.glaze.id} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
