"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { Check, Search, X } from "lucide-react";

import { uploadCommunityFiringImageAction } from "@/app/actions/community";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { CUSTOM_GLAZE_ATMOSPHERE_VALUES, CUSTOM_GLAZE_CONE_VALUES } from "@/lib/glaze-constants";
import { cn } from "@/lib/utils";

type GlazeOption = { id: string; label: string; sub?: string };
type CombinationOption = { id: string; type: "vendor" | "user"; label: string; sub?: string };

type Tab = "glaze" | "combination";

export function FiringImageForm({
  glazeOptions,
  combinationOptions,
}: {
  glazeOptions: GlazeOption[];
  combinationOptions: CombinationOption[];
}) {
  const [tab, setTab] = useState<Tab>("glaze");
  const [query, setQuery] = useState("");
  const [selectedGlaze, setSelectedGlaze] = useState<GlazeOption | null>(null);
  const [selectedCombination, setSelectedCombination] = useState<CombinationOption | null>(null);
  const [cone, setCone] = useState("");
  const [atmosphere, setAtmosphere] = useState("");
  const [label, setLabel] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error: string } | { success: true } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filteredGlazes = query.trim().length > 0
    ? glazeOptions.filter((g) => g.label.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
    : [];
  const filteredCombinations = query.trim().length > 0
    ? combinationOptions.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
    : [];

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

  const selected = tab === "glaze" ? selectedGlaze : selectedCombination;
  const canSubmit = !!selected && !!imagePreview && !isPending;

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

          {/* Search */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {tab === "glaze" ? "Which glaze?" : "Which combination?"}
            </p>
            {selected ? (
              <div className="flex items-center justify-between border border-foreground/20 bg-white px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{selected.label}</p>
                  {selected.sub ? <p className="text-xs text-muted">{selected.sub}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => { tab === "glaze" ? setSelectedGlaze(null) : setSelectedCombination(null); setQuery(""); }}
                  className="ml-3 shrink-0 text-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 border border-foreground/20 bg-white px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                    placeholder={tab === "glaze" ? "Search by name or brand…" : "Search by combination name…"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {(tab === "glaze" ? filteredGlazes : filteredCombinations).length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-border bg-white shadow-sm">
                    {(tab === "glaze" ? filteredGlazes : filteredCombinations).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          if (tab === "glaze") setSelectedGlaze(option as GlazeOption);
                          else setSelectedCombination(option as CombinationOption);
                          setQuery("");
                        }}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-foreground/[0.04]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">{option.label}</p>
                          {option.sub ? <p className="text-xs text-muted">{option.sub}</p> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : query.trim().length > 0 ? (
                  <p className="px-1 text-xs text-muted">No matches found.</p>
                ) : null}
              </div>
            )}

            {/* Hidden target fields */}
            {tab === "glaze" && selectedGlaze ? (
              <input type="hidden" name="glazeId" value={selectedGlaze.id} />
            ) : null}
            {tab === "combination" && selectedCombination ? (
              <>
                <input type="hidden" name="combinationId" value={selectedCombination.id} />
                <input type="hidden" name="combinationType" value={(selectedCombination as CombinationOption).type} />
              </>
            ) : null}
          </div>
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
