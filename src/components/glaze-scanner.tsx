"use client";

import { Camera, Loader2, Check, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { recognizeGlazeLabelAction, setGlazeInventoryStateAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

/** Score a glaze against vision result fields */
function scoreVisionMatch(
  glaze: CatalogEntry,
  vision: { brand: string | null; code: string | null; name: string | null; line: string | null },
): number {
  let score = 0;

  const norm = (s: string | null) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Exact code match is the strongest signal
  if (vision.code && norm(glaze.code) && norm(glaze.code) === norm(vision.code)) {
    score += 100;
  }

  // Brand match
  if (vision.brand && norm(glaze.brand) && norm(glaze.brand) === norm(vision.brand)) {
    score += 30;
  }

  // Name match (fuzzy — check if vision name is contained or vice versa)
  if (vision.name && glaze.name) {
    const vName = norm(vision.name);
    const gName = norm(glaze.name);
    if (vName && gName) {
      if (gName === vName) {
        score += 40;
      } else if (gName.includes(vName) || vName.includes(gName)) {
        score += 20;
      }
    }
  }

  // Line match
  if (vision.line && glaze.line) {
    const vLine = norm(vision.line);
    const gLine = norm(glaze.line);
    if (vLine && gLine && (gLine === vLine || gLine.includes(vLine) || vLine.includes(gLine))) {
      score += 15;
    }
  }

  return score;
}

/** Match row — shared by vision and manual search results */
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
  const [visionMatches, setVisionMatches] = useState<ScoredMatch[]>([]);
  const [visionLabel, setVisionLabel] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Extract base64 and mime type
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return;

      const [, mimeType, imageBase64] = match;

      setScanning(true);
      setScanError(null);
      setVisionMatches([]);
      setVisionLabel("");

      const result = await recognizeGlazeLabelAction({ imageBase64, mimeType });

      if (!result.success) {
        setScanError(result.error ?? "Could not read the label.");
        setScanning(false);
        return;
      }

      // Build a label string for display
      const parts = [result.brand, result.code, result.name].filter(Boolean);
      setVisionLabel(parts.join(" · ") || "Could not read label");

      // If we got a code, pre-fill the search box
      if (result.code) {
        setManualQuery(result.code);
      }

      // Score all catalog glazes against the vision result
      const scored = catalogGlazes
        .map((g) => ({
          glaze: g as Glaze,
          score: scoreVisionMatch(g, result),
          imageUrl: g.imageUrl,
        }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      setVisionMatches(scored);
      setScanning(false);
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  }, [catalogGlazes]);

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

  // Which results to show — manual search takes priority when typing
  const activeResults = manualQuery.trim().length >= 2 ? manualResults : visionMatches;
  const showingManual = manualQuery.trim().length >= 2;

  return (
    <div className="space-y-3">
      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
        aria-hidden="true"
      />

      {/* Search + scan in one row */}
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3 border border-foreground/14 bg-white px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={searchInputRef}
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Type code or name (e.g. CG-718)"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60"
          />
        </div>
        <button
          type="button"
          disabled={scanning}
          onClick={() => fileInputRef.current?.click()}
          className={buttonVariants({ variant: "ghost", className: "shrink-0 gap-2 px-3" })}
          title="Scan a label with your camera"
        >
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {scanning ? "Reading..." : "Scan"}
          </span>
        </button>
      </div>

      {/* Scanning state */}
      {scanning ? (
        <div className="flex items-center justify-center gap-3 border border-border bg-panel px-4 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
          <p className="text-sm text-muted">Reading glaze label...</p>
        </div>
      ) : null}

      {/* Vision read result label */}
      {visionLabel && !scanning ? (
        <p className="text-xs text-muted">
          Read from label: <strong className="text-foreground">{visionLabel}</strong>
        </p>
      ) : null}

      {/* Scan error */}
      {scanError ? (
        <p className="text-xs text-[#7f4026]">{scanError}</p>
      ) : null}

      {/* Results list */}
      {activeResults.length ? (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">
            {showingManual ? "Search results" : "Matches from label"} — tap to add
          </p>
          <div className="grid gap-2">
            {activeResults.map((match) => (
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
      ) : !scanning && manualQuery.trim().length >= 2 ? (
        <p className="py-3 text-center text-xs text-muted">No glazes match "{manualQuery}"</p>
      ) : !scanning && visionMatches.length === 0 && visionLabel ? (
        <p className="py-3 text-center text-xs text-muted">
          No catalog match found. Try typing the code above.
        </p>
      ) : null}

      {addError ? (
        <p className="text-xs text-[#7f4026]">{addError}</p>
      ) : null}
    </div>
  );
}
