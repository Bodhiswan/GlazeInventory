"use client";

import Image from "next/image";
import { ChevronDown, Heart, Search, X } from "lucide-react";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { deleteUserCombinationAction } from "@/app/actions";
import { setGlazeInventoryStateAction } from "@/app/actions/inventory";
import { toggleFavouriteInlineAction } from "@/app/actions/glazes";
import { BuyLinksDropdown } from "@/components/buy-links-dropdown";
import { CommunityImagesPanel } from "@/components/community-images-panel";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
import { CombinationCommentsPanel } from "@/components/glaze-comments-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import type {
  CombinationPost,
  Glaze,
  GlazeFiringImage,
  InventoryCollectionState,
  InventoryStatus,
  UserCombinationExample,
  VendorCombinationExample,
} from "@/lib/types";
import { cn, formatGlazeLabel, pickPreferredGlazeImage } from "@/lib/utils";

const INITIAL_TILE_BATCH = 48;
const TILE_BATCH_STEP = 36;

type CombinationsView = "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";

/* ---------------------------------------------------------------------------
 * Unified tile type — wraps both Mayco examples and published posts so
 * they render identically in the compact grid.
 * ------------------------------------------------------------------------ */
type TileKind = "example" | "post" | "userExample";

interface TileLayer {
  code: string | null;
  name: string;
}

type TileOwnership = "all" | "plus1" | "default";

interface CombinationTile {
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

function extractConeLabel(value: string | null | undefined) {
  const match = value?.match(/\bcone\b[^0-9]*([0-9]{1,2})/i) ?? value?.match(/\b([0-9]{1,2})\b/);
  return match?.[1] ? `Cone ${match[1]}` : null;
}

function normalizeComparisonText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractPostLayerOrder(post: CombinationPost) {
  const match = post.applicationNotes?.match(/layer order:\s*(.+?)\s+over\s+(.+?)(?:\.|$)/i);

  if (!match) {
    return null;
  }

  return {
    top: match[1]?.trim() ?? "",
    base: match[2]?.trim() ?? "",
  };
}

function glazeMatchesLayerToken(glaze: Glaze, token: string) {
  const normalizedToken = normalizeComparisonText(token);

  if (!normalizedToken) {
    return false;
  }

  const candidates = [
    formatGlazeLabel(glaze),
    glaze.code,
    glaze.name,
    [glaze.code, glaze.name].filter(Boolean).join(" "),
  ]
    .map((value) => normalizeComparisonText(value))
    .filter(Boolean);

  return candidates.some(
    (candidate) =>
      candidate === normalizedToken ||
      candidate.includes(normalizedToken) ||
      normalizedToken.includes(candidate),
  );
}

function getOrderedPostGlazes(post: CombinationPost) {
  const glazes = [...(post.glazes ?? [])];
  const layerOrder = extractPostLayerOrder(post);

  if (!layerOrder || glazes.length < 2) {
    return glazes;
  }

  const topGlaze = glazes.find((glaze) => glazeMatchesLayerToken(glaze, layerOrder.top));
  const baseGlaze = glazes.find(
    (glaze) => glaze.id !== topGlaze?.id && glazeMatchesLayerToken(glaze, layerOrder.base),
  );

  if (!topGlaze || !baseGlaze) {
    return glazes;
  }

  return [topGlaze, baseGlaze];
}

function formatPostCodeTitle(post: CombinationPost) {
  const codes = getOrderedPostGlazes(post).map((glaze) => getGlazeCodeCopy(glaze));

  if (!codes.length) {
    return "Published combination";
  }

  return codes.length >= 2 ? `${codes[0]} over ${codes[1]}` : codes[0];
}

function getLayerRoleLabel(example: VendorCombinationExample, layerOrder: number) {
  if (layerOrder === 0) return "Top glaze";
  if (layerOrder === example.layers.length - 1) return layerOrder > 1 ? "Foundation layer" : "Base glaze";
  return "Middle layer";
}

function getPostLayerRoleLabel(post: CombinationPost, glaze: Glaze, index: number) {
  const layerOrder = extractPostLayerOrder(post);

  if (layerOrder) {
    if (glazeMatchesLayerToken(glaze, layerOrder.top)) {
      return "Top glaze";
    }

    if (glazeMatchesLayerToken(glaze, layerOrder.base)) {
      return "Base glaze";
    }
  }

  if (index === 0) {
    return "Glaze";
  }

  return `Glaze ${index + 1}`;
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

function userExampleToTile(ue: UserCombinationExample): CombinationTile {
  const tileLayers: TileLayer[] = ue.layers.map((l) => ({
    code: l.glaze?.code ?? null,
    name: l.glaze?.name ?? "Glaze",
  }));

  const layerLabels = ue.layers.map((l) =>
    l.glaze ? (l.glaze.code ?? l.glaze.name ?? "Glaze") : "Glaze",
  );
  const title = layerLabels.length >= 2
    ? `${layerLabels[0]} over ${layerLabels.slice(1).join(" over ")}`
    : layerLabels[0] ?? "User combination";

  const ownership: TileOwnership = ue.viewerOwnsAllGlazes
    ? "all"
    : ue.viewerOwnedLayerCount >= ue.layers.length - 1
      ? "plus1"
      : "default";

  return {
    id: `ue-${ue.id}`,
    kind: "userExample",
    imageUrl: ue.postFiringImageUrl,
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

/* ---------------------------------------------------------------------------
 * Filter helpers (mirrors glaze-catalog-explorer pattern)
 * ------------------------------------------------------------------------ */

function toggleValue(values: string[], target: string) {
  return values.includes(target) ? values.filter((value) => value !== target) : [...values, target];
}

const FilterTile = memo(function FilterTile({
  value,
  checked,
  onToggle,
  count,
  countLabel,
}: {
  value: string;
  checked: boolean;
  onToggle: (value: string) => void;
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
        <span className="text-sm font-medium leading-5">{value}</span>
      </span>
      <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-muted">
        <span>{countLabel ?? (count !== undefined ? `${count} combinations` : "Toggle")}</span>
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

/* ---------------------------------------------------------------------------
 * Brand extraction helpers
 * ------------------------------------------------------------------------ */

function extractTileBrands(tile: CombinationTile): string[] {
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

function GlazeOwnershipControl({
  glazeId,
  status,
  onStatusChange,
}: {
  glazeId: string;
  status: InventoryStatus | null;
  onStatusChange: (glazeId: string, nextStatus: InventoryCollectionState) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetStatus(targetStatus: InventoryCollectionState) {
    setError(null);
    setPending(true);

    const result = await setGlazeInventoryStateAction({
      glazeId,
      status: targetStatus,
    });

    if (!result.success) {
      setError(result.message);
      setPending(false);
      return;
    }

    onStatusChange(glazeId, result.status ?? targetStatus);
    setPending(false);
  }

  const isOwned = status === "owned";
  const isWishlisted = status === "wishlist";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { void handleSetStatus(isOwned ? "none" : "owned"); }}
          disabled={pending}
          className={buttonVariants({
            variant: isOwned ? "primary" : "ghost",
            size: "sm",
            className: "min-h-11 flex-1 justify-center sm:min-h-10 sm:flex-none",
          })}
        >
          {pending ? "Saving..." : isOwned ? "Owned" : "I own it"}
        </button>
        <button
          type="button"
          onClick={() => { void handleSetStatus(isWishlisted ? "none" : "wishlist"); }}
          disabled={pending}
          className={buttonVariants({
            variant: isWishlisted ? "primary" : "ghost",
            size: "sm",
            className: "min-h-11 flex-1 justify-center sm:min-h-10 sm:flex-none",
          })}
        >
          {pending ? "Saving..." : isWishlisted ? "Wishlisted" : "Wishlist"}
        </button>
      </div>
      {error ? <p className="text-[11px] leading-5 text-[#7f4026]">{error}</p> : null}
    </div>
  );
}

const CombinationGlazeRow = memo(function CombinationGlazeRow({
  roleLabel,
  glaze,
  fallbackCode,
  fallbackName,
  fallbackImageUrl,
  preferredCone,
  preferredAtmosphere,
  glazeFiringImages,
  inventoryStatus,
  onInventoryStatusChange,
}: {
  roleLabel: string;
  glaze?: Glaze | null;
  fallbackCode?: string | null;
  fallbackName?: string | null;
  fallbackImageUrl?: string | null;
  preferredCone?: string | null;
  preferredAtmosphere?: string | null;
  glazeFiringImages: Record<string, GlazeFiringImage[]>;
  inventoryStatus: InventoryStatus | null;
  onInventoryStatusChange: (glazeId: string, nextStatus: InventoryCollectionState) => void;
}) {
  const firingImages = glaze ? glazeFiringImages[glaze.id] ?? [] : [];
  const preferredThumbnailUrl = glaze
    ? pickPreferredGlazeImage(glaze, firingImages, preferredCone ?? null, preferredAtmosphere ?? null)
    : null;
  const thumbnailUrl = preferredThumbnailUrl ?? fallbackImageUrl ?? null;
  const displayLabel = glaze
    ? formatGlazeLabel(glaze)
    : [fallbackCode, fallbackName].filter(Boolean).join(" ") || "Unlinked glaze";

  return (
    <div className="border border-border bg-panel px-3 py-2.5">
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-14 shrink-0 overflow-hidden border border-border bg-white">
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={displayLabel} width={96} height={96} sizes="56px" className="aspect-square w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-[8px] uppercase tracking-[0.14em] text-muted">No img</div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{roleLabel}</p>
          <p className="truncate text-sm font-semibold text-foreground">{displayLabel}</p>
          {glaze ? (
            <p className="truncate text-xs text-muted">{[glaze.brand, glaze.cone].filter(Boolean).join(" · ")}</p>
          ) : null}
        </div>
      </div>

      {/* Ownership actions */}
      {glaze ? (
        <div className="mt-2 space-y-2">
          <GlazeOwnershipControl glazeId={glaze.id} status={inventoryStatus} onStatusChange={onInventoryStatusChange} />
          {glaze.sourceType === "commercial" ? <BuyLinksDropdown glaze={glaze} /> : null}
        </div>
      ) : null}
    </div>
  );
});

/* ---------------------------------------------------------------------------
 * Detail modal for an imported vendor example
 * ------------------------------------------------------------------------ */

function ExampleDetail({
  example,
  glazeFiringImages,
  inventoryStatusByGlazeId,
  onInventoryStatusChange,
}: {
  example: VendorCombinationExample;
  glazeFiringImages: Record<string, GlazeFiringImage[]>;
  inventoryStatusByGlazeId: Record<string, InventoryStatus>;
  onInventoryStatusChange: (glazeId: string, nextStatus: InventoryCollectionState) => void;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const heroImage: LightboxImage = { id: example.id, imageUrl: example.imageUrl, alt: example.title };

  return (
    <div className="space-y-4">
      {lightboxOpen ? (
        <ImageLightbox images={[heroImage]} initialIndex={0} onClose={() => setLightboxOpen(false)} />
      ) : null}
      {/* Hero: combination result photo + metadata side by side */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,280px)_1fr]">
        <button type="button" onClick={() => setLightboxOpen(true)} className="overflow-hidden border border-border bg-panel transition hover:opacity-90">
          <Image
            src={example.imageUrl}
            alt={example.title}
            width={400}
            height={300}
            sizes="(min-width: 640px) 280px, 100vw"
            className="aspect-[4/3] w-full object-cover"
          />
        </button>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{example.sourceVendor}</Badge>
            {example.cone ? <Badge tone="neutral">{example.cone}</Badge> : null}
            {example.atmosphere ? <Badge tone="neutral">{example.atmosphere}</Badge> : null}
          </div>
          {example.clayBody ? (
            <p className="text-sm text-muted"><span className="font-semibold text-foreground">Clay body:</span> {example.clayBody}</p>
          ) : null}
          {example.applicationNotes ? (
            <p className="text-sm leading-6 text-muted"><span className="font-semibold text-foreground">Application:</span> {example.applicationNotes}</p>
          ) : null}
          {example.firingNotes ? (
            <p className="text-sm leading-6 text-muted"><span className="font-semibold text-foreground">Firing:</span> {example.firingNotes}</p>
          ) : null}
        </div>
      </div>

      {/* Glaze layers — compact rows */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">Glazes in this combination</p>
        <div className="grid gap-2">
          {example.layers.map((layer) => (
            <CombinationGlazeRow
              key={layer.id}
              roleLabel={getLayerRoleLabel(example, layer.layerOrder)}
              glaze={layer.glaze}
              fallbackCode={layer.glazeCode}
              fallbackName={layer.glazeName}
              fallbackImageUrl={layer.sourceImageUrl ?? null}
              preferredCone={example.cone ?? null}
              preferredAtmosphere={example.atmosphere ?? null}
              glazeFiringImages={glazeFiringImages}
              inventoryStatus={layer.glaze ? inventoryStatusByGlazeId[layer.glaze.id] ?? null : null}
              onInventoryStatusChange={onInventoryStatusChange}
            />
          ))}
        </div>
      </div>

      <CommunityImagesPanel target={{ combinationId: example.id }} altPrefix={example.title} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Detail modal for a published post
 * ------------------------------------------------------------------------ */

function PostDetail({
  post,
  glazeFiringImages,
  inventoryStatusByGlazeId,
  onInventoryStatusChange,
}: {
  post: CombinationPost;
  glazeFiringImages: Record<string, GlazeFiringImage[]>;
  inventoryStatusByGlazeId: Record<string, InventoryStatus>;
  onInventoryStatusChange: (glazeId: string, nextStatus: InventoryCollectionState) => void;
}) {
  const imageSrc = typeof post.imagePath === "string" && post.imagePath.trim() ? post.imagePath : null;
  const preferredCone = extractConeLabel(post.firingNotes);
  const orderedGlazes = getOrderedPostGlazes(post);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const heroLightboxImages: LightboxImage[] = imageSrc
    ? [{ id: `${post.id}-hero`, imageUrl: imageSrc, alt: post.caption ?? "Published glaze combination", label: preferredCone ?? null }]
    : [];

  return (
    <div className="space-y-4">
      {lightboxOpen && heroLightboxImages.length > 0 ? (
        <ImageLightbox images={heroLightboxImages} initialIndex={0} onClose={() => setLightboxOpen(false)} />
      ) : null}

      {/* Hero: combination result photo + metadata side by side */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,280px)_1fr]">
        {imageSrc ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="overflow-hidden border border-border bg-panel transition hover:opacity-90"
            aria-label="View full size"
          >
            <Image
              src={imageSrc}
              alt={post.caption ?? "Published glaze combination"}
              width={400}
              height={300}
              sizes="(min-width: 640px) 280px, 100vw"
              className="aspect-[4/3] w-full object-cover"
            />
          </button>
        ) : null}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">Community</Badge>
            {preferredCone ? <Badge tone="neutral">{preferredCone}</Badge> : null}
          </div>
          <p className="text-sm text-muted"><span className="font-semibold text-foreground">By:</span> {post.authorName}</p>
          {post.caption ? (
            <p className="text-sm leading-6 text-foreground/90">{post.caption}</p>
          ) : null}
          {post.applicationNotes ? (
            <p className="text-sm leading-6 text-muted"><span className="font-semibold text-foreground">Application:</span> {post.applicationNotes}</p>
          ) : null}
          {post.firingNotes ? (
            <p className="text-sm leading-6 text-muted"><span className="font-semibold text-foreground">Firing:</span> {post.firingNotes}</p>
          ) : null}
        </div>
      </div>

      {/* Glaze layers — compact rows */}
      {orderedGlazes.length ? (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">Glazes in this combination</p>
          <div className="grid gap-2">
            {orderedGlazes.map((glaze, index) => (
              <CombinationGlazeRow
                key={glaze.id}
                roleLabel={getPostLayerRoleLabel(post, glaze, index)}
                glaze={glaze}
                preferredCone={preferredCone}
                glazeFiringImages={glazeFiringImages}
                inventoryStatus={inventoryStatusByGlazeId[glaze.id] ?? null}
                onInventoryStatusChange={onInventoryStatusChange}
              />
            ))}
          </div>
        </div>
      ) : null}

      <CommunityImagesPanel target={{ combinationId: post.id }} altPrefix={post.caption ?? "Glaze combination"} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Detail modal for a user combination example
 * ------------------------------------------------------------------------ */

function UserExampleDetail({
  userExample,
  glazeFiringImages,
  inventoryStatusByGlazeId,
  onInventoryStatusChange,
  viewerUserId,
}: {
  userExample: UserCombinationExample;
  glazeFiringImages: Record<string, GlazeFiringImage[]>;
  inventoryStatusByGlazeId: Record<string, InventoryStatus>;
  onInventoryStatusChange: (glazeId: string, nextStatus: InventoryCollectionState) => void;
  viewerUserId: string | null;
}) {
  const isOwner = viewerUserId === userExample.authorUserId;
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images: LightboxImage[], idx: number) => { setLightboxImages(images); setLightboxIndex(idx); };
  const closeLightbox = () => setLightboxImages(null);

  const postImage: LightboxImage = { id: `${userExample.id}-post`, imageUrl: userExample.postFiringImageUrl, alt: userExample.title, label: "Post-firing" };
  const preImage: LightboxImage | null = userExample.preFiringImageUrl
    ? { id: `${userExample.id}-pre`, imageUrl: userExample.preFiringImageUrl, alt: `${userExample.title} (pre-firing)`, label: "Pre-firing" }
    : null;
  const heroImages = [postImage, ...(preImage ? [preImage] : [])];

  function getUserExampleLayerRole(index: number, total: number) {
    if (index === 0) return "Top layer";
    if (index === total - 1) return total > 2 ? "Base layer" : "Bottom layer";
    return `Middle layer ${index}`;
  }

  return (
    <div className="space-y-4">
      {lightboxImages ? <ImageLightbox images={lightboxImages} initialIndex={lightboxIndex} onClose={closeLightbox} /> : null}
      {/* Hero: post-firing + optional pre-firing photos */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,280px)_1fr]">
        <div className="space-y-2">
          <button type="button" onClick={() => openLightbox(heroImages, 0)} className="w-full overflow-hidden border border-border bg-panel transition hover:opacity-90">
            <Image
              src={userExample.postFiringImageUrl}
              alt={userExample.title}
              width={400}
              height={300}
              sizes="(min-width: 640px) 280px, 100vw"
              className="aspect-[4/3] w-full object-cover"
            />
          </button>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Post-firing</p>

          {userExample.preFiringImageUrl ? (
            <>
              <button type="button" onClick={() => openLightbox(heroImages, 1)} className="w-full overflow-hidden border border-border bg-panel transition hover:opacity-90">
                <Image
                  src={userExample.preFiringImageUrl}
                  alt={`${userExample.title} (pre-firing)`}
                  width={400}
                  height={300}
                  sizes="(min-width: 640px) 280px, 100vw"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Pre-firing</p>
            </>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">Member</Badge>
            {userExample.cone ? <Badge tone="neutral">{userExample.cone}</Badge> : null}
            {userExample.atmosphere && userExample.atmosphere !== "oxidation" ? (
              <Badge tone="accent">{userExample.atmosphere}</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">By:</span> {userExample.authorName}
          </p>
          {userExample.glazingProcess ? (
            <p className="text-sm leading-6 text-muted">
              <span className="font-semibold text-foreground">Process:</span> {userExample.glazingProcess}
            </p>
          ) : null}
          {userExample.notes ? (
            <p className="text-sm leading-6 text-foreground/90">{userExample.notes}</p>
          ) : null}
          {userExample.kilnNotes ? (
            <p className="text-sm leading-6 text-muted">
              <span className="font-semibold text-foreground">Kiln:</span> {userExample.kilnNotes}
            </p>
          ) : null}
        </div>
      </div>

      {/* Glaze layers */}
      {userExample.layers.length ? (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">
            Glazes in this combination ({userExample.layers.length} layer{userExample.layers.length === 1 ? "" : "s"})
          </p>
          <div className="grid gap-2">
            {userExample.layers.map((layer, index) => (
              <CombinationGlazeRow
                key={layer.id}
                roleLabel={getUserExampleLayerRole(index, userExample.layers.length)}
                glaze={layer.glaze}
                preferredCone={userExample.cone ?? null}
                preferredAtmosphere={userExample.atmosphere ?? null}
                glazeFiringImages={glazeFiringImages}
                inventoryStatus={layer.glaze ? inventoryStatusByGlazeId[layer.glaze.id] ?? null : null}
                onInventoryStatusChange={onInventoryStatusChange}
              />
            ))}
          </div>
        </div>
      ) : null}

      <CommunityImagesPanel target={{ combinationId: userExample.id }} altPrefix={userExample.title} />

      <CombinationCommentsPanel exampleId={userExample.id} />

      {/* Archive button for the author */}
      {isOwner ? (
        <form action={deleteUserCombinationAction} className="border-t border-border pt-4">
          <input type="hidden" name="exampleId" value={userExample.id} />
          <button
            type="submit"
            className="text-sm font-medium text-[#7f4026] underline underline-offset-4 transition hover:text-[#bb6742]"
          >
            Archive this combination
          </button>
        </form>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main browser component
 * ------------------------------------------------------------------------ */

export function CombinationsBrowser({
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
  const [query, setQuery] = useState(initialQuery);
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
  const normalizedQuery = deferredQuery.trim().toLowerCase();

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

    // Text search
    if (normalizedQuery) {
      const strippedQuery = stripPunctuation(normalizedQuery);
      tiles = tiles.filter((tile) =>
        tile.searchText.includes(normalizedQuery) ||
        (strippedQuery !== normalizedQuery && tile.searchText.includes(strippedQuery)),
      );
    }

    return tiles;
  }, [view, normalizedQuery, brandFilters, showCone5, showCone6, showCone10, allTiles, possibleTiles, plus1Tiles, mineTiles, userExampleTiles, communityPostTiles, manufacturerTiles]);

  const activeTile = useMemo(
    () => activeTiles.find((t) => t.id === activeTileId) ?? null,
    [activeTiles, activeTileId],
  );

  const hasFilters = view !== "all" || brandFilters.length > 0 || query.trim().length > 0 || !showCone5 || !showCone6 || !showCone10;

  /* Reset visible count when filters change */
  useEffect(() => {
    setVisibleCount(INITIAL_TILE_BATCH);
  }, [view, normalizedQuery, brandFilters, showCone5, showCone6, showCone10]);

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

  return (
    <div className="space-y-6">
      {/* search + filters */}
      <Panel className="space-y-4">
        <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-3 sm:px-4 sm:py-4">
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by glaze code, glaze name, clay body, cone, or keyword"
            className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
          />
          {query.trim() ? (
            <button type="button" onClick={() => setQuery("")} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="neutral">
            {activeTiles.length} result{activeTiles.length === 1 ? "" : "s"}
          </Badge>
          <button
            type="button"
            onClick={() => { setView("mine"); setBrandFilters([]); setVisibleCount(INITIAL_TILE_BATCH); }}
            className={buttonVariants({
              variant: view === "mine" ? "primary" : "ghost",
              size: "lg",
            })}
          >
            My Combinations
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen((c) => !c)}
            className={buttonVariants({
              variant: hasFilters ? "primary" : "ghost",
              size: "sm",
            })}
          >
            {filtersOpen ? "Hide filters" : "Filters"}
          </button>
          <a
            href="/publish"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            + Share your result
          </a>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Expandable filter sections */}
        {filtersOpen ? (
          <div className="space-y-2">
            {/* View filter */}
            <FilterSection
              title="View"
              optionCount={viewFilters.length}
              selectedCount={view !== "all" ? 1 : 0}
              open={openFilterSections.view ?? true}
              onToggle={() => setOpenFilterSections((c) => ({ ...c, view: !(c.view ?? true) }))}
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {viewFilters.map((filter) => (
                  <FilterTile
                    key={filter.key}
                    value={filter.label}
                    count={filter.count}
                    checked={view === filter.key}
                    onToggle={() => {
                      setView((current) => current === filter.key ? "all" : filter.key);
                      setVisibleCount(INITIAL_TILE_BATCH);
                    }}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Brand filter */}
            <FilterSection
              title="Brands"
              optionCount={brandOptions.length}
              selectedCount={brandFilters.length}
              open={openFilterSections.brands ?? false}
              onToggle={() => setOpenFilterSections((c) => ({ ...c, brands: !(c.brands ?? false) }))}
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {brandOptions.map((option) => (
                  <FilterTile
                    key={option}
                    value={option}
                    count={brandOptionCounts.get(option)}
                    checked={brandFilters.includes(option)}
                    onToggle={(value) => {
                      setBrandFilters((current) => toggleValue(current, value));
                      setVisibleCount(INITIAL_TILE_BATCH);
                    }}
                  />
                ))}
              </div>
            </FilterSection>
          </div>
        ) : null}

        {/* Cone filter */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs uppercase tracking-[0.18em] text-muted">Cone filter</span>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={showCone5}
              onChange={(e) => setShowCone5(e.target.checked)}
              className="accent-foreground"
            />
            Cone 5
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={showCone6}
              onChange={(e) => setShowCone6(e.target.checked)}
              className="accent-foreground"
            />
            Cone 6
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={showCone10}
              onChange={(e) => setShowCone10(e.target.checked)}
              className="accent-foreground"
            />
            Cone 10
          </label>
        </div>

        {/* Active filter summary chips */}
        {hasFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            {view !== "all" ? (
              <button
                type="button"
                onClick={() => { setView("all"); setVisibleCount(INITIAL_TILE_BATCH); }}
                className="flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground transition hover:bg-foreground/[0.04]"
              >
                {viewLabel}
                <X className="h-3 w-3 text-muted" />
              </button>
            ) : null}
            {brandFilters.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  setBrandFilters((current) => current.filter((b) => b !== brand));
                  setVisibleCount(INITIAL_TILE_BATCH);
                }}
                className="flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground transition hover:bg-foreground/[0.04]"
              >
                {brand}
                <X className="h-3 w-3 text-muted" />
              </button>
            ))}
          </div>
        ) : null}
      </Panel>

      {/* tile grid */}
      {activeTiles.length ? (
        <div className="space-y-4">
          <div className="overflow-hidden border border-border bg-panel">
            <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                {viewLabel}
              </p>
              <Badge tone="neutral">
                {visibleTiles.length}{visibleTiles.length !== activeTiles.length ? ` / ${activeTiles.length}` : ""}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1.5 min-[420px]:grid-cols-3 sm:gap-2 sm:p-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visibleTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setActiveTileId(tile.id)}
                  className="group relative z-0 overflow-visible border border-border bg-white text-left transition-transform duration-200 hover:z-20 hover:scale-[1.02] focus-visible:z-20 focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/20"
                  style={{ contentVisibility: "auto", containIntrinsicSize: "220px" }}
                >
                  <div className="space-y-1.5 p-1.5 sm:p-2">
                    <div className="relative overflow-hidden border border-border bg-panel">
                      {tile.imageUrl ? (
                        <Image
                          src={tile.imageUrl}
                          alt={tile.title}
                          width={256}
                          height={256}
                          sizes="(min-width: 640px) 200px, 50vw"
                          className="aspect-square w-full object-cover bg-white transition duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-xs uppercase tracking-[0.18em] text-muted">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Stacked layer display */}
                    {tile.tileLayers.length >= 2 ? (
                      <div className="space-y-0">
                        {tile.tileLayers.map((layer, layerIdx) => (
                          <div key={layerIdx}>
                            {layerIdx > 0 ? (
                              <div className="border-t border-foreground/10" />
                            ) : null}
                            <div className="flex items-baseline gap-1.5 px-0.5 py-1">
                              {layer.code ? (
                                <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-muted/70 sm:text-[10px]">
                                  {layer.code}
                                </span>
                              ) : null}
                              <span className="text-[11px] font-semibold leading-tight text-foreground line-clamp-1 sm:text-xs">
                                {layer.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {tile.subtitle ? (
                          <p className="text-[9px] uppercase tracking-[0.18em] text-muted sm:text-[10px]">
                            {tile.subtitle}
                          </p>
                        ) : null}
                        <h4 className="line-clamp-2 text-[13px] font-semibold leading-5 text-foreground sm:text-sm">
                          {tile.title}
                        </h4>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {tile.cone ? <Badge tone="neutral">{tile.cone}</Badge> : null}
                      <Badge tone={tile.badgeTone}>{tile.badgeLabel}</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {remainingCount > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                onClick={() => setVisibleCount((c) => Math.min(c + TILE_BATCH_STEP, activeTiles.length))}
              >
                Show {Math.min(TILE_BATCH_STEP, remainingCount)} more
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                onClick={() => setVisibleCount(activeTiles.length)}
              >
                Show all {activeTiles.length}
              </button>
            </div>
          ) : null}

          {/* Scroll sentinel for auto-loading */}
          {remainingCount > 0 ? (
            <div
              ref={loadMoreRef}
              className="border border-dashed border-border bg-panel px-4 py-3 text-center text-sm text-muted"
            >
              Loading more combinations as you scroll...
            </div>
          ) : null}
        </div>
      ) : (
        <Panel>
          <h2 className="display-font text-3xl tracking-tight">No combinations match yet.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            {view === "possible"
              ? "No combination exists yet that only uses glazes on your shelf. Switch to All combinations or add more glazes to your inventory."
              : view === "plus1"
              ? "No combination is just one glaze away from your shelf. Try adding more glazes to your inventory."
              : view === "mine"
              ? "You haven't published any combinations yet. Share a kiln-tested result to see it here."
              : "Try a glaze code, glaze name, cone, or clay body to narrow the results."}
          </p>
        </Panel>
      )}

      {/* detail modal overlay */}
      {activeTile ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#2d1c16]/35 p-2 sm:items-center sm:p-4"
          onClick={() => setActiveTileId(null)}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden border border-border bg-background sm:mt-[4vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                {activeTile.subtitle ? (
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{activeTile.subtitle}</p>
                ) : null}
                <h3 className="truncate text-lg font-semibold leading-tight text-foreground sm:text-2xl">{activeTile.title}</h3>
              </div>
              {(() => {
                const combinationId = activeTile.example?.id ?? activeTile.post?.id ?? activeTile.userExample?.id ?? null;
                if (!combinationId || !viewerUserId) return null;
                const isFavourited = favouritedCombinationIds.has(combinationId);
                const isPending = pendingFavouriteIds.includes(combinationId);
                return (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void handleFavouriteToggle(combinationId)}
                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition disabled:opacity-50 ${
                      isFavourited
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-white text-muted hover:text-foreground"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFavourited ? "fill-current" : ""}`} />
                    {isFavourited ? "Favourited" : "Favourite"}
                  </button>
                );
              })()}
              <button
                type="button"
                onClick={() => setActiveTileId(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-white text-foreground transition hover:-translate-y-px"
                aria-label="Close combination details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
              {activeTile.example ? (
                <ExampleDetail
                  example={activeTile.example}
                  glazeFiringImages={glazeFiringImages}
                  inventoryStatusByGlazeId={inventoryStatusByGlazeId}
                  onInventoryStatusChange={handleInventoryStatusChange}
                />
              ) : activeTile.userExample ? (
                <UserExampleDetail
                  userExample={activeTile.userExample}
                  glazeFiringImages={glazeFiringImages}
                  inventoryStatusByGlazeId={inventoryStatusByGlazeId}
                  onInventoryStatusChange={handleInventoryStatusChange}
                  viewerUserId={viewerUserId}
                />
              ) : activeTile.post ? (
                <PostDetail
                  post={activeTile.post}
                  glazeFiringImages={glazeFiringImages}
                  inventoryStatusByGlazeId={inventoryStatusByGlazeId}
                  onInventoryStatusChange={handleInventoryStatusChange}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
