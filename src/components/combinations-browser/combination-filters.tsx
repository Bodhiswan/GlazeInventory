"use client";

import { memo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { toggleValue } from "./combination-utils";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import type { CombinationsView } from "./use-combinations-browser";

/* ---------------------------------------------------------------------------
 * FilterTile
 * ------------------------------------------------------------------------ */

const FilterTile = memo(function FilterTile({
  value,
  checked,
  onToggle,
  count,
  countLabel,
}: {
  value: string;
  checked: boolean;
  onToggle: (value: string) => void;
  count?: number;
  countLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onToggle(value)}
      className={cn(
        "grid min-h-[76px] content-between gap-3 border px-3 py-3 text-left transition-colors",
        checked
          ? "border-foreground bg-white text-foreground"
          : "border-border bg-background hover:border-foreground/25 hover:bg-white",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center border text-[10px] uppercase tracking-[0.14em] transition-colors",
            checked
              ? "border-foreground bg-foreground text-white"
              : "border-border bg-panel text-transparent",
          )}
          aria-hidden="true"
        >
          x
        </span>
        <span className="text-sm font-medium leading-5">{value}</span>
      </span>
      <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-muted">
        <span>{countLabel ?? (count !== undefined ? `${count} combinations` : "Toggle")}</span>
        <span className={checked ? "text-foreground" : ""}>{checked ? "Selected" : "Add"}</span>
      </span>
    </button>
  );
});

/* ---------------------------------------------------------------------------
 * FilterSection
 * ------------------------------------------------------------------------ */

function FilterSection({
  title,
  optionCount,
  selectedCount,
  open,
  onToggle,
  children,
}: {
  title: string;
  optionCount: number;
  selectedCount: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-background">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white"
        aria-expanded={open}
      >
        <span className="space-y-1">
          <span className="block text-sm font-medium text-foreground">{title}</span>
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
            {optionCount} option{optionCount === 1 ? "" : "s"}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {selectedCount ? <Badge tone="neutral">{selectedCount} selected</Badge> : null}
          <ChevronDown
            className={cn("h-4 w-4 text-muted transition-transform", open ? "rotate-180" : "")}
          />
        </span>
      </button>
      {open ? <div className="border-t border-border p-3 sm:p-4">{children}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * CombinationFilters props
 * ------------------------------------------------------------------------ */

export interface CombinationFiltersProps {
  query: string;
  setQuery: (value: string) => void;
  query2: string;
  setQuery2: (value: string) => void;
  view: CombinationsView;
  setView: (value: CombinationsView) => void;
  viewFilters: { key: CombinationsView; label: string; count: number }[];
  viewLabel: string;
  brandFilters: string[];
  setBrandFilters: (updater: (current: string[]) => string[]) => void;
  brandOptions: string[];
  brandOptionCounts: Map<string, number>;
  showCone5: boolean;
  setShowCone5: (value: boolean) => void;
  showCone6: boolean;
  setShowCone6: (value: boolean) => void;
  showCone10: boolean;
  setShowCone10: (value: boolean) => void;
  filtersOpen: boolean;
  setFiltersOpen: (updater: (current: boolean) => boolean) => void;
  openFilterSections: Record<string, boolean>;
  setOpenFilterSections: (updater: (current: Record<string, boolean>) => Record<string, boolean>) => void;
  activeTilesLength: number;
  hasFilters: boolean;
  resetFilters: () => void;
  INITIAL_TILE_BATCH: number;
  setVisibleCount: Dispatch<SetStateAction<number>>;
}

/* ---------------------------------------------------------------------------
 * CombinationFilters
 * ------------------------------------------------------------------------ */

export function CombinationFilters({
  query,
  setQuery,
  query2,
  setQuery2,
  view,
  setView,
  viewFilters,
  viewLabel,
  brandFilters,
  setBrandFilters,
  brandOptions,
  brandOptionCounts,
  showCone5,
  setShowCone5,
  showCone6,
  setShowCone6,
  showCone10,
  setShowCone10,
  filtersOpen,
  setFiltersOpen,
  openFilterSections,
  setOpenFilterSections,
  activeTilesLength,
  hasFilters,
  resetFilters,
  INITIAL_TILE_BATCH,
  setVisibleCount,
}: CombinationFiltersProps) {
  return (
    <Panel className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-3 sm:px-4 sm:py-4">
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a glaze, code, or keyword"
            className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
          />
          {query.trim() ? (
            <button type="button" onClick={() => setQuery("")} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-3 sm:px-4 sm:py-4">
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={query2}
            onChange={(event) => setQuery2(event.target.value)}
            placeholder="And another glaze to narrow down"
            className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
          />
          {query2.trim() ? (
            <button type="button" onClick={() => setQuery2("")} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Library-style single full-width filter button */}
      <div className="overflow-hidden border border-border/80 bg-panel">
        <button
          type="button"
          onClick={() => setFiltersOpen((c) => !c)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/55"
          aria-expanded={filtersOpen}
        >
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">Filters</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
              Expand sections by view, brand, and cone
            </span>
          </span>
          <span className="flex items-center gap-2">
            {hasFilters ? <Badge tone="neutral">Active</Badge> : null}
            <ChevronDown
              className={cn("h-4 w-4 text-muted transition-transform", filtersOpen ? "rotate-180" : "")}
            />
          </span>
        </button>

        {filtersOpen ? (
          <div className="grid gap-3 border-t border-border px-3 py-3 sm:px-4 sm:py-4">
            <FilterSection
              title="View"
              optionCount={viewFilters.length}
              selectedCount={view !== "all" ? 1 : 0}
              open={openFilterSections.view ?? true}
              onToggle={() => setOpenFilterSections((c) => ({ ...c, view: !(c.view ?? true) }))}
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {viewFilters.map((filter) => (
                  <FilterTile
                    key={filter.key}
                    value={filter.label}
                    count={filter.count}
                    checked={view === filter.key}
                    onToggle={() => {
                      setView(view === filter.key ? "all" : filter.key);
                      setVisibleCount(INITIAL_TILE_BATCH);
                    }}
                  />
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Brands"
              optionCount={brandOptions.length}
              selectedCount={brandFilters.length}
              open={openFilterSections.brands ?? false}
              onToggle={() => setOpenFilterSections((c) => ({ ...c, brands: !(c.brands ?? false) }))}
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {brandOptions.map((option) => (
                  <FilterTile
                    key={option}
                    value={option}
                    count={brandOptionCounts.get(option)}
                    checked={brandFilters.includes(option)}
                    onToggle={(value) => {
                      setBrandFilters((current) => toggleValue(current, value));
                      setVisibleCount(INITIAL_TILE_BATCH);
                    }}
                  />
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Cone"
              optionCount={3}
              selectedCount={[showCone5, showCone6, showCone10].filter((v) => !v).length === 0 ? 0 : [showCone5, showCone6, showCone10].filter(Boolean).length}
              open={openFilterSections.cone ?? false}
              onToggle={() => setOpenFilterSections((c) => ({ ...c, cone: !(c.cone ?? false) }))}
            >
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={showCone5} onChange={(e) => setShowCone5(e.target.checked)} className="accent-foreground" />
                  Cone 5
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={showCone6} onChange={(e) => setShowCone6(e.target.checked)} className="accent-foreground" />
                  Cone 6
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={showCone10} onChange={(e) => setShowCone10(e.target.checked)} className="accent-foreground" />
                  Cone 10
                </label>
              </div>
            </FilterSection>

            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Active filter summary chips */}
      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {view !== "all" ? (
            <button
              type="button"
              onClick={() => { setView("all"); setVisibleCount(INITIAL_TILE_BATCH); }}
              className="flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground transition hover:bg-foreground/[0.04]"
            >
              {viewLabel}
              <X className="h-3 w-3 text-muted" />
            </button>
          ) : null}
          {brandFilters.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => {
                setBrandFilters((current) => current.filter((b) => b !== brand));
                setVisibleCount(INITIAL_TILE_BATCH);
              }}
              className="flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground transition hover:bg-foreground/[0.04]"
            >
              {brand}
              <X className="h-3 w-3 text-muted" />
            </button>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
