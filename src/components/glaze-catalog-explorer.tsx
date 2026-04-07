"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Heart, Search, X } from "lucide-react";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { setGlazeInventoryStateAction, toggleFavouriteInlineAction } from "@/app/actions";
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
import { getGlazeFamilyTraits, getManufacturerUrl } from "@/lib/glaze-metadata";
import {
  extractGlazeColorTraits,
  extractGlazeConeTraits,
  extractGlazeFinishTraits,
  extractQueryColorIntent,
  cn,
  buildGlazeSearchIndex,
  matchesGlazeSearch,
  formatGlazeLabel,
  getColorSwatch,
  getDominantGlazeColorLabel,
  getGlazeColorFlowPosition,
  getGlazeColorMatchScore,
  getGlazeColorPalette,
  hasCuratedGlazeDescription,
  matchesFamilySelection,
  matchesFiringImagePreference,
  matchesSmartColorSelection,
  matchesSmartFinishSelection,
  getGlazeSkimDescription,
  pickPreferredGlazeImage,
  summarizeGlazeColor,
  summarizeGlazeFinish,
} from "@/lib/utils";

const INITIAL_GLAZE_BATCH = 48;
const GLAZE_BATCH_STEP = 36;
type FilterSectionKey = "brands" | "families" | "colors" | "finishes" | "cones";
type IndexedGlaze = {
  glaze: Glaze;
  familyTraits: string[];
  colorTraits: string[];
  finishTraits: string[];
  coneTraits: string[];
  colorSummary: string | null;
  finishSummary: string | null;
  colorPalette: Array<{ label: string; weight: number; swatch: string }>;
  dominantColor: string | null;
  firingImages: GlazeFiringImage[];
  hasPreferredExamples: boolean;
  hasCuratedDescription: boolean;
  searchText: string;
};

function countValues(values: string[]) {
  return values.reduce<Map<string, number>>((map, value) => {
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map());
}

const FilterTile = memo(function FilterTile({
  value,
  checked,
  onToggle,
  swatch,
  count,
  countLabel,
}: {
  value: string;
  checked: boolean;
  onToggle: (value: string) => void;
  swatch?: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onToggle(value)}
      className={cn(
        "grid min-h-[76px] content-between gap-3 border px-3 py-3 text-left transition-colors",
        checked
          ? "border-foreground bg-white text-foreground"
          : "border-border bg-background hover:border-foreground/25 hover:bg-white",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center border text-[10px] uppercase tracking-[0.14em] transition-colors",
            checked
              ? "border-foreground bg-foreground text-white"
              : "border-border bg-panel text-transparent",
          )}
          aria-hidden="true"
        >
          x
        </span>
        {swatch ? (
          <span
            className="h-3 w-3 rounded-full border border-black/10 sm:h-3.5 sm:w-3.5"
            style={{ backgroundColor: swatch }}
            aria-hidden="true"
          />
        ) : null}
        <span className="text-sm font-medium leading-5">{value}</span>
      </span>
      <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-muted">
        <span>{countLabel ?? (count ? `${count} glazes` : "Toggle")}</span>
        <span className={checked ? "text-foreground" : ""}>{checked ? "Selected" : "Add"}</span>
      </span>
    </button>
  );
});

function FilterSection({
  title,
  optionCount,
  selectedCount,
  open,
  onToggle,
  children,
}: {
  title: string;
  optionCount: number;
  selectedCount: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-background">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white"
        aria-expanded={open}
      >
        <span className="space-y-1">
          <span className="block text-sm font-medium text-foreground">{title}</span>
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
            {optionCount} option{optionCount === 1 ? "" : "s"}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {selectedCount ? <Badge tone="neutral">{selectedCount} selected</Badge> : null}
          <ChevronDown
            className={cn("h-4 w-4 text-muted transition-transform", open ? "rotate-180" : "")}
          />
        </span>
      </button>
      {open ? <div className="border-t border-border p-3 sm:p-4">{children}</div> : null}
    </div>
  );
}

function toggleValue(values: string[], target: string) {
  return values.includes(target) ? values.filter((value) => value !== target) : [...values, target];
}

function FilterSelectionSummary({
  values,
  onRemove,
}: {
  values: string[];
  onRemove: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onRemove(value)}
          className="inline-flex items-center gap-2 border border-foreground/20 bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-foreground transition-colors hover:border-foreground/35"
        >
          <span>{value}</span>
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

function toggleFilterSection(
  current: Record<FilterSectionKey, boolean>,
  section: FilterSectionKey,
) {
  return {
    ...current,
    [section]: !current[section],
  };
}

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
}) {
  const [query, setQuery] = useState("");
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [familyFilters, setFamilyFilters] = useState<string[]>([]);
  const [colorFilters, setColorFilters] = useState<string[]>([]);
  const [finishFilters, setFinishFilters] = useState<string[]>([]);
  const [coneFilters, setConeFilters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<Record<FilterSectionKey, boolean>>({
    brands: false,
    families: false,
    colors: false,
    finishes: false,
    cones: false,
  });
  const [visibleCount, setVisibleCount] = useState(INITIAL_GLAZE_BATCH);
  const [activeGridGlazeId, setActiveGridGlazeId] = useState<string | null>(null);
  const [optimisticInventoryStates, setOptimisticInventoryStates] = useState(inventoryStates);
  const [pendingGlazeIds, setPendingGlazeIds] = useState<string[]>([]);
  const [ownershipErrors, setOwnershipErrors] = useState<Record<string, string | null>>({});
  const [favouritedGlazeIds, setFavouritedGlazeIds] = useState<Set<string>>(() => new Set(favouriteGlazeIds));
  const [pendingFavouriteIds, setPendingFavouriteIds] = useState<string[]>([]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const queryColorIntent = extractQueryColorIntent(normalizedQuery);
  const previewCone = coneFilters[0] ?? preferredCone;

  const indexedGlazes = useMemo<IndexedGlaze[]>(
    () =>
      glazes.map((glaze) => {
        const firingImages = firingImageMap[glaze.id] ?? [];
        const familyTraits = getGlazeFamilyTraits(glaze);
        const colorTraits = extractGlazeColorTraits(glaze);
        const finishTraits = extractGlazeFinishTraits(glaze);
        const coneTraits = extractGlazeConeTraits(glaze);

        return {
          glaze,
          familyTraits,
          colorTraits,
          finishTraits,
          coneTraits,
          colorSummary: summarizeGlazeColor(glaze),
          finishSummary: summarizeGlazeFinish(glaze),
          colorPalette: getGlazeColorPalette(glaze),
          dominantColor: getDominantGlazeColorLabel(glaze),
          firingImages,
          hasPreferredExamples: firingImages.some((image) =>
            matchesFiringImagePreference(image, preferredCone, preferredAtmosphere),
          ),
          hasCuratedDescription: hasCuratedGlazeDescription(glaze),
          searchText: buildGlazeSearchIndex([
            glaze.code,
            glaze.name,
            glaze.brand,
            glaze.line,
            familyTraits.join(" "),
            glaze.cone,
            glaze.description,
            colorTraits.join(" "),
            finishTraits.join(" "),
          ]),
        };
      }),
    [glazes, firingImageMap, preferredCone, preferredAtmosphere],
  );

  const colorOptions = useMemo(
    () => Array.from(new Set(indexedGlazes.flatMap((item) => item.colorTraits))).sort((a, b) => a.localeCompare(b)),
    [indexedGlazes],
  );
  const finishOptions = useMemo(
    () => Array.from(new Set(indexedGlazes.flatMap((item) => item.finishTraits))).sort((a, b) => a.localeCompare(b)),
    [indexedGlazes],
  );
  const coneOptions = useMemo(
    () => Array.from(new Set(indexedGlazes.flatMap((item) => item.coneTraits))).sort((a, b) => a.localeCompare(b)),
    [indexedGlazes],
  );
  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(indexedGlazes.map((item) => item.glaze.brand).filter((value): value is string => Boolean(value))),
      ).sort((a, b) => a.localeCompare(b)),
    [indexedGlazes],
  );
  const familyOptions = useMemo(
    () => Array.from(new Set(indexedGlazes.flatMap((item) => item.familyTraits))).sort((a, b) => a.localeCompare(b)),
    [indexedGlazes],
  );
  const brandOptionCounts = useMemo(() => new Map(brandCounts), [brandCounts]);
  const familyOptionCounts = useMemo(
    () => countValues(indexedGlazes.flatMap((item) => item.familyTraits)),
    [indexedGlazes],
  );
  const colorOptionCounts = useMemo(
    () => countValues(indexedGlazes.flatMap((item) => item.colorTraits)),
    [indexedGlazes],
  );
  const finishOptionCounts = useMemo(
    () => countValues(indexedGlazes.flatMap((item) => item.finishTraits)),
    [indexedGlazes],
  );
  const coneOptionCounts = useMemo(
    () => countValues(indexedGlazes.flatMap((item) => item.coneTraits)),
    [indexedGlazes],
  );

  const filteredGlazes = useMemo(
    () =>
      indexedGlazes.filter((item) => {
        if (restrictToPreferredExamples && !item.hasPreferredExamples) {
          return false;
        }

        if (reviewMode && item.hasCuratedDescription) {
          return false;
        }

        if (brandFilters.length && !brandFilters.includes(item.glaze.brand ?? "")) {
          return false;
        }

        if (!matchesFamilySelection(item.familyTraits, familyFilters)) {
          return false;
        }

        if (!matchesSmartColorSelection(item.colorTraits, colorFilters)) {
          return false;
        }

        if (!matchesSmartFinishSelection(item.finishTraits, finishFilters)) {
          return false;
        }

        if (coneFilters.length && !coneFilters.some((cone) => item.coneTraits.includes(cone))) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return matchesGlazeSearch(item.searchText, deferredQuery);
      }),
    [
      indexedGlazes,
      restrictToPreferredExamples,
      reviewMode,
      brandFilters,
      familyFilters,
      colorFilters,
      finishFilters,
      coneFilters,
      normalizedQuery,
      deferredQuery,
    ],
  );
  const brandCountBaseGlazes = useMemo(
    () =>
      indexedGlazes.filter((item) => {
        if (restrictToPreferredExamples && !item.hasPreferredExamples) {
          return false;
        }

        if (reviewMode && item.hasCuratedDescription) {
          return false;
        }

        if (!matchesFamilySelection(item.familyTraits, familyFilters)) {
          return false;
        }

        if (!matchesSmartColorSelection(item.colorTraits, colorFilters)) {
          return false;
        }

        if (!matchesSmartFinishSelection(item.finishTraits, finishFilters)) {
          return false;
        }

        if (coneFilters.length && !coneFilters.some((cone) => item.coneTraits.includes(cone))) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return matchesGlazeSearch(item.searchText, deferredQuery);
      }),
    [
      indexedGlazes,
      restrictToPreferredExamples,
      reviewMode,
      familyFilters,
      colorFilters,
      finishFilters,
      coneFilters,
      normalizedQuery,
      deferredQuery,
    ],
  );
  const currentBrandCounts = useMemo(
    () =>
      countValues(
        brandCountBaseGlazes
          .map((item) => item.glaze.brand)
          .filter((value): value is string => Boolean(value)),
      ),
    [brandCountBaseGlazes],
  );

  const activeColorRankingIntent = colorFilters.length ? colorFilters : queryColorIntent;
  const sortedGlazes = useMemo(
    () =>
      [...filteredGlazes].sort((left, right) => {
        if (isAdmin && !reviewMode) {
          const reviewDelta = Number(left.hasCuratedDescription) - Number(right.hasCuratedDescription);

          if (reviewDelta !== 0) {
            return reviewDelta;
          }
        }

        const colorDelta =
          getGlazeColorMatchScore(right.glaze, activeColorRankingIntent) -
          getGlazeColorMatchScore(left.glaze, activeColorRankingIntent);

        if (Math.abs(colorDelta) > 0.0001) {
          return colorDelta;
        }

        if (normalizedQuery) {
          const leftExact = matchesGlazeSearch(
            buildGlazeSearchIndex([left.glaze.code, left.glaze.name]),
            deferredQuery,
          );
          const rightExact = matchesGlazeSearch(
            buildGlazeSearchIndex([right.glaze.code, right.glaze.name]),
            deferredQuery,
          );

          if (leftExact !== rightExact) {
            return rightExact ? 1 : -1;
          }
        }

        return formatGlazeLabel(left.glaze).localeCompare(formatGlazeLabel(right.glaze));
      }),
    [filteredGlazes, isAdmin, reviewMode, activeColorRankingIntent, normalizedQuery, deferredQuery],
  );

  const hasFilters = Boolean(
    query.trim() ||
      brandFilters.length ||
      familyFilters.length ||
      colorFilters.length ||
      finishFilters.length ||
      coneFilters.length,
  );
  /* Random hue offset so the rainbow starts at a different color each visit */
  const [hueOffset] = useState(() => Math.random());
  const gradientSortedGlazes = useMemo(
    () =>
      [...sortedGlazes].sort((left, right) => {
        const leftFlow = getGlazeColorFlowPosition(left.glaze);
        const rightFlow = getGlazeColorFlowPosition(right.glaze);

        if (leftFlow.bucket !== rightFlow.bucket) {
          return leftFlow.bucket - rightFlow.bucket;
        }

        /* Shift positions by the random offset so the rainbow starts elsewhere */
        const leftPos = leftFlow.bucket === 0 ? (leftFlow.position + hueOffset) % 1 : leftFlow.position;
        const rightPos = rightFlow.bucket === 0 ? (rightFlow.position + hueOffset) % 1 : rightFlow.position;

        if (Math.abs(leftPos - rightPos) > 0.0001) {
          return leftPos - rightPos;
        }

        if (Math.abs(leftFlow.lightness - rightFlow.lightness) > 0.0001) {
          return rightFlow.lightness - leftFlow.lightness;
        }

        return formatGlazeLabel(left.glaze).localeCompare(formatGlazeLabel(right.glaze));
      }),
    [sortedGlazes, hueOffset],
  );
  const displayGlazes = useMemo(
    () => (normalizedQuery || activeColorRankingIntent.length ? sortedGlazes : gradientSortedGlazes),
    [normalizedQuery, activeColorRankingIntent.length, sortedGlazes, gradientSortedGlazes],
  );
  const visibleGradientGlazes = useMemo(
    () => displayGlazes.slice(0, visibleCount),
    [displayGlazes, visibleCount],
  );
  const activeGridItem = useMemo(
    () => indexedGlazes.find((item) => item.glaze.id === activeGridGlazeId) ?? null,
    [indexedGlazes, activeGridGlazeId],
  );
  const activeGridPreviewImage = useMemo(
    () =>
      activeGridItem
        ? pickPreferredGlazeImage(
            activeGridItem.glaze,
            activeGridItem.firingImages,
            previewCone,
            preferredAtmosphere,
          )
        : null,
    [activeGridItem, previewCone, preferredAtmosphere],
  );
  const selectedFilterCount =
    brandFilters.length + familyFilters.length + colorFilters.length + finishFilters.length + coneFilters.length;
  const selectedFilterLabels = [...brandFilters, ...familyFilters, ...colorFilters, ...finishFilters, ...coneFilters];
  const hasActiveQuery = hasFilters;
  const visibleGlazeCount = visibleGradientGlazes.length;
  const remainingGlazeCount = Math.max(displayGlazes.length - visibleGlazeCount, 0);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!hasActiveQuery || !node || visibleCount >= displayGlazes.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];

        if (!first?.isIntersecting) {
          return;
        }

        setVisibleCount((current) => Math.min(current + GLAZE_BATCH_STEP, displayGlazes.length));
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasActiveQuery, visibleCount, displayGlazes.length]);

  async function handleInventoryStateChange(
    glazeId: string,
    nextStatus: "none" | "owned" | "wishlist" | "archived",
  ) {
    const previousState = optimisticInventoryStates[glazeId];

    setOwnershipErrors((current) => ({ ...current, [glazeId]: null }));
    setPendingGlazeIds((current) => (current.includes(glazeId) ? current : [...current, glazeId]));
    setOptimisticInventoryStates((current) => {
      const next = { ...current };

      if (nextStatus === "none") {
        delete next[glazeId];
        return next;
      }

      next[glazeId] = {
        inventoryId: current[glazeId]?.inventoryId ?? "",
        status: nextStatus,
      };
      return next;
    });

    const result = await setGlazeInventoryStateAction({ glazeId, status: nextStatus });

    if (!result.success) {
      setOptimisticInventoryStates((current) => {
        const next = { ...current };

        if (!previousState) {
          delete next[glazeId];
          return next;
        }

        next[glazeId] = previousState;
        return next;
      });
      setOwnershipErrors((current) => ({
        ...current,
        [glazeId]: result.message,
      }));
      setPendingGlazeIds((current) => current.filter((value) => value !== glazeId));
      return;
    }

    setOptimisticInventoryStates((current) => {
      const next = { ...current };

      if (nextStatus === "none") {
        delete next[glazeId];
        return next;
      }

      next[glazeId] = {
        inventoryId: result.inventoryId ?? current[glazeId]?.inventoryId ?? "",
        status: nextStatus,
      };
      return next;
    });

    setPendingGlazeIds((current) => current.filter((value) => value !== glazeId));
  }

  async function handleFavouriteToggle(glazeId: string) {
    if (pendingFavouriteIds.includes(glazeId)) return;
    const wasFavourited = favouritedGlazeIds.has(glazeId);
    setPendingFavouriteIds((current) => [...current, glazeId]);
    setFavouritedGlazeIds((current) => {
      const next = new Set(current);
      wasFavourited ? next.delete(glazeId) : next.add(glazeId);
      return next;
    });
    const result = await toggleFavouriteInlineAction("glaze", glazeId);
    if (result.error) {
      setFavouritedGlazeIds((current) => {
        const next = new Set(current);
        wasFavourited ? next.add(glazeId) : next.delete(glazeId);
        return next;
      });
    }
    setPendingFavouriteIds((current) => current.filter((id) => id !== glazeId));
  }

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

            {!isGuest ? (
              <div className="flex justify-end">
                <Link
                  href="/glazes/new"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  + Add custom glaze
                </Link>
              </div>
            ) : null}

            <div className="overflow-hidden border border-border/80 bg-panel">
              <button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/55"
                aria-expanded={filtersOpen}
              >
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">Filters</span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                    Expand sections by brand, family, color, finish, and cone
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {selectedFilterCount ? <Badge tone="neutral">{selectedFilterCount} selected</Badge> : null}
                  <ChevronDown
                    className={cn("h-4 w-4 text-muted transition-transform", filtersOpen ? "rotate-180" : "")}
                  />
                </span>
              </button>

              {filtersOpen ? (
                <div className="grid gap-3 border-t border-border px-3 py-3 sm:px-4 sm:py-4">
                  <FilterSection
                    title="Brands"
                    optionCount={brandOptions.length}
                    selectedCount={brandFilters.length}
                    open={openFilterSections.brands}
                    onToggle={() =>
                      setOpenFilterSections((current) => toggleFilterSection(current, "brands"))
                    }
                  >
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {brandOptions.map((option) => (
                        (() => {
                          const totalCount = brandOptionCounts.get(option) ?? 0;
                          const matchingCount = currentBrandCounts.get(option) ?? 0;
                          const countLabel =
                            matchingCount !== totalCount
                              ? `${matchingCount} matching · ${totalCount} total`
                              : `${totalCount} glazes`;

                          return (
                        <FilterTile
                          key={option}
                          value={option}
                          count={totalCount}
                          countLabel={countLabel}
                          checked={brandFilters.includes(option)}
                          onToggle={(value) => {
                            setBrandFilters((current) => toggleValue(current, value));
                            setVisibleCount(INITIAL_GLAZE_BATCH);
                          }}
                        />
                          );
                        })()
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Shared families"
                    optionCount={familyOptions.length}
                    selectedCount={familyFilters.length}
                    open={openFilterSections.families}
                    onToggle={() =>
                      setOpenFilterSections((current) => toggleFilterSection(current, "families"))
                    }
                  >
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {familyOptions.map((option) => (
                        <FilterTile
                          key={option}
                          value={option}
                          count={familyOptionCounts.get(option)}
                          checked={familyFilters.includes(option)}
                          onToggle={(value) => {
                            setFamilyFilters((current) => toggleValue(current, value));
                            setVisibleCount(INITIAL_GLAZE_BATCH);
                          }}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Colors"
                    optionCount={colorOptions.length}
                    selectedCount={colorFilters.length}
                    open={openFilterSections.colors}
                    onToggle={() =>
                      setOpenFilterSections((current) => toggleFilterSection(current, "colors"))
                    }
                  >
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {colorOptions.map((option) => (
                        <FilterTile
                          key={option}
                          value={option}
                          count={colorOptionCounts.get(option)}
                          checked={colorFilters.includes(option)}
                          swatch={getColorSwatch(option)}
                          onToggle={(value) => {
                            setColorFilters((current) => toggleValue(current, value));
                            setVisibleCount(INITIAL_GLAZE_BATCH);
                          }}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Finishes"
                    optionCount={finishOptions.length}
                    selectedCount={finishFilters.length}
                    open={openFilterSections.finishes}
                    onToggle={() =>
                      setOpenFilterSections((current) => toggleFilterSection(current, "finishes"))
                    }
                  >
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {finishOptions.map((option) => (
                        <FilterTile
                          key={option}
                          value={option}
                          count={finishOptionCounts.get(option)}
                          checked={finishFilters.includes(option)}
                          onToggle={(value) => {
                            setFinishFilters((current) => toggleValue(current, value));
                            setVisibleCount(INITIAL_GLAZE_BATCH);
                          }}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Cones"
                    optionCount={coneOptions.length}
                    selectedCount={coneFilters.length}
                    open={openFilterSections.cones}
                    onToggle={() =>
                      setOpenFilterSections((current) => toggleFilterSection(current, "cones"))
                    }
                  >
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {coneOptions.map((option) => (
                        <FilterTile
                          key={option}
                          value={option}
                          count={coneOptionCounts.get(option)}
                          checked={coneFilters.includes(option)}
                          onToggle={(value) => {
                            setConeFilters((current) => toggleValue(current, value));
                            setVisibleCount(INITIAL_GLAZE_BATCH);
                          }}
                        />
                      ))}
                    </div>
                  </FilterSection>
                </div>
              ) : null}
            </div>

            {hasActiveQuery ? (
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="neutral">{sortedGlazes.length} results</Badge>
                <Badge tone="neutral">
                  Showing {visibleGlazeCount} of {displayGlazes.length}
                </Badge>
                {remainingGlazeCount ? (
                  <>
                    <button
                      type="button"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                      onClick={() =>
                        setVisibleCount((current) =>
                          Math.min(current + GLAZE_BATCH_STEP, displayGlazes.length),
                        )
                      }
                    >
                      Show {Math.min(GLAZE_BATCH_STEP, remainingGlazeCount)} more
                    </button>
                    <button
                      type="button"
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                      onClick={() => setVisibleCount(displayGlazes.length)}
                    >
                      Show all {displayGlazes.length}
                    </button>
                  </>
                ) : null}
                {hasFilters ? (
                  <button
                    type="button"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                    onClick={() => {
                      setQuery("");
                      setBrandFilters([]);
                      setFamilyFilters([]);
                      setColorFilters([]);
                      setFinishFilters([]);
                      setConeFilters([]);
                      setVisibleCount(INITIAL_GLAZE_BATCH);
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : null}

            {hasActiveQuery && selectedFilterLabels.length ? (
              <FilterSelectionSummary
                values={selectedFilterLabels}
                onRemove={(value) => {
                  setBrandFilters((current) => current.filter((option) => option !== value));
                  setFamilyFilters((current) => current.filter((option) => option !== value));
                  setColorFilters((current) => current.filter((option) => option !== value));
                  setFinishFilters((current) => current.filter((option) => option !== value));
                  setConeFilters((current) => current.filter((option) => option !== value));
                  setVisibleCount(INITIAL_GLAZE_BATCH);
                }}
              />
            ) : null}
          </div>

          {sortedGlazes.length ? (
              <div className="space-y-4">
                <div className="overflow-hidden border border-border bg-panel">
                  <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Visible now</p>
                    <Badge tone="neutral">
                      {visibleGlazeCount} / {displayGlazes.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1.5 min-[420px]:grid-cols-3 sm:gap-2 sm:p-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                    {visibleGradientGlazes.map((item) => {
                        const glaze = item.glaze;
                        const inventoryState = optimisticInventoryStates[glaze.id];
                        const currentStatus: "none" | InventoryStatus = inventoryState?.status ?? "none";
                        const previewImage = pickPreferredGlazeImage(
                          glaze,
                          item.firingImages,
                          previewCone,
                          preferredAtmosphere,
                        );

                        return (
                          <button
                            key={glaze.id}
                            type="button"
                            onClick={() => setActiveGridGlazeId(glaze.id)}
                            className="group relative z-0 overflow-visible border border-border bg-white text-left transition-transform duration-200 hover:z-20 hover:scale-[1.02] focus-visible:z-20 focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/20"
                            style={{ contentVisibility: "auto", containIntrinsicSize: "220px" }}
                          >
                            <div className="space-y-1.5 p-1.5 sm:p-2">
                              <div className="relative overflow-hidden border border-border bg-panel">
                                {previewImage ? (
                                  <Image
                                    src={previewImage}
                                    alt={formatGlazeLabel(glaze)}
                                    width={256}
                                    height={256}
                                    sizes="(min-width: 640px) 200px, 50vw"
                                    className="aspect-square w-full object-contain bg-white transition duration-200"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex aspect-square items-center justify-center text-xs uppercase tracking-[0.18em] text-muted">
                                    No image
                                  </div>
                                )}
                              </div>

                              <div className="space-y-0.5">
                                <p className="text-[9px] uppercase tracking-[0.18em] text-muted sm:text-[10px]">
                                  {glaze.brand} {glaze.code}
                                </p>
                                <h4 className="line-clamp-2 text-[13px] font-semibold leading-5 text-foreground sm:text-sm">
                                  {glaze.name}
                                </h4>
                                {item.finishSummary ? <p className="hidden line-clamp-1 text-xs text-muted sm:block">{item.finishSummary}</p> : null}
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {currentStatus === "owned" ? <Badge tone="success">Owned</Badge> : null}
                                {currentStatus === "wishlist" ? <Badge tone="accent">Wishlist</Badge> : null}
                                {currentStatus === "archived" ? <Badge tone="neutral">Empty</Badge> : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
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

          {hasActiveQuery && visibleCount < displayGlazes.length ? (
            <div
              ref={loadMoreRef}
              className="border border-dashed border-border bg-panel px-4 py-3 text-center text-sm text-muted"
            >
              Loading more glazes as you scroll...
            </div>
          ) : null}
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
                <button
                  type="button"
                  onClick={() => setActiveGridGlazeId(null)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-white text-foreground transition hover:-translate-y-px"
                  aria-label="Close glaze details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Inventory state + links */}
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
                  {/* Buy from store */}
                  <BuyLinksDropdown glaze={activeGridItem.glaze} />

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

                  <GlazeCommentsPanel glazeId={activeGridItem.glaze.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
