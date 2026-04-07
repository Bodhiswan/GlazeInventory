"use client";

import { Check, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { setGlazeInventoryStateAction } from "@/app/actions/inventory";
import { Badge } from "@/components/ui/badge";
import type { Glaze } from "@/lib/types";
import { buildGlazeSearchIndex, formatGlazeLabel, matchesGlazeSearch } from "@/lib/utils";

interface ScoredMatch {
  glaze: Glaze;
  score: number;
  imageUrl: string | null;
}

type CatalogEntry = {
  id: string;
  brand: string | null;
  code: string | null;
  name: string;
  line: string | null;
  imageUrl: string | null;
};

/** Match row — shared by search results */
function MatchRow({
  match,
  isAdded,
  isPending,
  onAdd,
}: {
  match: ScoredMatch;
  isAdded: boolean;
  isPending: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      disabled={isAdded || isPending}
      onClick={onAdd}
      className={`flex items-center gap-3 border px-3 py-3 text-left transition-colors ${
        isAdded
          ? "border-foreground/20 bg-foreground/[0.04]"
          : "border-border bg-white hover:border-foreground/30 hover:bg-panel/50"
      }`}
    >
      <div className="w-12 shrink-0 overflow-hidden border border-border bg-panel">
        {match.imageUrl ? (
          <img
            src={match.imageUrl}
            alt={formatGlazeLabel(match.glaze)}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-[7px] uppercase tracking-[0.14em] text-muted">
            No img
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
          {match.glaze.brand} {match.glaze.code}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">
          {match.glaze.name}
        </p>
        {match.glaze.line ? (
          <p className="truncate text-xs text-muted">{match.glaze.line}</p>
        ) : null}
      </div>
      {isPending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
      ) : isAdded ? (
        <Badge tone="neutral">
          <Check className="mr-1 inline h-3 w-3" />
          Added
        </Badge>
      ) : null}
    </button>
  );
}

export function GlazeScanner({
  catalogGlazes,
}: {
  catalogGlazes: CatalogEntry[];
}) {
  const [manualQuery, setManualQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Build search indexes once
  const searchIndexes = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of catalogGlazes) {
      map.set(g.id, buildGlazeSearchIndex([g.brand, g.code, g.name, g.line]));
    }
    return map;
  }, [catalogGlazes]);

  // Manual search results
  const manualResults = useMemo(() => {
    const q = manualQuery.trim();
    if (q.length < 2) return [];

    return catalogGlazes
      .filter((g) => {
        const idx = searchIndexes.get(g.id) ?? "";
        return matchesGlazeSearch(idx, q);
      })
      .slice(0, 8)
      .map((g) => ({
        glaze: g as Glaze,
        score: 0,
        imageUrl: g.imageUrl,
      }));
  }, [manualQuery, catalogGlazes, searchIndexes]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleAddGlaze = useCallback(async (match: ScoredMatch) => {
    if (addedIds.has(match.glaze.id) || pendingId) return;

    setPendingId(match.glaze.id);
    setAddError(null);

    const result = await setGlazeInventoryStateAction({
      glazeId: match.glaze.id,
      status: "owned",
    });

    if (!result.success) {
      setAddError(result.message);
      setPendingId(null);
      return;
    }

    setPendingId(null);
    setAddedIds((prev) => new Set(prev).add(match.glaze.id));
  }, [addedIds, pendingId]);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex min-w-0 items-center gap-3 border border-foreground/14 bg-white px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          ref={searchInputRef}
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          placeholder="Type code or name (e.g. CG-718)"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60"
        />
      </div>

      {/* Results list */}
      {manualResults.length ? (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">
            Search results — tap to add
          </p>
          <div className="grid gap-2">
            {manualResults.map((match) => (
              <MatchRow
                key={match.glaze.id}
                match={match}
                isAdded={addedIds.has(match.glaze.id)}
                isPending={pendingId === match.glaze.id}
                onAdd={() => { void handleAddGlaze(match); }}
              />
            ))}
          </div>
        </div>
      ) : manualQuery.trim().length >= 2 ? (
        <p className="py-3 text-center text-xs text-muted">No glazes match &ldquo;{manualQuery}&rdquo;</p>
      ) : null}

      {addError ? (
        <p className="text-xs text-[#7f4026]">{addError}</p>
      ) : null}
    </div>
  );
}
