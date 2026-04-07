"use client";

import { ChevronDown, X } from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, getColorSwatch } from "@/lib/utils";

type FilterSectionKey = "brands" | "families" | "colors" | "finishes" | "cones";

const FilterTile = memo(function FilterTile({
  value,
  checked,
  onToggle,
  swatch,
  count,
  countLabel,
}: {
  value: string;
  checked: boolean;
  onToggle: (value: string) => void;
  swatch?: string;
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
        {swatch ? (
          <span
            className="h-3 w-3 rounded-full border border-black/10 sm:h-3.5 sm:w-3.5"
            style={{ backgroundColor: swatch }}
            aria-hidden="true"
          />
        ) : null}
        <span className="text-sm font-medium leading-5">{value}</span>
      </span>
      <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-muted">
        <span>{countLabel ?? (count ? `${count} glazes` : "Toggle")}</span>
        <span className={checked ? "text-foreground" : ""}>{checked ? "Selected" : "Add"}</span>
      </span>
    </button>
  );
});

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

function toggleValue(values: string[], target: string) {
  return values.includes(target) ? values.filter((value) => value !== target) : [...values, target];
}

function FilterSelectionSummary({
  values,
  onRemove,
}: {
  values: string[];
  onRemove: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onRemove(value)}
          className="inline-flex items-center gap-2 border border-foreground/20 bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-foreground transition-colors hover:border-foreground/35"
        >
          <span>{value}</span>
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

function toggleFilterSection(
  current: Record<FilterSectionKey, boolean>,
  section: FilterSectionKey,
) {
  return {
    ...current,
    [section]: !current[section],
  };
}

export function GlazeFilters({
  // Filter values
  brandFilters,
  setBrandFilters,
  familyFilters,
  setFamilyFilters,
  colorFilters,
  setColorFilters,
  finishFilters,
  setFinishFilters,
  coneFilters,
  setConeFilters,
  // Panel open state
  filtersOpen,
  setFiltersOpen,
  openFilterSections,
  setOpenFilterSections,
  // Options
  brandOptions,
  familyOptions,
  colorOptions,
  finishOptions,
  coneOptions,
  brandOptionCounts,
  familyOptionCounts,
  colorOptionCounts,
  finishOptionCounts,
  coneOptionCounts,
  currentBrandCounts,
  // Filter summary
  selectedFilterCount,
  selectedFilterLabels,
  hasActiveQuery,
  hasFilters,
  sortedGlazesLength,
  displayGlazesLength,
  visibleGlazeCount,
  remainingGlazeCount,
  // Callbacks
  onVisibleCountReset,
  onShowMore,
  onShowAll,
  onClearFilters,
  GLAZE_BATCH_STEP,
}: {
  brandFilters: string[];
  setBrandFilters: React.Dispatch<React.SetStateAction<string[]>>;
  familyFilters: string[];
  setFamilyFilters: React.Dispatch<React.SetStateAction<string[]>>;
  colorFilters: string[];
  setColorFilters: React.Dispatch<React.SetStateAction<string[]>>;
  finishFilters: string[];
  setFinishFilters: React.Dispatch<React.SetStateAction<string[]>>;
  coneFilters: string[];
  setConeFilters: React.Dispatch<React.SetStateAction<string[]>>;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openFilterSections: Record<FilterSectionKey, boolean>;
  setOpenFilterSections: React.Dispatch<React.SetStateAction<Record<FilterSectionKey, boolean>>>;
  brandOptions: string[];
  familyOptions: string[];
  colorOptions: string[];
  finishOptions: string[];
  coneOptions: string[];
  brandOptionCounts: Map<string, number>;
  familyOptionCounts: Map<string, number>;
  colorOptionCounts: Map<string, number>;
  finishOptionCounts: Map<string, number>;
  coneOptionCounts: Map<string, number>;
  currentBrandCounts: Map<string, number>;
  selectedFilterCount: number;
  selectedFilterLabels: string[];
  hasActiveQuery: boolean;
  hasFilters: boolean;
  sortedGlazesLength: number;
  displayGlazesLength: number;
  visibleGlazeCount: number;
  remainingGlazeCount: number;
  onVisibleCountReset: () => void;
  onShowMore: () => void;
  onShowAll: () => void;
  onClearFilters: () => void;
  GLAZE_BATCH_STEP: number;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-border/80 bg-panel">
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/55"
          aria-expanded={filtersOpen}
        >
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">Filters</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
              Expand sections by brand, family, color, finish, and cone
            </span>
          </span>
          <span className="flex items-center gap-2">
            {selectedFilterCount ? <Badge tone="neutral">{selectedFilterCount} selected</Badge> : null}
            <ChevronDown
              className={cn("h-4 w-4 text-muted transition-transform", filtersOpen ? "rotate-180" : "")}
            />
          </span>
        </button>

        {filtersOpen ? (
          <div className="grid gap-3 border-t border-border px-3 py-3 sm:px-4 sm:py-4">
            <FilterSection
              title="Brands"
              optionCount={brandOptions.length}
              selectedCount={brandFilters.length}
              open={openFilterSections.brands}
              onToggle={() =>
                setOpenFilterSections((current) => toggleFilterSection(current, "brands"))
              }
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {brandOptions.map((option) => {
                  const totalCount = brandOptionCounts.get(option) ?? 0;
                  const matchingCount = currentBrandCounts.get(option) ?? 0;
                  const countLabel =
                    matchingCount !== totalCount
                      ? `${matchingCount} matching · ${totalCount} total`
                      : `${totalCount} glazes`;

                  return (
                    <FilterTile
                      key={option}
                      value={option}
                      count={totalCount}
                      countLabel={countLabel}
                      checked={brandFilters.includes(option)}
                      onToggle={(value) => {
                        setBrandFilters((current) => toggleValue(current, value));
                        onVisibleCountReset();
                      }}
                    />
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection
              title="Shared families"
              optionCount={familyOptions.length}
              selectedCount={familyFilters.length}
              open={openFilterSections.families}
              onToggle={() =>
                setOpenFilterSections((current) => toggleFilterSection(current, "families"))
              }
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {familyOptions.map((option) => (
                  <FilterTile
                    key={option}
                    value={option}
                    count={familyOptionCounts.get(option)}
                    checked={familyFilters.includes(option)}
                    onToggle={(value) => {
                      setFamilyFilters((current) => toggleValue(current, value));
                      onVisibleCountReset();
                    }}
                  />
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Colors"
              optionCount={colorOptions.length}
              selectedCount={colorFilters.length}
              open={openFilterSections.colors}
              onToggle={() =>
                setOpenFilterSections((current) => toggleFilterSection(current, "colors"))
              }
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {colorOptions.map((option) => (
                  <FilterTile
                    key={option}
                    value={option}
                    count={colorOptionCounts.get(option)}
                    checked={colorFilters.includes(option)}
                    swatch={getColorSwatch(option)}
                    onToggle={(value) => {
                      setColorFilters((current) => toggleValue(current, value));
                      onVisibleCountReset();
                    }}
                  />
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Finishes"
              optionCount={finishOptions.length}
              selectedCount={finishFilters.length}
              open={openFilterSections.finishes}
              onToggle={() =>
                setOpenFilterSections((current) => toggleFilterSection(current, "finishes"))
              }
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {finishOptions.map((option) => (
                  <FilterTile
                    key={option}
                    value={option}
                    count={finishOptionCounts.get(option)}
                    checked={finishFilters.includes(option)}
                    onToggle={(value) => {
                      setFinishFilters((current) => toggleValue(current, value));
                      onVisibleCountReset();
                    }}
                  />
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Cones"
              optionCount={coneOptions.length}
              selectedCount={coneFilters.length}
              open={openFilterSections.cones}
              onToggle={() =>
                setOpenFilterSections((current) => toggleFilterSection(current, "cones"))
              }
            >
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {coneOptions.map((option) => (
                  <FilterTile
                    key={option}
                    value={option}
                    count={coneOptionCounts.get(option)}
                    checked={coneFilters.includes(option)}
                    onToggle={(value) => {
                      setConeFilters((current) => toggleValue(current, value));
                      onVisibleCountReset();
                    }}
                  />
                ))}
              </div>
            </FilterSection>
          </div>
        ) : null}
      </div>

      {hasActiveQuery ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="neutral">{sortedGlazesLength} results</Badge>
          <Badge tone="neutral">
            Showing {visibleGlazeCount} of {displayGlazesLength}
          </Badge>
          {remainingGlazeCount ? (
            <>
              <button
                type="button"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                onClick={onShowMore}
              >
                Show {Math.min(GLAZE_BATCH_STEP, remainingGlazeCount)} more
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                onClick={onShowAll}
              >
                Show all {displayGlazesLength}
              </button>
            </>
          ) : null}
          {hasFilters ? (
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={onClearFilters}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {hasActiveQuery && selectedFilterLabels.length ? (
        <FilterSelectionSummary
          values={selectedFilterLabels}
          onRemove={(value) => {
            setBrandFilters((current) => current.filter((option) => option !== value));
            setFamilyFilters((current) => current.filter((option) => option !== value));
            setColorFilters((current) => current.filter((option) => option !== value));
            setFinishFilters((current) => current.filter((option) => option !== value));
            setConeFilters((current) => current.filter((option) => option !== value));
            onVisibleCountReset();
          }}
        />
      ) : null}
    </div>
  );
}
