"use client";

import { Camera, Loader2, RotateCcw, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { setGlazeInventoryStateAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { Glaze } from "@/lib/types";
import { buildGlazeSearchIndex, formatGlazeLabel, matchesGlazeSearch } from "@/lib/utils";

type ScanPhase = "ready" | "processing" | "results";

interface ScoredMatch {
  glaze: Glaze;
  score: number;
  imageUrl: string | null;
}

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

export function GlazeScanner({
  catalogGlazes,
}: {
  catalogGlazes: Array<{ id: string; brand: string | null; code: string | null; name: string; line: string | null; imageUrl: string | null }>;
}) {
  const [phase, setPhase] = useState<ScanPhase>("ready");
  const [ocrText, setOcrText] = useState<string>("");
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open camera on mount
  useEffect(() => {
    // Small delay so the DOM is ready (mobile browsers need this)
    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const runOcr = useCallback(async (imageData: string) => {
    setPhase("processing");
    setOcrText("");
    setMatches([]);
    setAddError(null);

    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(imageData, "eng", {
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
      setOcrText("Could not read text from image. Try a clearer photo of the label.");
      setMatches([]);
      setPhase("results");
    }
  }, [catalogGlazes]);

  // Capture → auto-run OCR (no preview step)
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

  // Tap match → add immediately
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

      {/* ── RESULTS: Tap to add ── */}
      {phase === "results" ? (
        <div className="space-y-3">
          {matches.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Tap to add to your inventory
              </p>
              <div className="grid gap-2">
                {matches.map((match) => {
                  const isAdded = addedIds.has(match.glaze.id);
                  const isPending = pendingId === match.glaze.id;

                  return (
                    <button
                      key={match.glaze.id}
                      type="button"
                      disabled={isAdded || isPending}
                      onClick={() => { void handleAddGlaze(match); }}
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
                      ) : (
                        <Badge tone="neutral">{Math.round(match.score)}</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border bg-panel px-4 py-6 text-center">
              <p className="text-sm font-semibold text-foreground">No matching glazes found</p>
              <p className="mt-1 text-xs text-muted">
                Try a clearer photo with the glaze code visible.
              </p>
            </div>
          )}

          {addError ? (
            <p className="text-xs text-[#7f4026]">{addError}</p>
          ) : null}

          {/* OCR debug — collapsed */}
          <details className="border border-border bg-panel px-3 py-2">
            <summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.16em] text-muted">
              Text read from label
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{ocrText || "No text detected"}</p>
          </details>

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
