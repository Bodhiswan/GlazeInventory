"use client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CombinationsView } from "./use-combinations-browser";

export interface CombinationFiltersProps {
  query: string;
  setQuery: (value: string) => void;
  query2: string;
  setQuery2: (value: string) => void;
  view: CombinationsView;
  setView: (value: CombinationsView) => void;
  viewFilters: { key: CombinationsView; label: string; count: number }[];
  brandFilters: string[];
  setBrandFilters: (updater: (current: string[]) => string[]) => void;
  brandOptions: string[];
  showCone6: boolean;
  setShowCone6: (value: boolean) => void;
  showCone10: boolean;
  setShowCone10: (value: boolean) => void;
  hasFilters: boolean;
  resetFilters: () => void;
  hideConeFilter?: boolean;
}


export function CombinationFilters({ query, setQuery, query2, setQuery2, view, setView,
  viewFilters, brandFilters, setBrandFilters, brandOptions, showCone6, setShowCone6,
  showCone10, setShowCone10, hasFilters, resetFilters, hideConeFilter }: CombinationFiltersProps) {
  const primary = [{key: "all" as const, label: "All combinations"}, ...viewFilters.filter(f => ["possible", "saved"].includes(f.key))];
  const secondary = viewFilters.filter(f => !["possible", "saved"].includes(f.key));
  return <div className="space-y-3">
    <div className="grid gap-2 sm:grid-cols-2">
      {[{value: query, set: setQuery, label: "Search a glaze, code, or keyword"},
        {value: query2, set: setQuery2, label: "And another glaze (optional)"}].map(field =>
        <div key={field.label} className="flex items-center gap-2 border border-border bg-white px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <Input aria-label={field.label} placeholder={field.label} value={field.value}
            onChange={e => field.set(e.target.value)} className="border-0 bg-transparent px-0 shadow-none" />
        </div>)}
    </div>
    <div className="flex flex-wrap items-center gap-2" aria-label="Combination views">
      {primary.map(filter => <button key={filter.key} type="button" aria-pressed={view === filter.key}
        onClick={() => setView(filter.key)} className={cn("border px-3 py-2 text-sm", view === filter.key ? "border-foreground bg-foreground text-white" : "border-border bg-white")}>{filter.label}</button>)}
      <select aria-label="More combination views" value={secondary.some(f => f.key === view) ? view : ""}
        onChange={e => setView((e.target.value || "all") as CombinationsView)} className="min-h-10 max-w-full border border-border bg-white px-2 text-sm">
        <option value="">More views</option>
        {secondary.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <details className="relative"><summary className="cursor-pointer text-sm">Filters</summary>
        <div className="absolute left-0 top-7 z-20 grid max-h-80 w-64 gap-4 overflow-auto border border-border bg-white p-3 shadow-lg">
          {!hideConeFilter && <fieldset className="flex gap-3"><legend className="mb-2 text-sm font-medium">Firing cone</legend>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={showCone6} onChange={e => setShowCone6(e.target.checked)} className="accent-foreground" />Cone 6</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={showCone10} onChange={e => setShowCone10(e.target.checked)} className="accent-foreground" />Cone 10</label>
          </fieldset>}
          <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">Brands</legend>
            {brandOptions.map(brand => <label key={brand} className="flex gap-2 text-sm"><input type="checkbox" checked={brandFilters.includes(brand)}
              onChange={() => setBrandFilters(current => current.includes(brand) ? current.filter(b => b !== brand) : [...current, brand])} />{brand}</label>)}
          </fieldset>
        </div>
      </details>
      {hasFilters && <button type="button" onClick={resetFilters} className="text-sm underline underline-offset-4">Reset</button>}
    </div>
  </div>;
}
