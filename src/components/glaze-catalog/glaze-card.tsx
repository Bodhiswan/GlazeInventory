"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import type { InventoryStatus } from "@/lib/types";
import { formatGlazeLabel, pickPreferredGlazeImage } from "@/lib/utils";
import type { IndexedGlaze } from "@/components/glaze-catalog/use-glaze-explorer";

export function GlazeCard({
  item,
  optimisticInventoryStates,
  previewCone,
  preferredAtmosphere,
  onSelect,
}: {
  item: IndexedGlaze;
  optimisticInventoryStates: Record<string, { inventoryId: string; status: InventoryStatus }>;
  previewCone: string | null;
  preferredAtmosphere: string | null;
  onSelect: (glazeId: string) => void;
}) {
  const { glaze, firingImages, finishSummary } = item;
  const inventoryState = optimisticInventoryStates[glaze.id];
  const currentStatus: "none" | InventoryStatus = inventoryState?.status ?? "none";
  const previewImage = pickPreferredGlazeImage(glaze, firingImages, previewCone, preferredAtmosphere);

  return (
    <button
      type="button"
      onClick={() => onSelect(glaze.id)}
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
          {finishSummary ? (
            <p className="hidden line-clamp-1 text-xs text-muted sm:block">{finishSummary}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1">
          {currentStatus === "owned" ? <Badge tone="owned">Owned</Badge> : null}
          {currentStatus === "wishlist" ? <Badge tone="wishlist">Wishlist</Badge> : null}
          {currentStatus === "archived" ? <Badge tone="neutral">Empty</Badge> : null}
        </div>
      </div>
    </button>
  );
}
