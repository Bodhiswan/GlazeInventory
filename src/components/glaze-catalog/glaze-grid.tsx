"use client";

import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import type { InventoryStatus } from "@/lib/types";
import { GlazeCard } from "@/components/glaze-catalog/glaze-card";
import type { IndexedGlaze } from "@/components/glaze-catalog/use-glaze-explorer";

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
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-border bg-panel">
        <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Visible now</p>
          <Badge tone="neutral">
            {visibleGlazeCount} / {displayGlazesLength}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1.5 min-[420px]:grid-cols-3 sm:gap-2 sm:p-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
