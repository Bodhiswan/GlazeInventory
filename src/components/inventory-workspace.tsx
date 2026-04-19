"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Heart, Search, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { BuyLinksDropdown } from "@/components/buy-links-dropdown";
import { GlazeScanner } from "@/components/glaze-scanner";
import { GlazeShelfForm } from "@/components/glaze-shelf-form";
import { InventoryStatePicker } from "@/components/inventory-state-picker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { deleteUserCombinationAction } from "@/app/actions/combinations";
import { updateInventoryItemNotesAction } from "@/app/actions/inventory";
import { GlazeCommentsPanel } from "@/components/glaze-comments-panel";
import { CommunityImagesPanel } from "@/components/community-images-panel";
import { GlazeImageGallery } from "@/components/glaze-image-gallery";
import { InventoryGrid } from "@/components/inventory-workspace/inventory-grid";
import { useInventoryWorkspace } from "@/components/inventory-workspace/use-inventory-workspace";
import type {
  CombinationPost,
  GlazeFiringImage,
  InventoryItem,
  InventoryStatus,
  UserCombinationExample,
} from "@/lib/types";
import {
  cn,
  formatGlazeLabel,
  formatGlazeMeta,
} from "@/lib/utils";

const inventorySections: Array<{
  status: InventoryStatus;
  label: string;
  helper: string;
}> = [
  {
    status: "owned",
    label: "Owned",
    helper: "Glazes you have on hand right now.",
  },
  {
    status: "wishlist",
    label: "Wishlist",
    helper: "Glazes you want to remember or buy next.",
  },
  {
    status: "archived",
    label: "Empty",
    helper: "Glazes you used up but still want in your records.",
  },
];

function InventorySection({
  label,
  helper,
  totalCount,
  visibleCount,
  open,
  onToggle,
  children,
}: {
  label: string;
  helper: string;
  totalCount: number;
  visibleCount: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-border bg-panel">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-white/50"
        aria-expanded={open}
      >
        <span className="space-y-1">
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">{helper}</span>
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="neutral">
            {visibleCount}
            {visibleCount !== totalCount ? ` of ${totalCount}` : ""}
          </Badge>
          <ChevronDown
            className={cn("h-4 w-4 text-muted transition-transform", open ? "rotate-180" : "")}
          />
        </span>
      </button>
      {open ? <div className="border-t border-border p-3 sm:p-4">{children}</div> : null}
    </div>
  );
}

function InventoryNotesForm({
  inventoryId,
  initialNote,
  onSaved,
}: {
  inventoryId: string;
  initialNote: string | null;
  onSaved: (note: string | null) => void;
}) {
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setPending(true);
    setSaved(false);
    setError(null);

    const result = await updateInventoryItemNotesAction({
      inventoryId,
      personalNote: note,
    });

    if (!result.success) {
      setError(result.message);
      setPending(false);
      return;
    }

    setNote(result.personalNote ?? "");
    setSaved(true);
    setPending(false);
    onSaved(result.personalNote ?? null);
  }

  return (
    <div className="space-y-3 border border-border bg-panel p-3">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Studio note</p>
        <p className="mt-1 text-sm text-muted">Add a private note for this glaze in your inventory.</p>
      </div>
      <Textarea
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setSaved(false);
        }}
        placeholder="Add application notes, clay body reminders, or test results."
        className="min-h-28 bg-white"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={pending}
          className={buttonVariants({ size: "sm", className: "w-full sm:w-auto" })}
        >
          {pending ? "Saving…" : "Save note"}
        </button>
        {saved ? <span className="text-xs text-accent-3">Saved</span> : null}
      </div>
      {error ? <p className="text-xs text-[#7f4026]">{error}</p> : null}
    </div>
  );
}

export function InventoryWorkspace({
  items,
  firingImageMap,
  preferredCone,
  preferredAtmosphere,
  myUserExamples = [],
  myCombinationPosts = [],
  favouriteGlazeIds = [],
}: {
  items: InventoryItem[];
  firingImageMap: Record<string, GlazeFiringImage[]>;
  preferredCone: string | null;
  preferredAtmosphere: string | null;
  myUserExamples?: UserCombinationExample[];
  myCombinationPosts?: CombinationPost[];
  favouriteGlazeIds?: string[];
}) {
  const {
    query,
    setQuery,
    catalogGlazes,
    openSections,
    toggleSection,
    filteredItems,
    sectionItems,
    totalCounts,
    preferredImages,
    activeItem,
    activeItemId,
    setActiveItemId,
    pendingGlazeIds,
    statusErrors,
    favouritedGlazeIds,
    pendingFavouriteIds,
    handleStatusChange,
    handleFavouriteToggle,
    handleNoteSaved,
    handleShelfSaved,
  } = useInventoryWorkspace({
    items,
    firingImageMap,
    preferredCone,
    preferredAtmosphere,
    myUserExamples,
    myCombinationPosts,
    favouriteGlazeIds,
  });

  return (
    <div className="space-y-6">
      <Panel className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm font-semibold text-foreground">Add a glaze</span>
          {catalogGlazes ? (
            <GlazeScanner catalogGlazes={catalogGlazes} />
          ) : (
            <div className="flex items-center gap-3 border border-foreground/14 bg-white px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <span className="text-sm text-muted/60">Loading catalog...</span>
            </div>
          )}
        </div>
      </Panel>

      <Panel className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-foreground">Search your inventory</span>
          <div className="flex items-center gap-3 border border-foreground/14 bg-white px-3 py-3 sm:px-4 sm:py-4">
            <Search className="h-4 w-4 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by glaze name, code, brand, or note"
              className="border-0 bg-transparent px-0 text-base shadow-none"
            />
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{filteredItems.length} glazes in view</Badge>
          {inventorySections.map((section) => (
            <Badge key={section.status} tone="neutral">
              {section.label}: {sectionItems[section.status].length}
            </Badge>
          ))}
          {query ? (
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          ) : null}
        </div>
      </Panel>

      <div className="space-y-4">
        {inventorySections.map((section) => {
          const itemsForSection = sectionItems[section.status];

          return (
            <InventorySection
              key={section.status}
              label={section.label}
              helper={section.helper}
              totalCount={totalCounts[section.status]}
              visibleCount={itemsForSection.length}
              open={openSections[section.status]}
              onToggle={() => toggleSection(section.status)}
            >
              <InventoryGrid
                items={itemsForSection}
                preferredImages={preferredImages}
                query={query}
                sectionLabel={section.label}
                onItemClick={setActiveItemId}
              />
            </InventorySection>
          );
        })}
      </div>

      {/* My Combinations section */}
      <InventorySection
        label="My Combinations"
        helper="Glaze combinations you've published."
        totalCount={myUserExamples.length + myCombinationPosts.length}
        visibleCount={myUserExamples.length + myCombinationPosts.length}
        open={openSections.combinations ?? false}
        onToggle={() => toggleSection("combinations")}
      >
        {myUserExamples.length || myCombinationPosts.length ? (
          <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {myUserExamples.map((ue) => (
              <div
                key={ue.id}
                className="group relative z-0 overflow-visible border border-border bg-white text-left"
              >
                <div className="space-y-2 p-2">
                  <div className="relative overflow-hidden border border-border bg-panel">
                    {ue.imageUrls[0] ? (
                      <Image
                        src={ue.imageUrls[0]}
                        alt={ue.title}
                        width={256}
                        height={256}
                        sizes="(min-width: 640px) 200px, 50vw"
                        className="aspect-square w-full object-cover bg-white"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-xs uppercase tracking-[0.18em] text-muted">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{ue.cone}</p>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                      {ue.title}
                    </h3>
                    <p className="line-clamp-1 text-xs text-muted">
                      {ue.layers.length} layer{ue.layers.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone="neutral">Member example</Badge>
                  </div>
                  <form action={deleteUserCombinationAction}>
                    <input type="hidden" name="exampleId" value={ue.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-[#7f4026] underline underline-offset-4 transition hover:text-[#bb6742]"
                    >
                      Archive
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {myCombinationPosts.map((post) => {
              const imageSrc = typeof post.imagePath === "string" && post.imagePath.trim() ? post.imagePath : null;
              return (
                <Link
                  key={post.id}
                  href={`/combinations/${post.pairKey}`}
                  className="group relative z-0 overflow-visible border border-border bg-white text-left transition-transform duration-200 hover:z-20 hover:scale-[1.02]"
                >
                  <div className="space-y-2 p-2">
                    <div className="relative overflow-hidden border border-border bg-panel">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={post.caption ?? "Combination"}
                          width={256}
                          height={256}
                          sizes="(min-width: 640px) 200px, 50vw"
                          className="aspect-square w-full object-cover bg-white"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-xs uppercase tracking-[0.18em] text-muted">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Community post</p>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                        {post.caption ?? "Published combination"}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone="neutral">Post</Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
            <p>You haven't published any combinations yet.</p>
            <Link href="/contribute" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
              Share a kiln-tested combination
            </Link>
          </div>
        )}
      </InventorySection>

      {!filteredItems.length ? (
        <Panel>
          <h2 className="display-font text-3xl tracking-tight">Nothing matches this search yet.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Try another glaze name, code, or note keyword, or head back to the library and add more glazes.
          </p>
          <div className="mt-4">
            <Link href="/glazes" className={buttonVariants({})}>
              Open library
            </Link>
          </div>
        </Panel>
      ) : null}

      {activeItem ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#2d1c16]/35 p-2 sm:items-center sm:p-4"
          onClick={() => setActiveItemId(null)}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden border border-border bg-background sm:mt-[6vh]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Sticky header — title + favourite + close */}
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    {[activeItem.glaze.brand, activeItem.glaze.code].filter(Boolean).join(" ")}
                  </p>
                  <h2 className="truncate text-lg font-semibold leading-tight text-foreground sm:text-2xl">{activeItem.glaze.name}</h2>
                </div>
                <button
                  type="button"
                  disabled={pendingFavouriteIds.includes(activeItem.glazeId)}
                  onClick={() => void handleFavouriteToggle(activeItem.glazeId)}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition disabled:opacity-50 ${
                    favouritedGlazeIds.has(activeItem.glazeId)
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-white text-muted hover:text-foreground"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${favouritedGlazeIds.has(activeItem.glazeId) ? "fill-current" : ""}`} />
                  {favouritedGlazeIds.has(activeItem.glazeId) ? "Favourited" : "Favourite"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItemId(null)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-white text-foreground transition hover:-translate-y-px"
                  aria-label="Close inventory glaze details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Status picker + nav */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <InventoryStatePicker
                  status={activeItem.status}
                  tiny
                  pending={pendingGlazeIds.includes(activeItem.glazeId)}
                  error={statusErrors[activeItem.id] ?? null}
                  onChange={(nextStatus) => {
                    void handleStatusChange(activeItem, nextStatus);
                  }}
                />
                {activeItem.glaze.code ? (
                  <Link
                    href={`/combinations?q=${encodeURIComponent(activeItem.glaze.code)}`}
                    className="inline-flex items-center border border-border bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-muted transition hover:text-foreground"
                  >
                    Combinations
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain">
              <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,220px)_1fr]">
                {/* Images column — gallery with lightbox */}
                <div className="mx-auto w-full max-w-[280px] lg:mx-0">
                  <GlazeImageGallery
                    baseImageUrl={activeItem.glaze.imageUrl}
                    baseImageAlt={formatGlazeLabel(activeItem.glaze)}
                    firingImages={firingImageMap[activeItem.glazeId] ?? []}
                    initialImageUrl={preferredImages[activeItem.glazeId] ?? activeItem.glaze.imageUrl}
                  />
                </div>

                <div className="space-y-4">
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      tone={
                        activeItem.status === "owned"
                          ? "success"
                          : activeItem.status === "wishlist"
                            ? "accent"
                            : "neutral"
                      }
                    >
                      {activeItem.status === "owned"
                        ? "Owned"
                        : activeItem.status === "wishlist"
                          ? "Wishlist"
                          : "Empty"}
                    </Badge>
                    {activeItem.status === "owned" ? (
                      <Badge tone="neutral">{activeItem.fillLevel ?? "full"}</Badge>
                    ) : null}
                    {activeItem.status === "owned" && (activeItem.quantity ?? 1) > 1 ? (
                      <Badge tone="neutral">Qty {activeItem.quantity ?? 1}</Badge>
                    ) : null}
                    {activeItem.glaze.cone ? <Badge tone="neutral">{activeItem.glaze.cone}</Badge> : null}
                  </div>

                  {activeItem.status === "owned" ? (
                    <GlazeShelfForm
                      glazeId={activeItem.glazeId}
                      initialFillLevel={activeItem.fillLevel ?? "full"}
                      initialQuantity={activeItem.quantity ?? 1}
                      compact
                      onSaved={({ fillLevel, quantity }) => {
                        handleShelfSaved(activeItem.id, { fillLevel, quantity });
                      }}
                    />
                  ) : null}

                  {/* Glaze info */}
                  <p className="text-sm leading-6 text-muted">{formatGlazeMeta(activeItem.glaze)}</p>

                  {activeItem.glaze.sourceType === "commercial" ? (
                    <BuyLinksDropdown glaze={activeItem.glaze} />
                  ) : null}

                  <InventoryNotesForm
                    key={activeItem.id}
                    inventoryId={activeItem.id}
                    initialNote={activeItem.personalNotes ?? null}
                    onSaved={(note) => {
                      handleNoteSaved(activeItem.id, note);
                    }}
                  />

                  <CommunityImagesPanel target={{ glazeId: activeItem.glazeId }} altPrefix={formatGlazeLabel(activeItem.glaze)} />

                  <GlazeCommentsPanel glazeId={activeItem.glazeId} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
