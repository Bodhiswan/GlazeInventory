"use client";

import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import type { InventoryStatus } from "@/lib/types";
import { GlazeCard } from "@/components/glaze-catalog/glaze-card";
import type { IndexedGlaze } from "@/components/glaze-catalog/use-glaze-explorer";
import type { GlazeGroupingMode } from "@/components/glaze-catalog/glaze-view-options";

export function GlazeGrid({
  visibleGradientGlazes,
  optimisticInventoryStates,
  previewCone,
  preferredAtmosphere,
  onSelectGlaze,
  visibleGlazeCount,
  displayGlazesLength,
  hasActiveQuery,
  loadMoreRef,
  visibleCount,
  reviewMode,
  groupingMode = "none",
}: {
  visibleGradientGlazes: IndexedGlaze[];
  optimisticInventoryStates: Record<string, { inventoryId: string; status: InventoryStatus }>;
  previewCone: string | null;
  preferredAtmosphere: string | null;
  onSelectGlaze: (glazeId: string) => void;
  visibleGlazeCount: number;
  displayGlazesLength: number;
  hasActiveQuery: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  visibleCount: number;
  reviewMode: boolean;
  groupingMode?: GlazeGroupingMode;
}) {
  // Keep each glaze in one section so optional grouping never duplicates tiles.
  const grouped = (() => {
    if (groupingMode === "none") return null;

    const getGroupLabel = (item: IndexedGlaze) => {
      switch (groupingMode) {
        case "brand":
          return item.glaze.brand?.trim() || "Other";
        case "family":
          return item.familyTraits[0] || "Other";
        case "finish":
          return item.finishTraits[0] || "Other";
        case "color":
          return item.colorTraits[0] || "Other";
        case "line": {
          const brand = item.glaze.brand?.trim();
          const line = item.glaze.line?.trim();
          return [brand, line].filter(Boolean).join(" · ") || "Other";
        }
        case "cone":
          return item.coneTraits[0] || item.glaze.cone?.trim() || "Other";
      }
    };

    const groups = new Map<string, IndexedGlaze[]>();
    for (const item of visibleGradientGlazes) {
      const key = getGroupLabel(item);
      const existing = groups.get(key);
      if (existing) existing.push(item);
      else groups.set(key, [item]);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  })();

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-border bg-panel">
        <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Visible now</p>
          <Badge tone="neutral">
            {visibleGlazeCount} / {displayGlazesLength}
          </Badge>
        </div>

        {grouped ? (
          <div className="space-y-4 p-1.5 sm:p-2">
            {grouped.map(([label, items]) => (
              <section key={label} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1">
                  <h3 className="display-font text-sm tracking-tight">{label}</h3>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                  {items.map((item) => (
                    <GlazeCard
                      key={item.glaze.id}
                      item={item}
                      optimisticInventoryStates={optimisticInventoryStates}
                      previewCone={previewCone}
                      preferredAtmosphere={preferredAtmosphere}
                      onSelect={onSelectGlaze}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-3 sm:gap-2 sm:p-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {visibleGradientGlazes.map((item) => (
              <GlazeCard
                key={item.glaze.id}
                item={item}
                optimisticInventoryStates={optimisticInventoryStates}
                previewCone={previewCone}
                preferredAtmosphere={preferredAtmosphere}
                onSelect={onSelectGlaze}
              />
            ))}
          </div>
        )}
      </div>

      {hasActiveQuery && visibleCount < displayGlazesLength ? (
        <div
          ref={loadMoreRef}
          className="border border-dashed border-border bg-panel px-4 py-3 text-center text-sm text-muted"
        >
          Loading more glazes as you scroll...
        </div>
      ) : null}
    </div>
  );
}
