"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCatalogGlazesForScannerAction } from "@/app/actions";
import { BuyLinksDropdown } from "@/components/buy-links-dropdown";
import { GlazeScanner } from "@/components/glaze-scanner";

import { setGlazeInventoryStateAction, updateInventoryItemNotesAction } from "@/app/actions";
import { GlazeShelfForm } from "@/components/glaze-shelf-form";
import { InventoryStatePicker } from "@/components/inventory-state-picker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import type {
  GlazeFiringImage,
  InventoryCollectionState,
  InventoryItem,
  InventoryStatus,
} from "@/lib/types";
import {
  buildGlazeSearchIndex,
  cn,
  formatGlazeLabel,
  formatGlazeMeta,
  matchesGlazeSearch,
  pickPreferredGlazeImage,
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

const InventoryTile = memo(function InventoryTile({
  item,
  imageUrl,
  onClick,
}: {
  item: InventoryItem;
  imageUrl: string | null;
  onClick: () => void;
}) {
  const fillLevel = item.fillLevel ?? "full";
  const quantity = item.quantity ?? 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative z-0 overflow-visible border border-border bg-white text-left transition-transform duration-200 hover:z-20 hover:scale-[1.02] focus-visible:z-20 focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/20"
      style={{ contentVisibility: "auto", containIntrinsicSize: "220px" }}
    >
      <div className="space-y-2 p-2">
        <div className="relative overflow-hidden border border-border bg-panel">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={formatGlazeLabel(item.glaze)}
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
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
            {[item.glaze.brand, item.glaze.code].filter(Boolean).join(" ")}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
            {item.glaze.name}
          </h3>
          <p className="line-clamp-1 text-xs text-muted">{formatGlazeMeta(item.glaze)}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge tone={item.status === "owned" ? "success" : item.status === "wishlist" ? "accent" : "neutral"}>
            {item.status === "owned" ? "Owned" : item.status === "wishlist" ? "Wishlist" : "Empty"}
          </Badge>
          {item.status === "owned" ? <Badge tone="neutral">{fillLevel}</Badge> : null}
          {item.status === "owned" && quantity > 1 ? <Badge tone="neutral">Qty {quantity}</Badge> : null}
        </div>

        {item.personalNotes ? (
          <p className="line-clamp-2 text-xs leading-5 text-muted">{item.personalNotes}</p>
        ) : null}
      </div>
    </button>
  );
});

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

type CatalogGlazeSummary = {
  id: string;
  brand: string | null;
  code: string | null;
  name: string;
  line: string | null;
  imageUrl: string | null;
};

export function InventoryWorkspace({
  items,
  firingImageMap,
  preferredCone,
  preferredAtmosphere,
}: {
  items: InventoryItem[];
  firingImageMap: Record<string, GlazeFiringImage[]>;
  preferredCone: string | null;
  preferredAtmosphere: string | null;
}) {
  const [inventoryItems, setInventoryItems] = useState(items);
  const [query, setQuery] = useState("");
  const [catalogGlazes, setCatalogGlazes] = useState<CatalogGlazeSummary[] | null>(null);

  // Load catalog data on mount for the scanner
  useEffect(() => {
    void getCatalogGlazesForScannerAction().then(setCatalogGlazes);
  }, []);

  const [openSections, setOpenSections] = useState<Record<InventoryStatus, boolean>>({
    owned: true,
    wishlist: false,
    archived: false,
  });
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [pendingGlazeIds, setPendingGlazeIds] = useState<string[]>([]);
  const [statusErrors, setStatusErrors] = useState<Record<string, string | null>>({});
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

  async function handleStatusChange(item: InventoryItem, nextStatus: InventoryCollectionState) {
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
  }

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
              onToggle={() =>
                setOpenSections((current) => ({
                  ...current,
                  [section.status]: !current[section.status],
                }))
              }
            >
              {itemsForSection.length ? (
                <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                  {itemsForSection.map((item) => (
                    <InventoryTile
                      key={item.id}
                      item={item}
                      imageUrl={preferredImages[item.glazeId] ?? item.glaze.imageUrl ?? null}
                      onClick={() => setActiveItemId(item.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border bg-background px-4 py-6 text-sm text-muted">
                  {query
                    ? `No glazes in ${section.label.toLowerCase()} match this search yet.`
                    : `No glazes in ${section.label.toLowerCase()} yet.`}
                </div>
              )}
            </InventorySection>
          );
        })}
      </div>

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
            {/* Sticky header — title + status + close all in one zone */}
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
                  onClick={() => setActiveItemId(null)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-white text-foreground transition hover:-translate-y-px"
                  aria-label="Close inventory glaze details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Status picker + nav — right below title, stays visible */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <InventoryStatePicker
                  status={activeItem.status}
                  compact
                  pending={pendingGlazeIds.includes(activeItem.glazeId)}
                  error={statusErrors[activeItem.id] ?? null}
                  onChange={(nextStatus) => {
                    void handleStatusChange(activeItem, nextStatus);
                  }}
                />
                {activeItem.glaze.code ? (
                  <Link
                    href={`/combinations?q=${encodeURIComponent(activeItem.glaze.code)}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Combinations
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain">
              <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,220px)_1fr]">
                {/* Images column — stacked vertically with labels */}
                <div className="mx-auto w-full max-w-[280px] space-y-2 lg:mx-0">
                  {/* Main / preferred image */}
                  <div className="overflow-hidden border border-border bg-panel">
                    {(preferredImages[activeItem.glazeId] ?? activeItem.glaze.imageUrl) ? (
                      <Image
                        src={preferredImages[activeItem.glazeId] ?? activeItem.glaze.imageUrl ?? ""}
                        alt={formatGlazeLabel(activeItem.glaze)}
                        width={384}
                        height={384}
                        sizes="(min-width: 1024px) 220px, 280px"
                        className="aspect-square w-full object-contain bg-white"
                        priority
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-xs uppercase tracking-[0.18em] text-muted">
                        No image
                      </div>
                    )}
                    {(() => {
                      const images = firingImageMap[activeItem.glazeId] ?? [];
                      const matchedImage = images.find((img) => img.imageUrl === preferredImages[activeItem.glazeId]);
                      const label = [matchedImage?.cone, matchedImage?.atmosphere].filter(Boolean).join(" · ");
                      return label ? (
                        <p className="bg-panel px-2 py-1 text-center text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
                      ) : null;
                    })()}
                  </div>
                  {/* Additional firing images */}
                  {(firingImageMap[activeItem.glazeId] ?? [])
                    .filter((img) => img.imageUrl !== preferredImages[activeItem.glazeId])
                    .map((img) => (
                      <div key={img.id} className="overflow-hidden border border-border bg-panel">
                        <Image
                          src={img.imageUrl}
                          alt={`${formatGlazeLabel(activeItem.glaze)} – ${[img.cone, img.atmosphere].filter(Boolean).join(" · ")}`}
                          width={384}
                          height={384}
                          sizes="(min-width: 1024px) 220px, 280px"
                          className="aspect-square w-full object-contain bg-white"
                          loading="lazy"
                        />
                        {(() => {
                          const label = [img.cone, img.atmosphere].filter(Boolean).join(" · ");
                          return label ? (
                            <p className="bg-panel px-2 py-1 text-center text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
                          ) : null;
                        })()}
                      </div>
                    ))}
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
                        setInventoryItems((current) =>
                          current.map((candidate) =>
                            candidate.id === activeItem.id
                              ? {
                                  ...candidate,
                                  fillLevel,
                                  quantity,
                                }
                              : candidate,
                          ),
                        );
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
                      setInventoryItems((current) =>
                        current.map((candidate) =>
                          candidate.id === activeItem.id
                            ? {
                                ...candidate,
                                personalNotes: note,
                              }
                            : candidate,
                        ),
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
