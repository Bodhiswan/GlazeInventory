"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type GlazeGroupingMode = "none" | "brand" | "family" | "finish" | "color" | "line" | "cone";

type GroupingOption = {
  mode: Exclude<GlazeGroupingMode, "none">;
  label: string;
  description: string;
};

const GROUPING_OPTIONS: GroupingOption[] = [
  { mode: "brand", label: "Brand", description: "Keep each maker together" },
  { mode: "family", label: "Family", description: "Group by glaze type" },
  { mode: "finish", label: "Finish", description: "Group by surface" },
  { mode: "color", label: "Colour", description: "Group by colour family" },
  { mode: "line", label: "Product line", description: "Keep ranges together" },
  { mode: "cone", label: "Cone", description: "Group by firing range" },
];

export function GlazeViewOptions({
  value,
  onChange,
}: {
  value: GlazeGroupingMode;
  onChange: (value: GlazeGroupingMode) => void;
}) {
  return (
    <fieldset className="border border-border/80 bg-panel p-3 sm:p-4">
      <legend className="sr-only">Glaze viewing mode</legend>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">View glazes as</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
            Choose one layout to keep the studio library easy to scan
          </p>
        </div>
        {value !== "none" ? (
          <button
            type="button"
            onClick={() => onChange("none")}
            className="text-[10px] uppercase tracking-[0.16em] text-muted underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Clear grouping
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <label
          className={cn(
            "flex min-h-14 cursor-pointer items-start gap-2 border px-2.5 py-2.5 transition-colors sm:px-3",
            value === "none"
              ? "border-foreground bg-white"
              : "border-border bg-background hover:border-foreground/25 hover:bg-white",
          )}
        >
          <input
            type="checkbox"
            checked={value === "none"}
            onChange={() => onChange("none")}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
              value === "none" ? "border-foreground bg-foreground text-white" : "border-border",
            )}
          >
            {value === "none" ? <Check className="h-3 w-3" /> : null}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">Compact grid</span>
            <span className="mt-0.5 block text-[10px] leading-4 text-muted">No sections</span>
          </span>
        </label>

        {GROUPING_OPTIONS.map((option) => {
          const checked = value === option.mode;

          return (
            <label
              key={option.mode}
              className={cn(
                "flex min-h-14 cursor-pointer items-start gap-2 border px-2.5 py-2.5 transition-colors sm:px-3",
                checked
                  ? "border-foreground bg-white"
                  : "border-border bg-background hover:border-foreground/25 hover:bg-white",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? "none" : option.mode)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                  checked ? "border-foreground bg-foreground text-white" : "border-border",
                )}
              >
                {checked ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                <span className="mt-0.5 block text-[10px] leading-4 text-muted">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
