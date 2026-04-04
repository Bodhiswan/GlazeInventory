"use client";

import { Camera, Loader2, Check, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { setGlazeInventoryStateAction } from "@/app/actions";
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

/** Score a glaze against OCR tokens — higher = better match */
function scoreGlazeMatch(glaze: Glaze, tokens: string[]): number {
  const searchIndex = buildGlazeSearchIndex([
    glaze.brand,
    glaze.code,
    glaze.name,
    glaze.line,
  ]);

  let score = 0;

  for (const token of tokens) {
    if (!token || token.length < 2) continue;

    if (matchesGlazeSearch(searchIndex, token)) {
      score += token.length;

      const normCode = (glaze.code ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const normToken = token.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normCode && normCode === normToken) {
        score += 50;
      }

      const normBrand = (glaze.brand ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normBrand && normBrand === normToken) {
        score += 20;
      }
    }
  }

  return score;
}

/** Extract meaningful tokens from OCR text */
function extractSearchTokens(ocrText: string): string[] {
  const raw = ocrText
    .replace(/[^a-zA-Z0-9\-\/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const words = raw.split(" ").filter((w) => w.length >= 2);

  const compounds: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    compounds.push(`${words[i]}-${words[i + 1]}`);
    compounds.push(`${words[i]}${words[i + 1]}`);
  }

  return [...words, ...compounds];
}

/**
 * Pre-process image for better OCR: convert to high-contrast grayscale
 * with adaptive thresholding to handle colorful labels.
 */
function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;

      // Pass 1: find min/max luminance for adaptive stretch
      let minL = 255;
      let maxL = 0;
      for (let i = 0; i < d.length; i += 4) {
        const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        if (gray < minL) minL = gray;
        if (gray > maxL) maxL = gray;
      }

      const range = maxL - minL || 1;

      // Pass 2: adaptive contrast stretch + binarize
      for (let i = 0; i < d.length; i += 4) {
        let gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        // Stretch to full 0-255 range
        gray = ((gray - minL) / range) * 255;
        // Sharpen: push toward black or white
        gray = gray < 140 ? 0 : 255;
        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Match row — shared by OCR and manual search results */
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
  const [ocrMatches, setOcrMatches] = useState<ScoredMatch[]>([]);
  const [ocrText, setOcrText] = useState<string>("");
  const [ocrRunning, setOcrRunning] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
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

  const runOcr = useCallback(async (imageData: string) => {
    setOcrRunning(true);
    setOcrText("");
    setOcrMatches([]);
    setAddError(null);

    try {
      const processed = await preprocessImage(imageData);

      const Tesseract = await import("tesseract.js");

      // Try both the processed and original image, take whichever gets more matches
      const [processedResult, originalResult] = await Promise.all([
        Tesseract.recognize(processed, "eng", { logger: () => {} }),
        Tesseract.recognize(imageData, "eng", { logger: () => {} }),
      ]);

      const processedText = processedResult.data.text;
      const originalText = originalResult.data.text;

      // Score both and keep whichever set has better top match
      function scoreAll(text: string) {
        const tokens = extractSearchTokens(text);
        if (!tokens.length) return { text, matches: [] as ScoredMatch[] };

        const scored = catalogGlazes
          .map((glaze) => ({
            glaze: glaze as Glaze,
            score: scoreGlazeMatch(glaze as Glaze, tokens),
            imageUrl: glaze.imageUrl,
          }))
          .filter((m) => m.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        return { text, matches: scored };
      }

      const pResult = scoreAll(processedText);
      const oResult = scoreAll(originalText);

      // Pick whichever produced a higher top score
      const best = (pResult.matches[0]?.score ?? 0) >= (oResult.matches[0]?.score ?? 0)
        ? pResult
        : oResult;

      setOcrText(best.text);
      setOcrMatches(best.matches);

      // If OCR found something, auto-populate the search with the best guess
      if (!best.matches.length && originalText.trim()) {
        // Extract the most promising code-like token for the search box
        const codeMatch = originalText.match(/[A-Z]{1,4}[\s-]*\d{2,4}/i);
        if (codeMatch) {
          setManualQuery(codeMatch[0].trim());
        }
      }
    } catch {
      setOcrText("Could not read the label. Search manually below.");
    } finally {
      setOcrRunning(false);
    }
  }, [catalogGlazes]);

  const handleCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      void runOcr(reader.result as string);
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  }, [runOcr]);

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
  const activeResults = manualQuery.trim().length >= 2 ? manualResults : ocrMatches;
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
          disabled={ocrRunning}
          onClick={() => fileInputRef.current?.click()}
          className={buttonVariants({ variant: "ghost", className: "shrink-0 gap-2 px-3" })}
          title="Scan a label with your camera"
        >
          {ocrRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {ocrRunning ? "Reading..." : "Scan"}
          </span>
        </button>
      </div>

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
      ) : manualQuery.trim().length >= 2 ? (
        <p className="py-3 text-center text-xs text-muted">No glazes match "{manualQuery}"</p>
      ) : ocrMatches.length === 0 && ocrText ? (
        <p className="py-3 text-center text-xs text-muted">
          No matches from scan. Type a code or name above to search.
        </p>
      ) : null}

      {addError ? (
        <p className="text-xs text-[#7f4026]">{addError}</p>
      ) : null}

      {/* OCR debug — collapsed */}
      {ocrText ? (
        <details className="border border-border bg-panel px-3 py-2">
          <summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.16em] text-muted">
            Text read from label
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{ocrText}</p>
        </details>
      ) : null}
    </div>
  );
}
