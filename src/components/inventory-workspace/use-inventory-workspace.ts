"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";

import { getCatalogGlazesForScannerAction } from "@/app/actions/glazes";
import { setGlazeInventoryStateAction, updateInventoryItemNotesAction } from "@/app/actions/inventory";
import { toggleFavouriteInlineAction } from "@/app/actions/glazes";
import type {
  CombinationPost,
  GlazeFiringImage,
  InventoryCollectionState,
  InventoryFillLevel,
  InventoryItem,
  UserCombinationExample,
} from "@/lib/types";
import {
  buildGlazeSearchIndex,
  formatGlazeLabel,
  matchesGlazeSearch,
  pickPreferredGlazeImage,
} from "@/lib/utils";

export type CatalogGlazeSummary = {
  id: string;
  brand: string | null;
  code: string | null;
  name: string;
  line: string | null;
  imageUrl: string | null;
};

export interface UseInventoryWorkspaceProps {
  items: InventoryItem[];
  firingImageMap: Record<string, GlazeFiringImage[]>;
  preferredCone: string | null;
  preferredAtmosphere: string | null;
  myUserExamples?: UserCombinationExample[];
  myCombinationPosts?: CombinationPost[];
  favouriteGlazeIds?: string[];
}

export function useInventoryWorkspace({
  items,
  firingImageMap,
  preferredCone,
  preferredAtmosphere,
  myUserExamples = [],
  myCombinationPosts = [],
  favouriteGlazeIds = [],
}: UseInventoryWorkspaceProps) {
  const [inventoryItems, setInventoryItems] = useState(items);
  const [query, setQuery] = useState("");
  const [catalogGlazes, setCatalogGlazes] = useState<CatalogGlazeSummary[] | null>(null);

  // Load catalog data on mount for the scanner
  useEffect(() => {
    void getCatalogGlazesForScannerAction().then(setCatalogGlazes);
  }, []);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    owned: false,
    wishlist: false,
    archived: false,
    combinations: false,
  });
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [pendingGlazeIds, setPendingGlazeIds] = useState<string[]>([]);
  const [statusErrors, setStatusErrors] = useState<Record<string, string | null>>({});
  const [favouritedGlazeIds, setFavouritedGlazeIds] = useState<Set<string>>(() => new Set(favouriteGlazeIds));
  const [pendingFavouriteIds, setPendingFavouriteIds] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      [...inventoryItems]
        .filter((item) => {
          if (!normalizedQuery) {
            return true;
          }

          return matchesGlazeSearch(
            buildGlazeSearchIndex([
              item.glaze.code,
              item.glaze.name,
              item.glaze.brand,
              item.glaze.line,
              item.personalNotes,
            ]),
            deferredQuery,
          );
        })
        .sort((left, right) => formatGlazeLabel(left.glaze).localeCompare(formatGlazeLabel(right.glaze))),
    [inventoryItems, normalizedQuery, deferredQuery],
  );

  const totalCounts = useMemo(
    () => ({
      owned: inventoryItems.filter((item) => item.status === "owned").length,
      wishlist: inventoryItems.filter((item) => item.status === "wishlist").length,
      archived: inventoryItems.filter((item) => item.status === "archived").length,
    }),
    [inventoryItems],
  );

  const sectionItems = useMemo(
    () => ({
      owned: filteredItems.filter((item) => item.status === "owned"),
      wishlist: filteredItems.filter((item) => item.status === "wishlist"),
      archived: filteredItems.filter((item) => item.status === "archived"),
    }),
    [filteredItems],
  );

  const preferredImages = useMemo(
    () =>
      inventoryItems.reduce<Record<string, string | null>>((map, item) => {
        map[item.glazeId] = pickPreferredGlazeImage(
          item.glaze,
          firingImageMap[item.glazeId] ?? [],
          preferredCone,
          preferredAtmosphere,
        );
        return map;
      }, {}),
    [inventoryItems, firingImageMap, preferredCone, preferredAtmosphere],
  );

  const activeItem = useMemo(
    () => inventoryItems.find((item) => item.id === activeItemId) ?? null,
    [inventoryItems, activeItemId],
  );

  const handleStatusChange = useCallback(
    async (item: InventoryItem, nextStatus: InventoryCollectionState) => {
      const previousItems = inventoryItems;

      setStatusErrors((current) => ({ ...current, [item.id]: null }));
      setPendingGlazeIds((current) => (current.includes(item.glazeId) ? current : [...current, item.glazeId]));

      if (nextStatus === "none") {
        setInventoryItems((current) => current.filter((candidate) => candidate.id !== item.id));
        if (activeItemId === item.id) {
          setActiveItemId(null);
        }
      } else {
        setInventoryItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  status: nextStatus,
                }
              : candidate,
          ),
        );
      }

      const result = await setGlazeInventoryStateAction({
        glazeId: item.glazeId,
        status: nextStatus,
      });

      if (!result.success) {
        setInventoryItems(previousItems);
        setStatusErrors((current) => ({
          ...current,
          [item.id]: result.message,
        }));
        setPendingGlazeIds((current) => current.filter((glazeId) => glazeId !== item.glazeId));
        return;
      }

      if (nextStatus !== "none" && result.inventoryId) {
        setInventoryItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  id: result.inventoryId ?? candidate.id,
                  status: nextStatus,
                }
              : candidate,
          ),
        );
        if (activeItemId === item.id) {
          setActiveItemId(result.inventoryId);
        }
      }

      setPendingGlazeIds((current) => current.filter((glazeId) => glazeId !== item.glazeId));
    },
    [inventoryItems, activeItemId],
  );

  const handleFavouriteToggle = useCallback(
    async (glazeId: string) => {
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
    },
    [pendingFavouriteIds, favouritedGlazeIds],
  );

  const handleNoteSaved = useCallback((itemId: string, note: string | null) => {
    setInventoryItems((current) =>
      current.map((candidate) =>
        candidate.id === itemId
          ? {
              ...candidate,
              personalNotes: note,
            }
          : candidate,
      ),
    );
  }, []);

  const handleShelfSaved = useCallback(
    (itemId: string, { fillLevel, quantity }: { fillLevel: InventoryFillLevel; quantity: number }) => {
      setInventoryItems((current) =>
        current.map((candidate) =>
          candidate.id === itemId
            ? {
                ...candidate,
                fillLevel,
                quantity,
              }
            : candidate,
        ),
      );
    },
    [],
  );

  const toggleSection = useCallback((sectionKey: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }, []);

  return {
    // Search
    query,
    setQuery,
    // Catalog
    catalogGlazes,
    // Sections
    openSections,
    toggleSection,
    // Items
    inventoryItems,
    filteredItems,
    sectionItems,
    totalCounts,
    preferredImages,
    // Active item (detail modal)
    activeItem,
    activeItemId,
    setActiveItemId,
    // Pending state
    pendingGlazeIds,
    statusErrors,
    // Favourites
    favouritedGlazeIds,
    pendingFavouriteIds,
    // Combinations
    myUserExamples,
    myCombinationPosts,
    // Handlers
    handleStatusChange,
    handleFavouriteToggle,
    handleNoteSaved,
    handleShelfSaved,
    // Raw data needed by child components
    firingImageMap,
  };
}

