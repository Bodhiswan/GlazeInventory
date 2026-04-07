"use client";

import Image from "next/image";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import type { InventoryItem } from "@/lib/types";
import { formatGlazeLabel, formatGlazeMeta } from "@/lib/utils";

export const InventoryCard = memo(function InventoryCard({
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
