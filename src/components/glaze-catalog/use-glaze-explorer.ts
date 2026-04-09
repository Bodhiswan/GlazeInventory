"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { setGlazeInventoryStateAction } from "@/app/actions/inventory";
import { toggleFavouriteInlineAction } from "@/app/actions/glazes";
import type { Glaze, GlazeFiringImage, InventoryStatus } from "@/lib/types";
import { getGlazeFamilyTraits } from "@/lib/glaze-metadata";
import {
  extractColorAwareQuery,
  extractGlazeColorTraits,
  extractGlazeConeTraits,
  extractGlazeFinishTraits,
  buildGlazeSearchIndex,
  matchesGlazeSearch,
  formatGlazeLabel,
  getDominantGlazeColorLabel,
  getGlazeColorFlowPosition,
  getGlazeColorMatchScore,
  getGlazeColorPalette,
  hasCuratedGlazeDescription,
  matchesFamilySelection,
  matchesFiringImagePreference,
  matchesSmartColorSelection,
  matchesSmartFinishSelection,
  pickPreferredGlazeImage,
  summarizeGlazeColor,
  summarizeGlazeFinish,
} from "@/lib/utils";

const INITIAL_GLAZE_BATCH = 48;
const GLAZE_BATCH_STEP = 36;
const GLAZE_GRADIENT_HUE_OFFSET = 0.173;

export type IndexedGlaze = {
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
  labelSearchText: string;
};

export function countValues(values: string[]) {
  return values.reduce<Map<string, number>>((map, value) => {
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map());
}

export interface UseGlazeExplorerProps {
  glazes: Glaze[];
  brandCounts: Array<[string, number]>;
  inventoryStates: Record<string, { inventoryId: string; status: InventoryStatus }>;
  firingImageMap: Record<string, GlazeFiringImage[]>;
  preferredCone: string | null;
  preferredAtmosphere: string | null;
  restrictToPreferredExamples: boolean;
  favouriteGlazeIds: string[];
  isAdmin: boolean;
  reviewMode: boolean;
}

export function useGlazeExplorer({
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
}: UseGlazeExplorerProps) {
  const [query, setQuery] = useState("");
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [familyFilters, setFamilyFilters] = useState<string[]>([]);
  const [colorFilters, setColorFilters] = useState<string[]>([]);
  const [finishFilters, setFinishFilters] = useState<string[]>([]);
  const [coneFilters, setConeFilters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<
    Record<"brands" | "families" | "colors" | "finishes" | "cones", boolean>
  >({
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
  const [favouritedGlazeIds, setFavouritedGlazeIds] = useState<Set<string>>(
    () => new Set(favouriteGlazeIds),
  );
  const [pendingFavouriteIds, setPendingFavouriteIds] = useState<string[]>([]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const colorAwareQuery = extractColorAwareQuery(deferredQuery);
  const textQuery = colorAwareQuery.textQuery;
  const queryColorIntent = colorAwareQuery.colorIntent;
  const queryShadeIntent = colorAwareQuery.shadeIntent;
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
          labelSearchText: buildGlazeSearchIndex([glaze.code, glaze.name, glaze.brand, glaze.line]),
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
    () =>
      Array.from(new Set(indexedGlazes.flatMap((item) => item.colorTraits))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [indexedGlazes],
  );
  const finishOptions = useMemo(
    () =>
      Array.from(new Set(indexedGlazes.flatMap((item) => item.finishTraits))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [indexedGlazes],
  );
  const coneOptions = useMemo(
    () =>
      Array.from(new Set(indexedGlazes.flatMap((item) => item.coneTraits))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [indexedGlazes],
  );
  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(
          indexedGlazes
            .map((item) => item.glaze.brand)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [indexedGlazes],
  );
  const familyOptions = useMemo(
    () =>
      Array.from(new Set(indexedGlazes.flatMap((item) => item.familyTraits))).sort((a, b) =>
        a.localeCompare(b),
      ),
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

        if (!textQuery) {
          return true;
        }

        return matchesGlazeSearch(item.searchText, textQuery);
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
      textQuery,
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

        if (!textQuery) {
          return true;
        }

        return matchesGlazeSearch(item.searchText, textQuery);
      }),
    [
      indexedGlazes,
      restrictToPreferredExamples,
      reviewMode,
      familyFilters,
      colorFilters,
      finishFilters,
      coneFilters,
      textQuery,
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
  const activeShadeIntent = colorFilters.length ? null : queryShadeIntent;

  const sortedGlazes = useMemo(
    () =>
      filteredGlazes
        .map((item) => ({
          item,
          colorScore: getGlazeColorMatchScore(item.glaze, activeColorRankingIntent, activeShadeIntent),
          literalQueryMatch:
            activeColorRankingIntent.length > 0 && normalizedQuery
              ? matchesGlazeSearch(item.labelSearchText, normalizedQuery)
              : false,
          exactTextMatch: textQuery
            ? matchesGlazeSearch(
                buildGlazeSearchIndex([item.glaze.code, item.glaze.name]),
                textQuery,
              )
            : false,
        }))
        .sort((left, right) => {
          const leftItem = left.item;
          const rightItem = right.item;

        if (isAdmin && !reviewMode) {
          const reviewDelta =
            Number(leftItem.hasCuratedDescription) - Number(rightItem.hasCuratedDescription);

          if (reviewDelta !== 0) {
            return reviewDelta;
          }
        }

        if (left.literalQueryMatch !== right.literalQueryMatch) {
          return right.literalQueryMatch ? 1 : -1;
        }

        const colorDelta = right.colorScore - left.colorScore;

        if (Math.abs(colorDelta) > 0.0001) {
          return colorDelta;
        }

        if (textQuery && left.exactTextMatch !== right.exactTextMatch) {
          return right.exactTextMatch ? 1 : -1;
          }

          return formatGlazeLabel(leftItem.glaze).localeCompare(formatGlazeLabel(rightItem.glaze));
        })
        .map(({ item }) => item),
    [
      filteredGlazes,
      isAdmin,
      reviewMode,
      activeColorRankingIntent,
      activeShadeIntent,
      normalizedQuery,
      textQuery,
    ],
  );

  const hasFilters = Boolean(
    query.trim() ||
      brandFilters.length ||
      familyFilters.length ||
      colorFilters.length ||
      finishFilters.length ||
      coneFilters.length,
  );

  const gradientSortedGlazes = useMemo(
    () =>
      [...sortedGlazes].sort((left, right) => {
        const leftFlow = getGlazeColorFlowPosition(left.glaze);
        const rightFlow = getGlazeColorFlowPosition(right.glaze);

        if (leftFlow.bucket !== rightFlow.bucket) {
          return leftFlow.bucket - rightFlow.bucket;
        }

        const leftPos =
          leftFlow.bucket === 0
            ? (leftFlow.position + GLAZE_GRADIENT_HUE_OFFSET) % 1
            : leftFlow.position;
        const rightPos =
          rightFlow.bucket === 0
            ? (rightFlow.position + GLAZE_GRADIENT_HUE_OFFSET) % 1
            : rightFlow.position;

        if (Math.abs(leftPos - rightPos) > 0.0001) {
          return leftPos - rightPos;
        }

        if (Math.abs(leftFlow.lightness - rightFlow.lightness) > 0.0001) {
          return rightFlow.lightness - leftFlow.lightness;
        }

        return formatGlazeLabel(left.glaze).localeCompare(formatGlazeLabel(right.glaze));
      }),
    [sortedGlazes],
  );

  const displayGlazes = useMemo(
    () =>
      textQuery || activeColorRankingIntent.length ? sortedGlazes : gradientSortedGlazes,
    [textQuery, activeColorRankingIntent.length, sortedGlazes, gradientSortedGlazes],
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
    brandFilters.length +
    familyFilters.length +
    colorFilters.length +
    finishFilters.length +
    coneFilters.length;
  const selectedFilterLabels = [
    ...brandFilters,
    ...familyFilters,
    ...colorFilters,
    ...finishFilters,
    ...coneFilters,
  ];
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

  return {
    // Search
    query,
    setQuery,
    deferredQuery,
    normalizedQuery,
    textQuery,
    // Filter state
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
    // Pagination
    visibleCount,
    setVisibleCount,
    loadMoreRef,
    // Grid active item
    activeGridGlazeId,
    setActiveGridGlazeId,
    // Inventory
    optimisticInventoryStates,
    pendingGlazeIds,
    ownershipErrors,
    handleInventoryStateChange,
    // Favourites
    favouritedGlazeIds,
    pendingFavouriteIds,
    handleFavouriteToggle,
    // Computed / indexed data
    indexedGlazes,
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
    filteredGlazes,
    currentBrandCounts,
    sortedGlazes,
    displayGlazes,
    visibleGradientGlazes,
    activeGridItem,
    activeGridPreviewImage,
    // Derived flags/counts
    hasFilters,
    hasActiveQuery,
    selectedFilterCount,
    selectedFilterLabels,
    visibleGlazeCount,
    remainingGlazeCount,
    previewCone,
    INITIAL_GLAZE_BATCH,
    GLAZE_BATCH_STEP,
  };
}
