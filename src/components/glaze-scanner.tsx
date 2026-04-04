"use client";

import { Camera, Loader2, RotateCcw, Check, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { setGlazeInventoryStateAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Glaze } from "@/lib/types";
import { buildGlazeSearchIndex, formatGlazeLabel, matchesGlazeSearch } from "@/lib/utils";

type ScanPhase = "ready" | "processing" | "results";

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
 * Pre-process image for better OCR: convert to high-contrast grayscale.
 * Colorful bottle labels with decorative fonts read much better this way.
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
      const data = imageData.data;

      // Convert to grayscale and boost contrast
      for (let i = 0; i < data.length; i += 4) {
        // Luminance-weighted grayscale
        let gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        // Boost contrast: stretch the histogram
        gray = Math.min(255, Math.max(0, (gray - 80) * 1.8));

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Match row used by both OCR and manual search results */
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
  const [phase, setPhase] = useState<ScanPhase>("ready");
  const [ocrText, setOcrText] = useState<string>("");
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [manualQuery, setManualQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-open camera on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const runOcr = useCallback(async (imageData: string) => {
    setPhase("processing");
    setOcrText("");
    setMatches([]);
    setManualQuery("");
    setAddError(null);

    try {
      // Pre-process for better read on colorful labels
      const processed = await preprocessImage(imageData);

      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(processed, "eng", {
        logger: () => {},
      });

      const text = result.data.text;
      setOcrText(text);

      const tokens = extractSearchTokens(text);

      if (!tokens.length) {
        setMatches([]);
        setPhase("results");
        return;
      }

      const scored: ScoredMatch[] = catalogGlazes
        .map((glaze) => ({
          glaze: glaze as Glaze,
          score: scoreGlazeMatch(glaze as Glaze, tokens),
          imageUrl: glaze.imageUrl,
        }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      setMatches(scored);
      setPhase("results");
    } catch {
      setOcrText("Could not read text from image. Try a clearer photo or search manually below.");
      setMatches([]);
      setPhase("results");
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

  const openCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Which results to show — manual search takes priority when typing
  const activeResults = manualQuery.trim().length >= 2 ? manualResults : matches;
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

      {/* ── READY: Waiting for photo ── */}
      {phase === "ready" ? (
        <button
          type="button"
          onClick={openCamera}
          className={buttonVariants({ variant: "ghost", className: "w-full gap-2" })}
        >
          <Camera className="h-4 w-4" />
          Take a photo of a glaze label
        </button>
      ) : null}

      {/* ── PROCESSING: Loading state ── */}
      {phase === "processing" ? (
        <div className="flex flex-col items-center gap-3 border border-border bg-panel px-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
          <p className="text-sm text-muted">Reading label...</p>
        </div>
      ) : null}

      {/* ── RESULTS: OCR matches + manual search fallback ── */}
      {phase === "results" ? (
        <div className="space-y-3">
          {/* Manual search — always available as fallback */}
          <div className="flex items-center gap-3 border border-foreground/14 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <Input
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder={matches.length ? "Not right? Search by code or name" : "Search by code or name (e.g. CG-718)"}
              className="border-0 bg-transparent px-0 text-sm shadow-none"
            />
          </div>

          {activeResults.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                {showingManual ? "Search results" : "Tap to add to your inventory"}
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
          ) : (
            <div className="border border-dashed border-border bg-panel px-4 py-6 text-center">
              <p className="text-sm font-semibold text-foreground">
                {showingManual ? "No glazes match your search" : "No matching glazes found"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {showingManual
                  ? "Try a different code or name."
                  : "Type the glaze code or name in the search box above."}
              </p>
            </div>
          )}

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

          <button
            type="button"
            onClick={openCamera}
            className={buttonVariants({ variant: "ghost", className: "w-full gap-2" })}
          >
            <RotateCcw className="h-4 w-4" />
            Scan another label
          </button>
        </div>
      ) : null}
    </div>
  );
}
