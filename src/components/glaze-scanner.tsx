"use client";

import Image from "next/image";
import { Camera, Loader2, RotateCcw, X, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { setGlazeInventoryStateAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { Glaze } from "@/lib/types";
import { buildGlazeSearchIndex, formatGlazeLabel, matchesGlazeSearch, pickPreferredGlazeImage } from "@/lib/utils";

type ScanPhase = "idle" | "captured" | "processing" | "results" | "confirming" | "added";

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
      // Longer token matches are more meaningful
      score += token.length;

      // Exact code match is a strong signal
      const normCode = (glaze.code ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const normToken = token.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normCode && normCode === normToken) {
        score += 50;
      }

      // Brand match
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
  // Normalize and split
  const raw = ocrText
    .replace(/[^a-zA-Z0-9\-\/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const words = raw.split(" ").filter((w) => w.length >= 2);

  // Also try joining adjacent tokens for codes like "SW 116" → "SW-116" / "SW116"
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
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [selectedGlaze, setSelectedGlaze] = useState<ScoredMatch | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setPhase("captured");
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    event.target.value = "";
  }, []);

  const runOcr = useCallback(async () => {
    if (!capturedImage) return;

    setPhase("processing");
    setOcrText("");
    setMatches([]);

    try {
      // Dynamic import — only load Tesseract when needed (~2MB)
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(capturedImage, "eng", {
        logger: () => {}, // suppress progress logs
      });

      const text = result.data.text;
      setOcrText(text);

      // Score all catalog glazes against OCR tokens
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
  }, [capturedImage, catalogGlazes]);

  const handleConfirmAdd = useCallback(async () => {
    if (!selectedGlaze) return;

    setAddPending(true);
    setAddError(null);

    const result = await setGlazeInventoryStateAction({
      glazeId: selectedGlaze.glaze.id,
      status: "owned",
    });

    if (!result.success) {
      setAddError(result.message);
      setAddPending(false);
      return;
    }

    setAddPending(false);
    setPhase("added");
  }, [selectedGlaze]);

  const reset = useCallback(() => {
    setPhase("idle");
    setCapturedImage(null);
    setOcrText("");
    setMatches([]);
    setSelectedGlaze(null);
    setAddError(null);
    setAddPending(false);
  }, []);

  return (
    <div className="space-y-4">
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

      {/* ── IDLE: Prompt to open camera ── */}
      {phase === "idle" ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={buttonVariants({ variant: "ghost", className: "w-full gap-2" })}
        >
          <Camera className="h-4 w-4" />
          Take a photo of a glaze label
        </button>
      ) : null}

      {/* ── CAPTURED: Show preview + confirm ── */}
      {phase === "captured" && capturedImage ? (
        <div className="space-y-3">
          <div className="overflow-hidden border border-border bg-panel">
            <img
              src={capturedImage}
              alt="Captured glaze label"
              className="max-h-64 w-full object-contain bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { void runOcr(); }}
              className={buttonVariants({ variant: "primary", className: "flex-1 gap-2" })}
            >
              <Check className="h-4 w-4" />
              Read label
            </button>
            <button
              type="button"
              onClick={() => { fileInputRef.current?.click(); }}
              className={buttonVariants({ variant: "ghost", className: "gap-2" })}
            >
              <RotateCcw className="h-4 w-4" />
              Retake
            </button>
            <button
              type="button"
              onClick={reset}
              className={buttonVariants({ variant: "ghost" })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── PROCESSING: Loading state ── */}
      {phase === "processing" ? (
        <div className="flex flex-col items-center gap-3 border border-border bg-panel px-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
          <p className="text-sm text-muted">Reading label text...</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">This may take a few seconds</p>
        </div>
      ) : null}

      {/* ── RESULTS: Show matches for verification ── */}
      {phase === "results" ? (
        <div className="space-y-3">
          {/* OCR debug — what was read */}
          <details className="border border-border bg-panel px-3 py-2">
            <summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.16em] text-muted">
              Text read from label
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{ocrText || "No text detected"}</p>
          </details>

          {matches.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Is this your glaze?
              </p>
              <p className="mb-3 text-xs text-muted">
                Tap the correct match to add it to your inventory.
              </p>
              <div className="grid gap-2">
                {matches.map((match) => (
                  <button
                    key={match.glaze.id}
                    type="button"
                    onClick={() => {
                      setSelectedGlaze(match);
                      setPhase("confirming");
                    }}
                    className="flex items-center gap-3 border border-border bg-white px-3 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-panel/50"
                  >
                    <div className="w-14 shrink-0 overflow-hidden border border-border bg-panel">
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
                    <Badge tone="neutral">{Math.round(match.score)}</Badge>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border bg-panel px-4 py-6 text-center">
              <p className="text-sm font-semibold text-foreground">No matching glazes found</p>
              <p className="mt-1 text-xs text-muted">
                Try a clearer photo with the glaze code visible, or search manually in the library.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { fileInputRef.current?.click(); }}
              className={buttonVariants({ variant: "ghost", className: "flex-1 gap-2" })}
            >
              <Camera className="h-4 w-4" />
              Scan another
            </button>
            <button
              type="button"
              onClick={reset}
              className={buttonVariants({ variant: "ghost" })}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* ── CONFIRMING: Verify before adding ── */}
      {phase === "confirming" && selectedGlaze ? (
        <div className="space-y-4">
          <div className="border border-border bg-panel p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Confirm this glaze</p>
            <div className="flex items-start gap-4">
              <div className="w-20 shrink-0 overflow-hidden border border-border bg-white">
                {selectedGlaze.imageUrl ? (
                  <img
                    src={selectedGlaze.imageUrl}
                    alt={formatGlazeLabel(selectedGlaze.glaze)}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-[8px] uppercase tracking-[0.14em] text-muted">
                    No img
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  {selectedGlaze.glaze.brand}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {selectedGlaze.glaze.code ? `${selectedGlaze.glaze.code} ` : ""}{selectedGlaze.glaze.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGlaze.glaze.line ? <Badge tone="neutral">{selectedGlaze.glaze.line}</Badge> : null}
                  {selectedGlaze.glaze.cone ? <Badge tone="neutral">{selectedGlaze.glaze.cone}</Badge> : null}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted">
            This will be added to your inventory as <strong>Owned</strong>.
          </p>

          {addError ? (
            <p className="text-xs text-[#7f4026]">{addError}</p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { void handleConfirmAdd(); }}
              disabled={addPending}
              className={buttonVariants({ variant: "primary", className: "flex-1 gap-2" })}
            >
              <Check className="h-4 w-4" />
              {addPending ? "Adding..." : "Yes, add to inventory"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("results")}
              disabled={addPending}
              className={buttonVariants({ variant: "ghost" })}
            >
              Back
            </button>
          </div>
        </div>
      ) : null}

      {/* ── ADDED: Success state ── */}
      {phase === "added" && selectedGlaze ? (
        <div className="space-y-4">
          <div className="border border-border bg-panel px-4 py-6 text-center">
            <Check className="mx-auto mb-2 h-8 w-8 text-foreground" />
            <p className="text-sm font-semibold text-foreground">
              {formatGlazeLabel(selectedGlaze.glaze)} added to inventory
            </p>
            <p className="mt-1 text-xs text-muted">Marked as owned.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhase("idle");
                setCapturedImage(null);
                setOcrText("");
                setMatches([]);
                setSelectedGlaze(null);
                setAddError(null);
              }}
              className={buttonVariants({ variant: "primary", className: "flex-1 gap-2" })}
            >
              <Camera className="h-4 w-4" />
              Scan another
            </button>
            <button
              type="button"
              onClick={reset}
              className={buttonVariants({ variant: "ghost" })}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
