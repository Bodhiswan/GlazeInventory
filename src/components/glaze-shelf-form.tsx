"use client";

import { useState } from "react";

import { updateGlazeInventoryAmountAction } from "@/app/actions/inventory";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InventoryFillLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const fillLevels: Array<{ value: InventoryFillLevel; label: string }> = [
  { value: "full", label: "Full" },
  { value: "half", label: "Half" },
  { value: "low", label: "Low" },
];

export function GlazeShelfForm({
  glazeId,
  initialFillLevel = "full",
  initialQuantity = 1,
  compact = false,
  onSaved,
}: {
  glazeId: string;
  initialFillLevel?: InventoryFillLevel;
  initialQuantity?: number;
  compact?: boolean;
  onSaved?: (next: { fillLevel: InventoryFillLevel; quantity: number }) => void;
}) {
  const [fillLevel, setFillLevel] = useState<InventoryFillLevel>(initialFillLevel);
  const [quantity, setQuantity] = useState(String(initialQuantity));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setPending(true);
    setError(null);
    setSaved(false);

    const result = await updateGlazeInventoryAmountAction({
      glazeId,
      fillLevel,
      quantity: Number(quantity),
    });

    if (!result.success) {
      setError(result.message);
      setPending(false);
      return;
    }

    setFillLevel(result.fillLevel);
    setQuantity(String(result.quantity));
    setSaved(true);
    setPending(false);
    onSaved?.({
      fillLevel: result.fillLevel,
      quantity: result.quantity,
    });
  }

  return (
    <div
      className={cn(
        "space-y-4 border border-border bg-panel p-4",
        compact ? "p-3" : "",
      )}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Amount left</p>
        <div className="flex flex-wrap gap-2">
          {fillLevels.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFillLevel(option.value);
                setSaved(false);
              }}
              className={buttonVariants({
                variant: fillLevel === option.value ? "primary" : "ghost",
                size: "sm",
                className: "min-h-11 flex-1 justify-center sm:min-h-10 sm:flex-none",
              })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="grid max-w-none gap-2 text-sm font-medium sm:max-w-[170px]">
        Quantity
        <Input
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          value={quantity}
          onChange={(event) => {
            setQuantity(event.target.value);
            setSaved(false);
          }}
          className={cn("bg-white")}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={pending}
          className={buttonVariants({ size: "sm", className: "w-full sm:w-auto" })}
        >
          {pending ? "Saving…" : "Save amount left"}
        </button>
        {saved ? <span className="text-xs text-accent-3">Saved</span> : null}
      </div>

      {error ? <p className="text-xs text-[#7f4026]">{error}</p> : null}
    </div>
  );
}
