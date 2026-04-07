"use client";

import Image from "next/image";
import { Heart, X } from "lucide-react";
import type { RefObject } from "react";

import { deleteUserCombinationAction } from "@/app/actions/combinations";
import { setGlazeInventoryStateAction } from "@/app/actions/inventory";
import { BuyLinksDropdown } from "@/components/buy-links-dropdown";
import { CommunityImagesPanel } from "@/components/community-images-panel";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
import { CombinationCommentsPanel } from "@/components/glaze-comments-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { formatGlazeLabel, pickPreferredGlazeImage } from "@/lib/utils";
import { useState } from "react";
import type { CombinationTile } from "./use-combinations-browser";

/* ---------------------------------------------------------------------------
 * Helpers reused in detail modals
 * ------------------------------------------------------------------------ */

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
  if (!match) return null;
  return {
    top: match[1]?.trim() ?? "",
    base: match[2]?.trim() ?? "",
  };
}

function glazeMatchesLayerToken(glaze: Glaze, token: string) {
  const normalizedToken = normalizeComparisonText(token);
  if (!normalizedToken) return false;
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
  if (!layerOrder || glazes.length < 2) return glazes;
  const topGlaze = glazes.find((glaze) => glazeMatchesLayerToken(glaze, layerOrder.top));
  const baseGlaze = glazes.find(
    (glaze) => glaze.id !== topGlaze?.id && glazeMatchesLayerToken(glaze, layerOrder.base),
  );
  if (!topGlaze || !baseGlaze) return glazes;
  return [topGlaze, baseGlaze];
}

function getLayerRoleLabel(example: VendorCombinationExample, layerOrder: number) {
  if (layerOrder === 0) return "Top glaze";
  if (layerOrder === example.layers.length - 1) return layerOrder > 1 ? "Foundation layer" : "Base glaze";
  return "Middle layer";
}

function getPostLayerRoleLabel(post: CombinationPost, glaze: Glaze, index: number) {
  const layerOrder = extractPostLayerOrder(post);
  if (layerOrder) {
    if (glazeMatchesLayerToken(glaze, layerOrder.top)) return "Top glaze";
    if (glazeMatchesLayerToken(glaze, layerOrder.base)) return "Base glaze";
  }
  if (index === 0) return "Glaze";
  return `Glaze ${index + 1}`;
}

/* ---------------------------------------------------------------------------
 * GlazeOwnershipControl
 * ------------------------------------------------------------------------ */

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

/* ---------------------------------------------------------------------------
 * CombinationGlazeRow
 * ------------------------------------------------------------------------ */

function CombinationGlazeRow({
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
}

/* ---------------------------------------------------------------------------
 * ExampleDetail
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
 * PostDetail
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
 * UserExampleDetail
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
 * CombinationGrid
 * ------------------------------------------------------------------------ */

export interface CombinationGridProps {
  activeTile: CombinationTile | null;
  activeTiles: CombinationTile[];
  visibleTiles: CombinationTile[];
  remainingCount: number;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  viewLabel: string;
  view: string;
  setActiveTileId: (id: string | null) => void;
  glazeFiringImages: Record<string, GlazeFiringImage[]>;
  inventoryStatusByGlazeId: Record<string, InventoryStatus>;
  handleInventoryStatusChange: (glazeId: string, nextStatus: InventoryCollectionState) => void;
  favouritedCombinationIds: Set<string>;
  pendingFavouriteIds: string[];
  handleFavouriteToggle: (combinationId: string) => void;
  viewerUserId: string | null;
  visibleCount: number;
  setVisibleCount: (updater: (count: number) => number) => void;
  TILE_BATCH_STEP: number;
}

export function CombinationGrid({
  activeTile,
  activeTiles,
  visibleTiles,
  remainingCount,
  loadMoreRef,
  viewLabel,
  view,
  setActiveTileId,
  glazeFiringImages,
  inventoryStatusByGlazeId,
  handleInventoryStatusChange,
  favouritedCombinationIds,
  pendingFavouriteIds,
  handleFavouriteToggle,
  viewerUserId,
  visibleCount,
  setVisibleCount,
  TILE_BATCH_STEP,
}: CombinationGridProps) {
  return (
    <>
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
                onClick={() => setVisibleCount(() => activeTiles.length)}
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
    </>
  );
}
