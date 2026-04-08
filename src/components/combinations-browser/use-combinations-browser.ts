"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { toggleFavouriteInlineAction } from "@/app/actions/glazes";
import type {
  CombinationPost,
  Glaze,
  GlazeFiringImage,
  InventoryCollectionState,
  InventoryStatus,
  UserCombinationExample,
  VendorCombinationExample,
} from "@/lib/types";
import { formatGlazeLabel } from "@/lib/utils";
import { extractConeLabel, getOrderedPostGlazes } from "./combination-utils";

const INITIAL_TILE_BATCH = 48;
const TILE_BATCH_STEP = 36;

export type CombinationsView = "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";

/* ---------------------------------------------------------------------------
 * Unified tile type — wraps both Mayco examples and published posts so
 * they render identically in the compact grid.
 * ------------------------------------------------------------------------ */
export type TileKind = "example" | "post" | "userExample";

export interface TileLayer {
  code: string | null;
  name: string;
}

export type TileOwnership = "all" | "plus1" | "default";

export interface CombinationTile {
  id: string;
  kind: TileKind;
  imageUrl: string | null;
  title: string;
  /** Structured layer info for the stacked tile display */
  tileLayers: TileLayer[];
  subtitle: string | null;
  cone: string | null;
  ownership: TileOwnership;
  badgeTone: "success" | "accent" | "neutral";
  badgeLabel: string;
  searchText: string;
  /* original payloads for the detail modal */
  example: VendorCombinationExample | null;
  post: CombinationPost | null;
  userExample: UserCombinationExample | null;
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */

function stripPunctuation(text: string) {
  return text.replace(/[^a-z0-9 ]/g, "");
}

function buildExampleSearchText(example: VendorCombinationExample) {
  const raw = [
    example.sourceVendor,
    example.sourceCollection,
    example.title,
    example.cone,
    example.atmosphere,
    example.clayBody,
    example.applicationNotes,
    example.firingNotes,
    ...example.layers.flatMap((layer) => [
      layer.glazeCode,
      layer.glazeName,
      layer.glaze ? formatGlazeLabel(layer.glaze) : null,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  // Include a stripped copy so "sw144" matches "sw-144"
  return `${raw} ${stripPunctuation(raw)}`;
}

function buildPostSearchText(post: CombinationPost) {
  const glazeCopy = (post.glazes ?? []).map((glaze) => formatGlazeLabel(glaze).toLowerCase()).join(" ");
  const raw = [post.caption ?? "", post.applicationNotes ?? "", post.firingNotes ?? "", glazeCopy]
    .join(" ")
    .toLowerCase();
  return `${raw} ${stripPunctuation(raw)}`;
}

function getGlazeCodeCopy(glaze?: Glaze | null, fallbackCode?: string | null, fallbackName?: string | null) {
  return fallbackCode ?? glaze?.code ?? fallbackName ?? glaze?.name ?? "Unmatched glaze";
}

function formatExampleCodeTitle(example: VendorCombinationExample) {
  const layerCopy = example.layers
    .map((layer, index) => {
      const label = getGlazeCodeCopy(layer.glaze, layer.glazeCode, layer.glazeName);

      if (index === 0) {
        return label;
      }

      const connector = example.layers[index - 1]?.connectorToNext?.trim().toLowerCase() ?? "over";
      return `${connector} ${label}`;
    })
    .join(" ");

  return layerCopy;
}

function formatPostCodeTitle(post: CombinationPost) {
  const codes = getOrderedPostGlazes(post).map((glaze) => getGlazeCodeCopy(glaze));

  if (!codes.length) {
    return "Published combination";
  }

  return codes.length >= 2 ? `${codes[0]} over ${codes[1]}` : codes[0];
}

function buildUserExampleSearchText(ue: UserCombinationExample) {
  const raw = [
    ue.title,
    ue.cone,
    ue.atmosphere,
    ue.glazingProcess,
    ue.notes,
    ue.kilnNotes,
    ue.authorName,
    ...ue.layers.flatMap((l) => (l.glaze ? [formatGlazeLabel(l.glaze), l.glaze.code, l.glaze.name] : [])),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return `${raw} ${stripPunctuation(raw)}`;
}

function exampleToTile(example: VendorCombinationExample): CombinationTile {
  const tileLayers: TileLayer[] = example.layers.map((layer) => ({
    code: layer.glazeCode ?? layer.glaze?.code ?? null,
    name: layer.glazeName ?? layer.glaze?.name ?? "Glaze",
  }));

  const ownership: TileOwnership = example.viewerOwnsAllGlazes
    ? "all"
    : example.viewerOwnedLayerCount >= example.layers.length - 1
      ? "plus1"
      : "default";

  return {
    id: `example-${example.id}`,
    kind: "example",
    imageUrl: example.imageUrl,
    title: formatExampleCodeTitle(example),
    tileLayers,
    subtitle: example.sourceVendor,
    cone: example.cone ?? null,
    ownership,
    badgeTone: example.viewerOwnsAllGlazes ? "success" : "accent",
    badgeLabel: example.viewerOwnsAllGlazes
      ? "All owned"
      : `${example.viewerOwnedLayerCount}/${example.layers.length} owned`,
    searchText: buildExampleSearchText(example),
    example,
    post: null,
    userExample: null,
  };
}

function userExampleToTile(ue: UserCombinationExample): CombinationTile {
  // ue.layers is bottom-up — reverse so the stacked tile renders top → bottom.
  const tileLayers: TileLayer[] = [...ue.layers].reverse().map((l) => ({
    code: l.glaze?.code ?? null,
    name: l.glaze?.name ?? "Glaze",
  }));

  // ue.layers comes bottom-up (layer_order ASC). Reverse for display so the
  // top layer is shown first — matching the form's "top over bottom" mental
  // model — and join with "/".
  const layerLabels = [...ue.layers]
    .reverse()
    .map((l) => (l.glaze ? (l.glaze.code ?? l.glaze.name ?? "Glaze") : "Glaze"));
  const title = layerLabels.length >= 1 ? layerLabels.join("/") : "User combination";

  const ownership: TileOwnership = ue.viewerOwnsAllGlazes
    ? "all"
    : ue.viewerOwnedLayerCount >= ue.layers.length - 1
      ? "plus1"
      : "default";

  return {
    id: `ue-${ue.id}`,
    kind: "userExample",
    imageUrl: ue.imageUrls[0] ?? "",
    title,
    tileLayers,
    subtitle: `By ${ue.authorName}`,
    cone: ue.cone ?? null,
    ownership,
    badgeTone: ue.viewerOwnsAllGlazes ? "success" : "accent",
    badgeLabel: ue.viewerOwnsAllGlazes
      ? "All owned"
      : `${ue.viewerOwnedLayerCount}/${ue.layers.length} owned`,
    searchText: buildUserExampleSearchText(ue),
    example: null,
    post: null,
    userExample: ue,
  };
}

function postToTile(post: CombinationPost, label: string): CombinationTile {
  const imageSrc = typeof post.imagePath === "string" && post.imagePath.trim() ? post.imagePath : null;
  const orderedGlazes = getOrderedPostGlazes(post);
  const tileLayers: TileLayer[] = orderedGlazes.map((g) => ({
    code: g.code ?? null,
    name: g.name,
  }));

  return {
    id: `post-${post.id}`,
    kind: "post",
    imageUrl: imageSrc,
    title: formatPostCodeTitle(post),
    tileLayers,
    subtitle: label,
    cone: extractConeLabel(post.firingNotes),
    ownership: "default" as TileOwnership,
    badgeTone: "neutral",
    badgeLabel: label,
    searchText: buildPostSearchText(post),
    example: null,
    post,
    userExample: null,
  };
}

export function extractTileBrands(tile: CombinationTile): string[] {
  if (tile.example) {
    return tile.example.layers
      .map((l) => l.glaze?.brand)
      .filter((b): b is string => !!b);
  }
  if (tile.userExample) {
    return tile.userExample.layers
      .map((l) => l.glaze?.brand)
      .filter((b): b is string => !!b);
  }
  if (tile.post) {
    return (tile.post.glazes ?? [])
      .map((g) => g.brand)
      .filter((b): b is string => !!b);
  }
  return [];
}

/* ---------------------------------------------------------------------------
 * Hook props / return types
 * ------------------------------------------------------------------------ */

export interface UseCombinationsBrowserProps {
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
}

export function useCombinationsBrowser({
  examples,
  publishedPosts,
  myPosts,
  userExamples = [],
  glazeFiringImages,
  inventoryStatusByGlazeId: initialInventoryStatusByGlazeId,
  initialView = "all",
  initialQuery = "",
  viewerUserId = null,
  favouriteCombinationIds = [],
}: UseCombinationsBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [query2, setQuery2] = useState("");
  const [view, setView] = useState<CombinationsView>(initialView);
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [showCone5, setShowCone5] = useState(true);
  const [showCone6, setShowCone6] = useState(true);
  const [showCone10, setShowCone10] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<Record<string, boolean>>({});
  const [activeTileId, setActiveTileId] = useState<string | null>(null);
  const [inventoryStatusByGlazeId, setInventoryStatusByGlazeId] = useState(initialInventoryStatusByGlazeId);
  const [favouritedCombinationIds, setFavouritedCombinationIds] = useState<Set<string>>(() => new Set(favouriteCombinationIds));
  const [pendingFavouriteIds, setPendingFavouriteIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_TILE_BATCH);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const deferredQuery2 = useDeferredValue(query2);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const normalizedQuery2 = deferredQuery2.trim().toLowerCase();

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    setInventoryStatusByGlazeId(initialInventoryStatusByGlazeId);
  }, [initialInventoryStatusByGlazeId]);

  function handleInventoryStatusChange(glazeId: string, nextStatus: InventoryCollectionState) {
    setInventoryStatusByGlazeId((current) => {
      const next = { ...current };

      if (nextStatus === "none") {
        delete next[glazeId];
      } else {
        next[glazeId] = nextStatus;
      }

      return next;
    });
  }

  async function handleFavouriteToggle(combinationId: string) {
    if (pendingFavouriteIds.includes(combinationId)) return;
    const wasFavourited = favouritedCombinationIds.has(combinationId);
    setPendingFavouriteIds((current) => [...current, combinationId]);
    setFavouritedCombinationIds((current) => {
      const next = new Set(current);
      wasFavourited ? next.delete(combinationId) : next.add(combinationId);
      return next;
    });
    const result = await toggleFavouriteInlineAction("combination", combinationId);
    if (result.error) {
      setFavouritedCombinationIds((current) => {
        const next = new Set(current);
        wasFavourited ? next.add(combinationId) : next.delete(combinationId);
        return next;
      });
    }
    setPendingFavouriteIds((current) => current.filter((id) => id !== combinationId));
  }

  function resetFilters() {
    setView("all");
    setQuery("");
    setQuery2("");
    setBrandFilters([]);
    setShowCone5(true);
    setShowCone6(true);
    setShowCone10(true);
    setVisibleCount(INITIAL_TILE_BATCH);
  }

  /* --- build unified tile lists ----------------------------------------- */

  const exampleTiles = useMemo(
    () => examples.map((e) => exampleToTile(e)),
    [examples],
  );

  const communityPostTiles = useMemo(
    () => publishedPosts.map((p) => postToTile(p, "Community")),
    [publishedPosts],
  );

  const myPostTiles = useMemo(
    () => myPosts.map((p) => postToTile(p, "Mine")),
    [myPosts],
  );

  const userExampleTiles = useMemo(
    () => userExamples.map((ue) => userExampleToTile(ue)),
    [userExamples],
  );

  const myUserExampleTiles = useMemo(
    () => userExampleTiles.filter((t) => t.userExample?.authorUserId === viewerUserId),
    [userExampleTiles, viewerUserId],
  );

  /* Stable random seed per session so shuffle order doesn't change on re-render */
  const [shuffleSeed] = useState(() => Math.random());

  /* Every tile in the full pool (for brand extraction), shuffled for variety */
  const allTiles = useMemo(() => {
    const tiles = [...exampleTiles, ...communityPostTiles, ...userExampleTiles];
    // Fisher-Yates shuffle with seeded PRNG for stability
    let seed = Math.floor(shuffleSeed * 2147483647) || 1;
    for (let i = tiles.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = Math.floor(seed % (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
  }, [exampleTiles, communityPostTiles, userExampleTiles, shuffleSeed]);

  /* --- view filter counts (for filter tiles) --- */

  const possibleTiles = useMemo(
    () => allTiles.filter((t) => {
      if (t.example) return t.example.viewerOwnsAllGlazes;
      if (t.userExample) return t.userExample.viewerOwnsAllGlazes;
      return false;
    }),
    [allTiles],
  );

  const plus1Tiles = useMemo(
    () => allTiles.filter((t) => {
      if (t.example) {
        return !t.example.viewerOwnsAllGlazes &&
          t.example.viewerOwnedLayerCount >= t.example.layers.length - 1;
      }
      if (t.userExample) {
        return !t.userExample.viewerOwnsAllGlazes &&
          t.userExample.viewerOwnedLayerCount >= t.userExample.layers.length - 1;
      }
      return false;
    }),
    [allTiles],
  );

  const mineTiles = useMemo(
    () => [...myPostTiles, ...myUserExampleTiles],
    [myPostTiles, myUserExampleTiles],
  );

  const manufacturerTiles = useMemo(
    () => exampleTiles,
    [exampleTiles],
  );

  /* --- brand options --- */

  const brandOptions = useMemo(() => {
    const brandSet = new Set<string>();
    for (const tile of allTiles) {
      for (const brand of extractTileBrands(tile)) {
        brandSet.add(brand);
      }
    }
    return Array.from(brandSet).sort((a, b) => a.localeCompare(b));
  }, [allTiles]);

  const brandOptionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tile of allTiles) {
      const brands = new Set(extractTileBrands(tile));
      for (const brand of brands) {
        counts.set(brand, (counts.get(brand) ?? 0) + 1);
      }
    }
    return counts;
  }, [allTiles]);

  /* --- apply view + brand + search filters ----------------------------- */

  const activeTiles = useMemo(() => {
    let tiles: CombinationTile[];

    switch (view) {
      case "mine":
        tiles = mineTiles;
        break;
      case "possible":
        tiles = possibleTiles;
        break;
      case "plus1":
        tiles = plus1Tiles;
        break;
      case "user":
        tiles = [...userExampleTiles, ...communityPostTiles];
        break;
      case "manufacturer":
        tiles = manufacturerTiles;
        break;
      default:
        tiles = allTiles;
    }

    // Brand filter — every layer's brand must be in the selected set
    if (brandFilters.length) {
      tiles = tiles.filter((tile) => {
        const brands = extractTileBrands(tile);
        if (!brands.length) return false;
        return brands.every((b) => brandFilters.includes(b));
      });
    }

    // Cone filter
    tiles = tiles.filter((tile) => {
      const cone = tile.cone ?? "";
      const isCone5 = /\bcone\s+5\b/i.test(cone);
      const isCone6 = /\bcone\s+6\b/i.test(cone);
      const isCone10 = /\bcone\s+10\b/i.test(cone);
      if (isCone5 && showCone5) return true;
      if (isCone6 && showCone6) return true;
      if (isCone10 && showCone10) return true;
      if (isCone5 || isCone6 || isCone10) return false;
      return !cone;
    });

    // Text search — both queries must match (AND) so users can narrow combos
    // by typing one glaze in each box.
    const matchesQuery = (tile: CombinationTile, q: string) => {
      const stripped = stripPunctuation(q);
      return (
        tile.searchText.includes(q) ||
        (stripped !== q && tile.searchText.includes(stripped))
      );
    };
    if (normalizedQuery) {
      tiles = tiles.filter((tile) => matchesQuery(tile, normalizedQuery));
    }
    if (normalizedQuery2) {
      tiles = tiles.filter((tile) => matchesQuery(tile, normalizedQuery2));
    }

    return tiles;
  }, [view, normalizedQuery, normalizedQuery2, brandFilters, showCone5, showCone6, showCone10, allTiles, possibleTiles, plus1Tiles, mineTiles, userExampleTiles, communityPostTiles, manufacturerTiles]);

  const activeTile = useMemo(
    () => activeTiles.find((t) => t.id === activeTileId) ?? null,
    [activeTiles, activeTileId],
  );

  const hasFilters = view !== "all" || brandFilters.length > 0 || query.trim().length > 0 || query2.trim().length > 0 || !showCone5 || !showCone6 || !showCone10;

  /* Reset visible count when filters change */
  useEffect(() => {
    setVisibleCount(INITIAL_TILE_BATCH);
  }, [view, normalizedQuery, normalizedQuery2, brandFilters, showCone5, showCone6, showCone10]);

  /* Progressive rendering — load more tiles as the user scrolls */
  const visibleTiles = useMemo(
    () => activeTiles.slice(0, visibleCount),
    [activeTiles, visibleCount],
  );
  const remainingCount = activeTiles.length - visibleTiles.length;

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || visibleCount >= activeTiles.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + TILE_BATCH_STEP, activeTiles.length));
        }
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, activeTiles.length]);

  /* --- view filter definitions ------------------------------------------ */

  const viewFilters: { key: CombinationsView; label: string; count: number }[] = [
    { key: "possible", label: "Possible combinations", count: possibleTiles.length },
    { key: "plus1", label: "+1 combinations", count: plus1Tiles.length },
    { key: "mine", label: "My combinations", count: mineTiles.length },
    { key: "user", label: "User combinations", count: userExampleTiles.length + communityPostTiles.length },
    { key: "manufacturer", label: "Manufacturer combinations", count: manufacturerTiles.length },
  ];

  const viewLabel =
    view === "all" ? "All combinations"
    : viewFilters.find((f) => f.key === view)?.label ?? "All combinations";

  return {
    // Search
    query,
    setQuery,
    query2,
    setQuery2,
    // View
    view,
    setView,
    viewFilters,
    viewLabel,
    // Brand filters
    brandFilters,
    setBrandFilters,
    brandOptions,
    brandOptionCounts,
    // Cone filters
    showCone5,
    setShowCone5,
    showCone6,
    setShowCone6,
    showCone10,
    setShowCone10,
    // Filter panel
    filtersOpen,
    setFiltersOpen,
    openFilterSections,
    setOpenFilterSections,
    // Tile data
    activeTiles,
    activeTile,
    activeTileId,
    setActiveTileId,
    visibleTiles,
    remainingCount,
    // Pagination
    visibleCount,
    setVisibleCount,
    loadMoreRef,
    // Inventory
    glazeFiringImages,
    inventoryStatusByGlazeId,
    handleInventoryStatusChange,
    // Favourites
    favouritedCombinationIds,
    pendingFavouriteIds,
    handleFavouriteToggle,
    // Viewer
    viewerUserId,
    // Derived flags
    hasFilters,
    resetFilters,
    INITIAL_TILE_BATCH,
    TILE_BATCH_STEP,
  };
}
