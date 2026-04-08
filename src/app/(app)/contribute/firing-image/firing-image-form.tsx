"use client";

import { useCallback, useDeferredValue, useRef, useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import { uploadCommunityFiringImageAction } from "@/app/actions/community";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { CUSTOM_GLAZE_ATMOSPHERE_VALUES, CUSTOM_GLAZE_CONE_VALUES } from "@/lib/glaze-constants";
import type { Glaze } from "@/lib/types";
import { buildGlazeSearchIndex, cn, matchesGlazeSearch } from "@/lib/utils";

type CombinationOption = { id: string; type: "vendor" | "user"; label: string; sub?: string };
type Tab = "glaze" | "combination";

export function FiringImageForm({
  glazes,
  combinationOptions,
}: {
  glazes: Glaze[];
  combinationOptions: CombinationOption[];
}) {
  const [tab, setTab] = useState<Tab>("glaze");
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedGlaze, setSelectedGlaze] = useState<Glaze | null>(null);
  const [selectedCombination, setSelectedCombination] = useState<CombinationOption | null>(null);

  const brands = Array.from(
    new Set(glazes.map((g) => g.brand).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b));

  const filteredGlazes = glazes.filter((g) => {
    if (brand !== "all" && g.brand !== brand) return false;
    if (!deferredQuery.trim()) return true;
    const index = buildGlazeSearchIndex([g.brand, g.line, g.code, g.name, g.cone]);
    return matchesGlazeSearch(index, deferredQuery);
  });
  const visibleGlazes = filteredGlazes.slice(0, 60);

  const filteredCombinations = deferredQuery.trim()
    ? combinationOptions.filter((c) =>
        c.label.toLowerCase().includes(deferredQuery.toLowerCase())
      ).slice(0, 20)
    : combinationOptions.slice(0, 20);
  const [cone, setCone] = useState("");
  const [atmosphere, setAtmosphere] = useState("");
  const [label, setLabel] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error: string } | { success: true } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setImagePreview(null); return; }
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await uploadCommunityFiringImageAction(data);
      setResult(res);
      if ("success" in res) {
        setSelectedGlaze(null);
        setSelectedCombination(null);
        setQuery("");
        setCone("");
        setAtmosphere("");
        setLabel("");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }, []);

  const canSubmit = !!(tab === "glaze" ? selectedGlaze : selectedCombination) && !!imagePreview && !isPending;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      {/* ── Left: instructions ── */}
      <div className="space-y-4">
        <Panel className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Before uploading</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">Good photos help everyone</h2>
          </div>
          <div className="grid gap-3">
            {[
              { label: "Sharp & in focus", body: "Blurry or dark photos aren't useful. Natural light or a lightbox gives the most accurate colour." },
              { label: "Fired result only", body: "Post-firing photos only. Unfired glaze or raw clay photos don't show useful firing data." },
              { label: "Include metadata", body: "Adding cone and atmosphere helps others understand when and how the result applies to their setup." },
            ].map(({ label, body }) => (
              <div key={label} className="border border-border bg-panel px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">{body}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Right: form ── */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

        {/* Success / error banner */}
        {result ? (
          <div className={cn(
            "flex items-center gap-2 border px-4 py-3 text-sm",
            "success" in result
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-[#bb6742]/18 bg-[#bb6742]/10 text-[#7f4026]",
          )}>
            {"success" in result ? <Check className="h-4 w-4 shrink-0" /> : null}
            {"success" in result ? "Photo uploaded — thanks for contributing!" : result.error}
          </div>
        ) : null}

        {/* ── Tab ── */}
        <Panel className="space-y-4">
          <div className="flex items-center gap-1 border border-border bg-background p-1">
            {(["glaze", "combination"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setQuery(""); setSelectedGlaze(null); setSelectedCombination(null); }}
                className={cn(
                  "flex-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors",
                  tab === t ? "bg-foreground text-background" : "text-muted hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Glaze search */}
          {tab === "glaze" ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                <label className="grid gap-1.5 text-sm font-medium">
                  Brand
                  <Select value={brand} onChange={(e) => { setBrand(e.target.value); setQuery(""); }}>
                    <option value="all">All brands</option>
                    {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Search
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, code, colour, finish…"
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>Pick the glaze</span>
                <Badge tone="neutral">{filteredGlazes.length} match{filteredGlazes.length === 1 ? "" : "es"}</Badge>
                {filteredGlazes.length > visibleGlazes.length ? (
                  <span>Showing {visibleGlazes.length} — narrow the search to see fewer.</span>
                ) : null}
              </div>

              <div className="max-h-[320px] overflow-y-auto border border-border bg-panel p-2">
                {visibleGlazes.length ? (
                  <div className="grid gap-2">
                    {visibleGlazes.map((g) => {
                      const isSelected = selectedGlaze?.id === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGlaze(isSelected ? null : g)}
                          className={cn(
                            "grid grid-cols-[72px_1fr] items-start gap-3 border px-3 py-2.5 text-left transition",
                            isSelected
                              ? "border-foreground bg-[#2d1c16] text-white"
                              : "border-border bg-panel text-foreground hover:border-foreground/20 hover:bg-white",
                          )}
                        >
                          <div className="overflow-hidden border border-border/70 bg-panel">
                            {g.imageUrl ? (
                              <img src={g.imageUrl} alt={g.name} className="h-[72px] w-full object-cover" loading="lazy" />
                            ) : (
                              <div className={cn("flex h-[72px] items-center justify-center px-2 text-center text-[10px] uppercase tracking-[0.16em]", isSelected ? "text-white/70" : "text-muted")}>
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{[g.brand, g.line].filter(Boolean).join(" · ")}</p>
                            <p className={cn("mt-0.5 text-sm", isSelected ? "text-white/85" : "text-muted")}>
                              {[g.code, g.name, g.cone].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-sm text-muted">No glazes match — try a different brand or shorter search.</p>
                )}
              </div>

              {selectedGlaze ? (
                <div className="flex items-center justify-between border border-foreground/20 bg-white px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      Selected: {[selectedGlaze.brand, selectedGlaze.line, selectedGlaze.code, selectedGlaze.name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelectedGlaze(null)} className="ml-3 shrink-0 text-muted hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              {selectedGlaze ? <input type="hidden" name="glazeId" value={selectedGlaze.id} /> : null}
            </div>
          ) : (
            /* Combination search */
            <div className="space-y-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Search combinations
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by combination name…"
                  autoComplete="off"
                />
              </label>
              <div className="max-h-[280px] overflow-y-auto border border-border bg-panel p-2">
                {filteredCombinations.length ? (
                  <div className="grid gap-1">
                    {filteredCombinations.map((c) => {
                      const isSelected = selectedCombination?.id === c.id && selectedCombination?.type === c.type;
                      return (
                        <button
                          key={`${c.type}-${c.id}`}
                          type="button"
                          onClick={() => setSelectedCombination(isSelected ? null : c)}
                          className={cn(
                            "flex w-full items-start gap-2 border px-3 py-2.5 text-left transition",
                            isSelected
                              ? "border-foreground bg-[#2d1c16] text-white"
                              : "border-border bg-panel text-foreground hover:border-foreground/20 hover:bg-white",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{c.label}</p>
                            {c.sub ? <p className={cn("text-xs", isSelected ? "text-white/75" : "text-muted")}>{c.sub}</p> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-sm text-muted">No combinations found.</p>
                )}
              </div>
              {selectedCombination ? (
                <input type="hidden" name="combinationId" value={selectedCombination.id} />
              ) : null}
              {selectedCombination ? (
                <input type="hidden" name="combinationType" value={selectedCombination.type} />
              ) : null}
            </div>
          )}
        </Panel>

        {/* ── Image ── */}
        <Panel className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone={imagePreview ? "success" : "neutral"}>{imagePreview ? "Photo ready" : "Photo required"}</Badge>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Fired result photo</p>
          </div>
          {imagePreview ? (
            <div className="relative w-full max-w-xs">
              <img src={imagePreview} alt="Preview" className="aspect-[4/3] w-full border border-border object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute right-2 top-2 border border-border bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-center gap-3 border border-foreground/20 bg-white px-4 py-3 text-sm shadow-sm hover:bg-foreground/[0.04]">
            <span>{imagePreview ? "Change photo" : "Choose a photo"}</span>
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>
          <p className="text-xs text-muted">JPEG, PNG, WebP or HEIC · Max 8 MB</p>
        </Panel>

        {/* ── Metadata (optional) ── */}
        <Panel className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Optional</Badge>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Firing details</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Cone</p>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_GLAZE_CONE_VALUES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCone(cone === c ? "" : c)}
                  className={cn(
                    "border px-3 py-2 text-sm uppercase tracking-[0.12em] transition",
                    cone === c ? "border-foreground bg-foreground text-white" : "border-foreground/20 bg-white text-foreground hover:bg-foreground/[0.04]",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <input type="hidden" name="cone" value={cone} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Atmosphere</p>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_GLAZE_ATMOSPHERE_VALUES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAtmosphere(atmosphere === a ? "" : a)}
                  className={cn(
                    "border px-3 py-2 text-sm uppercase tracking-[0.12em] transition",
                    atmosphere === a ? "border-foreground bg-foreground text-white" : "border-foreground/20 bg-white text-foreground hover:bg-foreground/[0.04]",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <input type="hidden" name="atmosphere" value={atmosphere} />
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-foreground">Label <span className="font-normal text-muted">(e.g. "Thick application", "Cone 6 oxidation on white stoneware")</span></span>
            <Input
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Short description of this firing…"
              className="border-foreground/20 bg-white"
              maxLength={120}
            />
          </label>
        </Panel>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <p className="text-sm text-muted">Photos are visible to all members immediately.</p>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "border px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
              canSubmit
                ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
                : "border-border bg-panel text-muted cursor-not-allowed",
            )}
          >
            {isPending ? "Uploading…" : "Upload photo"}
          </button>
        </div>
      </form>
    </div>
  );
}
