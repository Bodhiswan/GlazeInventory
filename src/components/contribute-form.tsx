"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { submitContributionAction } from "@/app/actions/contribute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMERCIAL_GLAZE_BRANDS,
  CUSTOM_GLAZE_COLOR_OPTIONS,
  CUSTOM_GLAZE_CONE_VALUES,
  CUSTOM_GLAZE_FINISH_OPTIONS,
} from "@/lib/glaze-constants";

// Contributors only ever fire in oxidation OR reduction — "Both" doesn't
// make sense for a single firing/combo submission.
const CONTRIBUTION_ATMOSPHERE_VALUES = ["Oxidation", "Reduction"] as const;
import type { Glaze } from "@/lib/types";
import { buildGlazeSearchIndex, cn, matchesGlazeSearch } from "@/lib/utils";

export type CombinationOption = { id: string; type: "vendor" | "user"; label: string; sub?: string };

const COMBO_CONES = ["Cone 06", "Cone 6", "Cone 10"] as const;

function pointsForShape(args: {
  selectedGlazeCount: number;
  addingNewGlaze: boolean;
}): number {
  const { selectedGlazeCount, addingNewGlaze } = args;
  if (addingNewGlaze) return 10;
  if (selectedGlazeCount >= 2) return 5;
  if (selectedGlazeCount === 1) return 2;
  return 0;
}

export function ContributeForm({
  glazes,
  disabled = false,
}: {
  glazes: Glaze[];
  disabled?: boolean;
}) {
  const router = useRouter();

  /* ── Photos ────────────────────────────────────────────────────────── */
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    setImageFiles((prev) => {
      const combined = [...prev, ...incoming.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))];
      return combined.slice(0, 5);
    });
    e.target.value = "";
  }, []);
  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── Glaze selection ───────────────────────────────────────────────── */
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedGlazes, setSelectedGlazes] = useState<Glaze[]>([]);

  const filteredGlazes = useMemo(() => {
    const selectedIds = new Set(selectedGlazes.map((g) => g.id));
    return glazes
      .filter((g) => !selectedIds.has(g.id))
      .filter((g) => {
        if (!deferredQuery.trim()) return true;
        const idx = buildGlazeSearchIndex([g.brand, g.line, g.code, g.name, g.cone]);
        return matchesGlazeSearch(idx, deferredQuery);
      })
      .slice(0, 30);
  }, [glazes, selectedGlazes, deferredQuery]);

  function addGlaze(g: Glaze) {
    if (selectedGlazes.length >= 4) return;
    setSelectedGlazes((cur) => [...cur, g]);
    setQuery("");
  }
  function removeGlaze(id: string) {
    setSelectedGlazes((cur) => cur.filter((g) => g.id !== id));
  }
  function moveGlaze(index: number, dir: -1 | 1) {
    setSelectedGlazes((cur) => {
      const next = [...cur];
      const target = index + dir;
      if (target < 0 || target >= next.length) return cur;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /* ── Cone & atmosphere ─────────────────────────────────────────────── */
  const [cone, setCone] = useState<string>("");
  const [atmosphere, setAtmosphere] = useState<string>("");

  /* ── Add new glaze (expandable) ────────────────────────────────────── */
  const [addNewGlaze, setAddNewGlaze] = useState(false);
  const [newGlazeName, setNewGlazeName] = useState("");
  const [newGlazeBrand, setNewGlazeBrand] = useState("");
  const [newGlazeCode, setNewGlazeCode] = useState("");
  const [newGlazeColors, setNewGlazeColors] = useState<string[]>([]);
  const [newGlazeFinishes, setNewGlazeFinishes] = useState<string[]>([]);
  const [newGlazeNotes, setNewGlazeNotes] = useState("");

  /* ── Combination notes (revealed when 2+ glazes total) ─────────────── */
  const [glazingProcess, setGlazingProcess] = useState("");
  const [notes, setNotes] = useState("");
  const [kilnNotes, setKilnNotes] = useState("");
  const [clayBody, setClayBody] = useState("");

  /* ── Firing-photo label (revealed when single glaze) ───────────────── */
  const [label, setLabel] = useState("");

  const isCombination = selectedGlazes.length >= 2;
  const isFiringPhoto = !addNewGlaze && selectedGlazes.length >= 1;

  const points = pointsForShape({
    selectedGlazeCount: selectedGlazes.length,
    addingNewGlaze: addNewGlaze,
  });

  /* ── Validation ────────────────────────────────────────────────────── */
  const newGlazeValid =
    !addNewGlaze ||
    (newGlazeName.trim().length >= 2 &&
      newGlazeBrand.trim().length > 0 &&
      newGlazeCode.trim().length > 0 &&
      newGlazeColors.length > 0 &&
      newGlazeFinishes.length > 0 &&
      newGlazeNotes.trim().length > 0);

  const photoCountValid = imageFiles.length >= 1 && imageFiles.length <= 5;

  const hasTarget = selectedGlazes.length > 0 || addNewGlaze;
  const coneValid = !!cone && (isCombination ? COMBO_CONES.includes(cone as (typeof COMBO_CONES)[number]) : true);

  const canSubmit =
    photoCountValid &&
    hasTarget &&
    newGlazeValid &&
    coneValid &&
    !disabled;

  /* ── Submit ────────────────────────────────────────────────────────── */
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  /* ── Unsaved-changes guard ─────────────────────────────────────────── */
  const isDirty =
    !hasSubmitted &&
    !isPending &&
    (imageFiles.length > 0 ||
      selectedGlazes.length > 0 ||
      addNewGlaze ||
      cone !== "" ||
      atmosphere !== "" ||
      label !== "" ||
      glazingProcess !== "" ||
      notes !== "" ||
      kilnNotes !== "" ||
      clayBody !== "" ||
      newGlazeName !== "" ||
      newGlazeBrand !== "" ||
      newGlazeCode !== "" ||
      newGlazeNotes !== "" ||
      newGlazeColors.length > 0 ||
      newGlazeFinishes.length > 0);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);

    // Also intercept SPA link clicks within the document.
    const clickHandler = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      // External target / new window — let beforeunload handle it
      if (anchor.target && anchor.target !== "_self") return;
      if (
        !window.confirm("You have unsaved changes to your contribution. Leave this page?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", clickHandler, true);

    return () => {
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("click", clickHandler, true);
    };
  }, [isDirty]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const data = new FormData();
      imageFiles.forEach(({ file }) => data.append("images", file));
      data.append("coneValue", cone);
      if (atmosphere) data.append("atmosphere", atmosphere);
      if (label) data.append("label", label);

      selectedGlazes.forEach((g) => data.append("glazeIds", g.id));

      if (addNewGlaze) {
        data.append("addNewGlaze", "1");
        data.append("newGlazeName", newGlazeName.trim());
        data.append("newGlazeBrand", newGlazeBrand.trim());
        data.append("newGlazeCode", newGlazeCode.trim().toUpperCase());
        data.append("newGlazeColors", newGlazeColors.join(", "));
        data.append("newGlazeFinishes", newGlazeFinishes.join(", "));
        data.append("newGlazeNotes", newGlazeNotes.trim());
      }

      if (isCombination) {
        if (glazingProcess) data.append("glazingProcess", glazingProcess);
        if (notes) data.append("notes", notes);
        if (kilnNotes) data.append("kilnNotes", kilnNotes);
        if (clayBody) data.append("clayBody", clayBody);
      }

      startTransition(async () => {
        const res = await submitContributionAction(data);
        if ("error" in res) {
          setSuccessMessage(null);
          setError(res.error);
          return;
        }

        // Reset all form state
        setImageFiles([]);
        setQuery("");
        setSelectedGlazes([]);
        setCone("");
        setAtmosphere("");
        setLabel("");
        setGlazingProcess("");
        setNotes("");
        setKilnNotes("");
        setClayBody("");
        setAddNewGlaze(false);
        setNewGlazeName("");
        setNewGlazeBrand("");
        setNewGlazeCode("");
        setNewGlazeColors([]);
        setNewGlazeFinishes([]);
        setNewGlazeNotes("");

        setHasSubmitted(true);

        // Redirect away from /contribute for combinations and new glazes
        if (!res.redirectTo.startsWith("/contribute")) {
          router.push(res.redirectTo);
          return;
        }

        // Stay on the page and show a success banner
        setSuccessMessage(
          `Submitted! +${res.pointsAwarded} point${res.pointsAwarded === 1 ? "" : "s"} — thanks for contributing.`,
        );
        setHasSubmitted(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [
      imageFiles,
      cone,
      atmosphere,
      label,
      selectedGlazes,
      addNewGlaze,
      newGlazeName,
      newGlazeBrand,
      newGlazeCode,
      newGlazeColors,
      newGlazeFinishes,
      newGlazeNotes,
      isCombination,
      glazingProcess,
      notes,
      kilnNotes,
      clayBody,
      router,
    ],
  );

  /* ── Render ────────────────────────────────────────────────────────── */
  // Storage is top-down: selectedGlazes[0] = top layer, [length-1] = bottom.
  // Server reverses this so DB layer_order 1 = bottom.

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {successMessage ? (
        <FormBanner variant="success">{successMessage}</FormBanner>
      ) : error ? (
        <FormBanner variant="error">{error}</FormBanner>
      ) : null}

      {/* ── Photos ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={imageFiles.length > 0 ? "success" : "neutral"}>
            {imageFiles.length > 0
              ? `${imageFiles.length} photo${imageFiles.length === 1 ? "" : "s"} selected`
              : "Photo required"}
          </Badge>
          <p className="text-sm font-semibold text-foreground">Fired result photos (1–5)</p>
        </div>
        {imageFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {imageFiles.map(({ preview }, i) => (
              <div key={i} className="relative">
                <img
                  src={preview}
                  alt={`Photo ${i + 1}`}
                  className="h-24 w-24 border border-border object-cover sm:h-28 sm:w-28"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 border border-border bg-white px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            ))}
            {imageFiles.length < 5 ? (
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center border border-dashed border-foreground/20 bg-white text-xs text-muted hover:bg-foreground/[0.04] sm:h-28 sm:w-28">
                + Add
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  onChange={handleImageChange}
                  disabled={disabled}
                  className="sr-only"
                />
              </label>
            ) : null}
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-3 border border-foreground/20 bg-white px-4 py-3 text-sm shadow-sm hover:bg-foreground/[0.04]">
            <span>Choose photos</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={handleImageChange}
              disabled={disabled}
              className="sr-only"
            />
          </label>
        )}
        <p className="text-xs leading-5 text-muted">
          JPEG, PNG, WebP, or HEIC · Max 8 MB each · Up to 5 photos
        </p>
      </Panel>

      {/* ── Glaze selection ── */}
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={hasTarget ? "success" : "neutral"}>
            {selectedGlazes.length > 0
              ? `${selectedGlazes.length} glaze${selectedGlazes.length === 1 ? "" : "s"} picked`
              : addNewGlaze
                ? "New glaze ready"
                : "Pick a glaze"}
          </Badge>
          <p className="text-sm font-semibold text-foreground">What did you fire?</p>
        </div>
        {selectedGlazes.length < 2 && !addNewGlaze ? (
          <>
            <p className="text-xs text-muted">
              Pick the <strong className="font-semibold text-foreground">top layer first</strong> — each glaze you add stacks below it.
            </p>
            <p className="text-xs text-muted">
              <strong className="font-semibold text-foreground">Pick one glaze</strong> to contribute a firing example to the glaze library.{" "}
              <strong className="font-semibold text-foreground">Pick two or more</strong> to contribute a glaze combination.
            </p>
          </>
        ) : null}

        {/* Selected glaze chips — top-down display, "OVER" between layers */}
        {selectedGlazes.length > 0 ? (
          <div className="space-y-2">
            {selectedGlazes.length >= 2 ? (
              <p className="text-sm font-semibold text-foreground">Layers (top → bottom)</p>
            ) : null}
            <ul className="grid gap-1">
              {selectedGlazes.map((g, idx) => (
                <li key={g.id}>
                  <div className="flex items-center gap-2 border border-foreground/15 bg-white px-3 py-2 text-sm">
                    {selectedGlazes.length >= 2 ? (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                        {idx === 0
                          ? "Top"
                          : idx === selectedGlazes.length - 1
                            ? "Bottom"
                            : `Layer ${idx + 1}`}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-muted">Glaze</span>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {[g.brand, g.code, g.name].filter(Boolean).join(" · ")}
                    </span>
                    {selectedGlazes.length >= 2 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => moveGlaze(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move up"
                          className="text-xs text-muted hover:text-foreground disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGlaze(idx, 1)}
                          disabled={idx === selectedGlazes.length - 1}
                          aria-label="Move down"
                          className="text-xs text-muted hover:text-foreground disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeGlaze(g.id)}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove glaze"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {idx < selectedGlazes.length - 1 ? (
                    <p className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                      OVER
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Search input + results — hidden when adding a new glaze */}
        {!addNewGlaze && selectedGlazes.length < 4 ? (
          <div className="space-y-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by brand, code, name…"
              autoComplete="off"
              disabled={disabled}
              className="border-foreground/20 bg-white shadow-sm"
            />

            <div className="max-h-[260px] overflow-y-auto border border-border bg-panel">
              {filteredGlazes.length > 0 ? (
                <ul className="divide-y divide-border">
                  {filteredGlazes.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => addGlaze(g)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-foreground/[0.04]"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {[g.brand, g.code, g.name].filter(Boolean).join(" · ")}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                          {g.cone ?? ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-sm text-muted">
                  No matches. Try a shorter search, or add it as a new glaze below.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Add-new-glaze button — only when no glazes selected */}
        {selectedGlazes.length === 0 ? (
          addNewGlaze ? (
            <button
              type="button"
              onClick={() => setAddNewGlaze(false)}
              className="text-xs uppercase tracking-[0.14em] text-muted hover:text-foreground"
            >
              ← Back to search
            </button>
          ) : (
            <div className="space-y-2 border-t border-foreground/10 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Can't find your glaze in the search?
              </p>
              <p className="text-xs text-muted">
                Submit a brand-new glaze entry to the Glaze Library so others can use it too. This creates a new glaze record on the site — it does not add to a list above.
              </p>
              <button
                type="button"
                onClick={() => setAddNewGlaze(true)}
                disabled={disabled}
                className="w-full border border-dashed border-foreground/30 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] hover:bg-foreground/[0.04]"
              >
                + Submit a new glaze to the library
              </button>
            </div>
          )
        ) : null}
      </Panel>

      {/* ── New glaze metadata (expandable) ── */}
      {addNewGlaze ? (
        <Panel className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={newGlazeValid ? "success" : "neutral"}>
              {newGlazeValid ? "New glaze details ready" : "New glaze details required"}
            </Badge>
            <p className="text-sm font-semibold text-foreground">New glaze</p>
          </div>

          <datalist id="glaze-brands-list">
            {COMMERCIAL_GLAZE_BRANDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <Input
                value={newGlazeName}
                onChange={(e) => setNewGlazeName(e.target.value)}
                placeholder="e.g. Temmoku Black"
                disabled={disabled}
                className="border-foreground/20 bg-white"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Brand</span>
              <Input
                list="glaze-brands-list"
                value={newGlazeBrand}
                onChange={(e) => setNewGlazeBrand(e.target.value)}
                placeholder="AMACO, Mayco, Coyote…"
                disabled={disabled}
                className="border-foreground/20 bg-white"
              />
            </label>
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Product code</span>
              <Input
                value={newGlazeCode}
                onChange={(e) => setNewGlazeCode(e.target.value.toUpperCase())}
                placeholder="e.g. TB-01"
                disabled={disabled}
                className="border-foreground/20 bg-white"
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Colours</p>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_GLAZE_COLOR_OPTIONS.map((c) => {
                const selected = newGlazeColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setNewGlazeColors((cur) =>
                        selected ? cur.filter((x) => x !== c) : [...cur, c],
                      )
                    }
                    disabled={disabled}
                    className={cn(
                      "border px-3 py-1.5 text-xs transition",
                      selected
                        ? "border-foreground bg-foreground text-white"
                        : "border-foreground/20 bg-white hover:bg-foreground/[0.04]",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Finish</p>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_GLAZE_FINISH_OPTIONS.map((f) => {
                const selected = newGlazeFinishes.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      setNewGlazeFinishes((cur) =>
                        selected ? cur.filter((x) => x !== f) : [...cur, f],
                      )
                    }
                    disabled={disabled}
                    className={cn(
                      "border px-3 py-1.5 text-xs transition",
                      selected
                        ? "border-foreground bg-foreground text-white"
                        : "border-foreground/20 bg-white hover:bg-foreground/[0.04]",
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Notes about this glaze</span>
            <Textarea
              value={newGlazeNotes}
              onChange={(e) => setNewGlazeNotes(e.target.value)}
              placeholder="Application thickness, surface, recipe source, anything else useful."
              maxLength={500}
              disabled={disabled}
              className="border-foreground/20 bg-white"
            />
          </label>
        </Panel>
      ) : null}

      {/* ── Cone ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={cone ? "success" : "neutral"}>{cone || "Cone required"}</Badge>
          <p className="text-sm font-semibold text-foreground">Firing temperature</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(isCombination ? COMBO_CONES : CUSTOM_GLAZE_CONE_VALUES).map((c) => {
            const selected = cone === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCone(c)}
                disabled={disabled}
                className={cn(
                  "border px-4 py-2.5 text-sm uppercase tracking-[0.12em] transition",
                  selected
                    ? "border-foreground bg-foreground text-white"
                    : "border-foreground/20 bg-white hover:bg-foreground/[0.04]",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
        {isCombination ? (
          <p className="text-xs text-muted">Combinations support Cone 06, 6, or 10.</p>
        ) : null}
      </Panel>

      {/* ── Atmosphere ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={atmosphere ? "success" : "neutral"}>{atmosphere || "Optional"}</Badge>
          <p className="text-sm font-semibold text-foreground">Atmosphere</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTRIBUTION_ATMOSPHERE_VALUES.map((a) => {
            const selected = atmosphere === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAtmosphere(selected ? "" : a)}
                disabled={disabled}
                className={cn(
                  "border px-4 py-2.5 text-sm uppercase tracking-[0.12em] transition",
                  selected
                    ? "border-foreground bg-foreground text-white"
                    : "border-foreground/20 bg-white hover:bg-foreground/[0.04]",
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* ── Combination notes (revealed) ── */}
      {isCombination ? (
        <Panel className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Optional</Badge>
            <p className="text-sm font-semibold text-foreground">Combination details</p>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              How did you apply the layers? <span className="text-muted">(optional)</span>
            </span>
            <Textarea
              value={glazingProcess}
              onChange={(e) => setGlazingProcess(e.target.value)}
              placeholder="Number of coats, overlap area, dip or brush, thickness."
              className="border-foreground/20 bg-white"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              Clay body <span className="text-muted">(optional)</span>
            </span>
            <Input
              value={clayBody}
              onChange={(e) => setClayBody(e.target.value)}
              placeholder="e.g. White stoneware, B-mix, Speckled brown"
              maxLength={120}
              className="border-foreground/20 bg-white"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              Comments <span className="text-muted">(optional)</span>
            </span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Visual result, surprises, takeaways."
              className="border-foreground/20 bg-white"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              Anything unusual about the firing? <span className="text-muted">(optional)</span>
            </span>
            <Textarea
              value={kilnNotes}
              onChange={(e) => setKilnNotes(e.target.value)}
              placeholder="Reduction, slow cool, special schedule, shelf position…"
              className="border-foreground/20 bg-white"
            />
          </label>
        </Panel>
      ) : null}

      {/* ── Firing photo label ── */}
      {isFiringPhoto && !isCombination ? (
        <Panel className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Optional</Badge>
            <p className="text-sm font-semibold text-foreground">Label</p>
          </div>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='Short description e.g. "Thick application on white stoneware"'
            maxLength={120}
            className="border-foreground/20 bg-white"
          />
        </Panel>
      ) : null}

      {/* ── Submit ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">
          Submissions are reviewed to keep the library trustworthy.
        </p>
        <Button type="submit" disabled={!canSubmit || isPending}>
          {isPending
            ? "Submitting…"
            : points > 0
              ? `Submit to claim ${points} points`
              : "Submit"}
        </Button>
      </div>
    </form>
  );
}
