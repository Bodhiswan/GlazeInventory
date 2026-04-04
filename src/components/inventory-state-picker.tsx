"use client";

import { buttonVariants } from "@/components/ui/button";
import type { InventoryCollectionState, InventoryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const visibleStates: InventoryStatus[] = ["owned", "wishlist", "archived"];

const stateLabels: Record<InventoryStatus, string> = {
  owned: "I own it",
  wishlist: "Wishlist",
  archived: "Empty",
};

export function InventoryStatePicker({
  status,
  onChange,
  pending = false,
  error,
  allowRemove = true,
  showEmpty = true,
  compact = false,
}: {
  status: InventoryCollectionState;
  onChange: (nextStatus: InventoryCollectionState) => void;
  pending?: boolean;
  error?: string | null;
  allowRemove?: boolean;
  showEmpty?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex flex-wrap gap-2",
          pending ? "pointer-events-none opacity-75" : "",
        )}
      >
        {visibleStates
          .filter((value) => showEmpty || value !== "archived")
          .map((value) => {
          const active = status === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
            className={buttonVariants({
              variant: active ? "primary" : "ghost",
              size: compact ? "sm" : "md",
              className: compact
                ? "min-h-11 flex-1 justify-center sm:min-h-10 sm:flex-none"
                : "min-h-11",
            })}
          >
              {stateLabels[value]}
            </button>
          );
        })}
        {allowRemove ? (
          <button
            type="button"
            onClick={() => onChange("none")}
            className={buttonVariants({
              variant: status === "none" ? "danger" : "ghost",
              size: compact ? "sm" : "md",
              className: compact
                ? "min-h-11 flex-1 justify-center sm:min-h-10 sm:flex-none"
                : "min-h-11",
            })}
          >
            Remove
          </button>
        ) : null}
        {pending ? <span className="self-center text-xs text-muted">Saving…</span> : null}
      </div>
      {error ? <p className="text-xs text-[#7f4026]">{error}</p> : null}
    </div>
  );
}
