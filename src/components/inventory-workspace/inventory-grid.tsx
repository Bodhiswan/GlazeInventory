"use client";

import type { InventoryItem } from "@/lib/types";
import { InventoryCard } from "./inventory-card";

export function InventoryGrid({
  items,
  preferredImages,
  query,
  sectionLabel,
  onItemClick,
}: {
  items: InventoryItem[];
  preferredImages: Record<string, string | null>;
  query: string;
  sectionLabel: string;
  onItemClick: (itemId: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="border border-dashed border-border bg-background px-4 py-6 text-sm text-muted">
        {query
          ? `No glazes in ${sectionLabel.toLowerCase()} match this search yet.`
          : `No glazes in ${sectionLabel.toLowerCase()} yet.`}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <InventoryCard
          key={item.id}
          item={item}
          imageUrl={preferredImages[item.glazeId] ?? item.glaze.imageUrl ?? null}
          onClick={() => onItemClick(item.id)}
        />
      ))}
    </div>
  );
}
