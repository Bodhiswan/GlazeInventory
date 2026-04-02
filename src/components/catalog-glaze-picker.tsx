"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Glaze } from "@/lib/types";

type CatalogGlazePickerProps = {
  disabled?: boolean;
  glazes: Glaze[];
};

export function CatalogGlazePicker({ disabled, glazes }: CatalogGlazePickerProps) {
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedGlazeId, setSelectedGlazeId] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const brands = Array.from(new Set(glazes.map((glaze) => glaze.brand).filter(Boolean) as string[])).sort(
    (left, right) => left.localeCompare(right),
  );

  const filteredGlazes = glazes.filter((glaze) => {
    const brandMatches = brand === "all" || glaze.brand === brand;

    if (!brandMatches) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      glaze.brand,
      glaze.line,
      glaze.code,
      glaze.name,
      glaze.cone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const visibleGlazes = filteredGlazes.slice(0, 60);
  const selectedGlaze = glazes.find((glaze) => glaze.id === selectedGlazeId) ?? null;

  return (
    <div className="grid gap-4">
      <input type="hidden" name="glazeId" value={selectedGlazeId} />
      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <label className="grid gap-2 text-sm font-medium">
          Step 1: choose a brand
          <Select value={brand} onChange={(event) => setBrand(event.target.value)} disabled={disabled}>
            <option value="all">All brands</option>
            {brands.map((brandOption) => (
              <option key={brandOption} value={brandOption}>
                {brandOption}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Step 2: search by glaze number or name
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try PC-47, 1102, MBG181, Sea Salt, Emerald Falls..."
            disabled={disabled}
          />
        </label>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Step 3: pick the exact glaze</span>
          <Badge tone="neutral">
            {filteredGlazes.length} match{filteredGlazes.length === 1 ? "" : "es"}
          </Badge>
          {filteredGlazes.length > visibleGlazes.length ? (
            <span>Showing the first {visibleGlazes.length} results. Narrow the search to see fewer.</span>
          ) : null}
        </div>

        <div className="max-h-[360px] overflow-y-auto border border-border bg-panel p-2">
          {visibleGlazes.length ? (
            <div className="grid gap-2">
              {visibleGlazes.map((glaze) => {
                const selected = glaze.id === selectedGlazeId;

                return (
                  <button
                    key={glaze.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedGlazeId(glaze.id)}
                    className={cn(
                      "grid grid-cols-[84px_1fr] items-start gap-4 border px-4 py-3 text-left transition",
                      selected
                        ? "border-foreground bg-[#2d1c16] text-white"
                        : "border-border bg-panel text-foreground hover:border-foreground/20 hover:bg-white",
                      disabled ? "cursor-not-allowed opacity-60" : "",
                    )}
                  >
                    <div className="overflow-hidden border border-border/70 bg-panel">
                      {glaze.imageUrl ? (
                        <img
                          src={glaze.imageUrl}
                          alt={`${glaze.brand ?? "Commercial"} ${glaze.name}`}
                          className="h-[84px] w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-[84px] items-center justify-center px-3 text-center text-[11px] uppercase tracking-[0.2em]",
                            selected ? "text-white/75" : "text-muted",
                          )}
                        >
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {[glaze.brand, glaze.line].filter(Boolean).join(" · ")}
                      </p>
                      <p className={cn("mt-1 text-sm", selected ? "text-white/85" : "text-muted")}>
                        {[glaze.code, glaze.name, glaze.cone].filter(Boolean).join(" · ")}
                      </p>
                      {glaze.description ? (
                        <p className={cn("mt-2 line-clamp-2 text-sm leading-6", selected ? "text-white/70" : "text-muted")}>
                          {glaze.description}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-muted">
              No glazes match this filter yet. Try a different brand or a shorter search.
            </div>
          )}
        </div>

        <div className="border border-border bg-panel px-4 py-4 text-sm text-muted">
          {selectedGlaze
            ? (
              <div className="grid gap-4 md:grid-cols-[112px_1fr]">
                <div className="overflow-hidden border border-border bg-panel">
                  {selectedGlaze.imageUrl ? (
                    <img
                      src={selectedGlaze.imageUrl}
                      alt={`${selectedGlaze.brand ?? "Commercial"} ${selectedGlaze.name}`}
                      className="h-[112px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[112px] items-center justify-center px-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {`Selected: ${[selectedGlaze.brand, selectedGlaze.line, selectedGlaze.code, selectedGlaze.name].filter(Boolean).join(" · ")}`}
                  </p>
                  {selectedGlaze.description ? (
                    <p className="mt-2 leading-6 text-muted">{selectedGlaze.description}</p>
                  ) : null}
                  <div className="mt-3">
                    <Link href={`/glazes/${selectedGlaze.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Open glaze page
                    </Link>
                  </div>
                </div>
              </div>
            )
            : "No glaze selected yet."}
        </div>
      </div>
    </div>
  );
}
