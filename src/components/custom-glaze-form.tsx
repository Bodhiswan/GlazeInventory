"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import { createCustomGlazeAction } from "@/app/actions/inventory";
import {
  COMMERCIAL_GLAZE_BRANDS,
  CUSTOM_GLAZE_ATMOSPHERE_VALUES,
  CUSTOM_GLAZE_COLOR_OPTIONS,
  CUSTOM_GLAZE_CONE_VALUES,
  CUSTOM_GLAZE_FINISH_OPTIONS,
} from "@/lib/glaze-constants";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Format helpers
 * ------------------------------------------------------------------------ */

function toTitleCase(str: string): string {
  return str
    .split(/(\s+)/)
    .map((chunk) => {
      if (/^\s+$/.test(chunk)) return chunk;
      return chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase();
    })
    .join("");
}

function toUpperCode(str: string): string {
  return str.toUpperCase().trim();
}

/* ---------------------------------------------------------------------------
 * Submit button
 * ------------------------------------------------------------------------ */

function SubmitButton({ canSubmit, isPending }: { canSubmit: boolean; isPending: boolean }) {
  return (
    <Button type="submit" disabled={!canSubmit || isPending}>
      {isPending ? "Adding glaze…" : "Add to catalog"}
    </Button>
  );
}

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------ */

export interface CatalogEntry {
  id: string;
  name: string;
  brand: string | null;
  code: string | null;
}

/* ---------------------------------------------------------------------------
 * Main form
 * ------------------------------------------------------------------------ */

export function CustomGlazeForm({
  catalogEntries,
  returnTo,
  disabled = false,
}: {
  catalogEntries: CatalogEntry[];
  returnTo?: string;
  disabled?: boolean;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [code, setCode] = useState("");
  const [cone, setCone] = useState<string>("");
  const [atmosphere, setAtmosphere] = useState<string>("");
  const [colors, setColors] = useState<string[]>([]);
  const [finishes, setFinishes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCustomGlazeAction(data);
      if (result && "error" in result) {
        setError(result.error);
      }
      // On success Next.js redirect() throws, so this only runs on error
      setImagePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    if (!files.length) return;
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  }, []);

  const removeImage = useCallback((index: number) => {
    setImagePreviews((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // If all removed, reset file input so user can re-select
      if (next.length === 0 && fileInputRef.current) fileInputRef.current.value = "";
      return next;
    });
  }, []);

  // Live duplicate detection — exact name+brand match against catalog
  const duplicate = useMemo<CatalogEntry | null>(() => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) return null;
    const normalName = trimmedName.toLowerCase();
    const normalBrand = brand.trim().toLowerCase() || null;
    return (
      catalogEntries.find(
        (entry) =>
          entry.name.toLowerCase() === normalName &&
          (entry.brand?.toLowerCase() ?? null) === normalBrand,
      ) ?? null
    );
  }, [name, brand, catalogEntries]);

  const canSubmit =
    name.trim().length >= 2 &&
    brand.trim().length > 0 &&
    code.trim().length > 0 &&
    !!cone &&
    !!atmosphere &&
    colors.length > 0 &&
    finishes.length > 0 &&
    notes.trim().length > 0 &&
    imagePreviews.length > 0 &&
    !duplicate &&
    !disabled;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {error ? <FormBanner variant="error">{error}</FormBanner> : null}

      {/* Hidden pass-through fields */}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      {/* ── Name ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={name.trim().length >= 2 ? "success" : "neutral"}>
            {name.trim().length >= 2 ? "Name set" : "Name required"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Glaze name</p>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            What is this glaze called?
          </span>
          <Input
            required
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setName(toTitleCase(name.trim()))}
            placeholder="e.g. Temmoku Black, River Blue, Shino White"
            className="border-foreground/20 bg-white shadow-sm"
            autoComplete="off"
            disabled={disabled}
          />
          <span className="text-xs leading-5 text-muted">
            Use Title Case — capitalise the first letter of each word.
          </span>
        </label>
      </Panel>

      {/* ── Brand / maker ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={brand.trim() && code.trim() ? "success" : "neutral"}>
            {brand.trim() && code.trim() ? "Set" : "Required"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Brand or maker</p>
        </div>
        <datalist id="glaze-brands-list">
          {COMMERCIAL_GLAZE_BRANDS.map((b) => <option key={b} value={b} />)}
        </datalist>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Brand</span>
            <Input
              required
              list="glaze-brands-list"
              name="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onBlur={() => setBrand(brand.trim())}
              placeholder="e.g. AMACO, Mayco, Coyote…"
              className="border-foreground/20 bg-white shadow-sm"
              autoComplete="off"
              disabled={disabled}
            />
            <span className="text-xs leading-5 text-muted">
              Choose from the list or type a brand not shown.
            </span>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Product code</span>
            <Input
              required
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={() => setCode(toUpperCode(code))}
              placeholder="e.g. TB-01, MY-TEMMOKU"
              className="border-foreground/20 bg-white shadow-sm"
              autoComplete="off"
              disabled={disabled}
            />
            <span className="text-xs leading-5 text-muted">
              Codes are auto-uppercased.
            </span>
          </label>
        </div>
      </Panel>

      {/* ── Cone ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={cone ? "success" : "neutral"}>{cone || "Cone required"}</Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Firing temperature</p>
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground">Which cone range does this glaze fire at?</p>
          <div className="flex flex-wrap gap-3">
            {CUSTOM_GLAZE_CONE_VALUES.map((option) => {
              const selected = cone === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCone(option)}
                  disabled={disabled}
                  className={cn(
                    "border px-4 py-3 text-sm uppercase tracking-[0.14em] transition",
                    selected
                      ? "border-foreground bg-foreground text-white shadow-sm"
                      : "border-foreground/20 bg-white text-foreground shadow-sm hover:bg-foreground/[0.04]",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="cone" value={cone} />
        </div>
      </Panel>

      {/* ── Atmosphere ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={atmosphere ? "success" : "neutral"}>{atmosphere || "Required"}</Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Atmosphere</p>
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground">What firing atmosphere does it suit?</p>
          <div className="flex flex-wrap gap-3">
            {CUSTOM_GLAZE_ATMOSPHERE_VALUES.map((option) => {
              const selected = atmosphere === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAtmosphere(selected ? "" : option)}
                  disabled={disabled}
                  className={cn(
                    "border px-4 py-3 text-sm uppercase tracking-[0.14em] transition",
                    selected
                      ? "border-foreground bg-foreground text-white shadow-sm"
                      : "border-foreground/20 bg-white text-foreground shadow-sm hover:bg-foreground/[0.04]",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="atmosphere" value={atmosphere} />
        </div>
      </Panel>

      {/* ── Colors ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={colors.length > 0 ? "success" : "neutral"}>
            {colors.length > 0 ? `${colors.length} selected` : "Required"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Colors</p>
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground">What colours does this glaze produce?</p>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_GLAZE_COLOR_OPTIONS.map((option) => {
              const selected = colors.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setColors(selected ? colors.filter((c) => c !== option) : [...colors, option])
                  }
                  disabled={disabled}
                  className={cn(
                    "border px-3 py-2 text-sm transition",
                    selected
                      ? "border-foreground bg-foreground text-white shadow-sm"
                      : "border-foreground/20 bg-white text-foreground shadow-sm hover:bg-foreground/[0.04]",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="colors" value={colors.join(",")} />
          <p className="text-xs leading-5 text-muted">
            These feed into the colour filter in the glaze library. Select all that apply.
          </p>
        </div>
      </Panel>

      {/* ── Finishes ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={finishes.length > 0 ? "success" : "neutral"}>
            {finishes.length > 0 ? `${finishes.length} selected` : "Required"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Finish</p>
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground">What kind of surface finish does it have?</p>
          <div className="flex flex-wrap gap-3">
            {CUSTOM_GLAZE_FINISH_OPTIONS.map((option) => {
              const selected = finishes.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setFinishes(selected ? finishes.filter((f) => f !== option) : [...finishes, option])
                  }
                  disabled={disabled}
                  className={cn(
                    "border px-4 py-3 text-sm uppercase tracking-[0.14em] transition",
                    selected
                      ? "border-foreground bg-foreground text-white shadow-sm"
                      : "border-foreground/20 bg-white text-foreground shadow-sm hover:bg-foreground/[0.04]",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="finishes" value={finishes.join(",")} />
          <p className="text-xs leading-5 text-muted">
            These feed into the finish filter in the glaze library. Select all that apply.
          </p>
        </div>
      </Panel>

      {/* ── Notes ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={notes.trim() ? "success" : "neutral"}>
            {notes.trim() ? "Set" : "Required"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Notes</p>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Anything useful about this glaze?</span>
          <Textarea
            required
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Finish type, colour range, typical application, recipe source, or anything else worth noting."
            className="border-foreground/20 bg-white shadow-sm"
            disabled={disabled}
          />
          <span className="text-xs leading-5 text-muted">
            Up to 500 characters. This is shared with other members who encounter your combinations.
          </span>
        </label>
      </Panel>

      {/* ── Images ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={imagePreviews.length > 0 ? "success" : "neutral"}>
            {imagePreviews.length > 0 ? `${imagePreviews.length} photo${imagePreviews.length > 1 ? "s" : ""} selected` : "Required"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Photos (up to 5)</p>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium text-foreground">Got photos of this glaze?</p>
          {imagePreviews.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`Glaze preview ${i + 1}`}
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
              {imagePreviews.length < 5 ? (
                <label className="flex h-24 w-24 cursor-pointer items-center justify-center border border-dashed border-foreground/20 bg-white text-xs text-muted hover:bg-foreground/[0.04] sm:h-28 sm:w-28">
                  + Add
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="images"
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
            <label className={cn(
              "flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition",
              "border-foreground/20 bg-white text-foreground shadow-sm hover:bg-foreground/[0.04]",
            )}>
              <span>Choose photos</span>
              <input
                ref={fileInputRef}
                type="file"
                name="images"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                onChange={handleImageChange}
                disabled={disabled}
                className="sr-only"
              />
            </label>
          )}
          <p className="text-xs leading-5 text-muted">JPEG, PNG, WebP or HEIC · Max 5 MB each · Up to 5 photos</p>
        </div>
      </Panel>

      {/* ── Duplicate warning ── */}
      {duplicate ? (
        <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3">
          <p className="text-sm font-medium text-[#7f4026]">This glaze already exists in the catalog</p>
          <p className="mt-1 text-sm text-[#7f4026]/80">
            <strong>{duplicate.brand ? `${duplicate.brand} ` : ""}{duplicate.name}</strong>
            {duplicate.code ? ` (${duplicate.code})` : ""} is already listed.
            Find it by searching in the library instead of adding a duplicate.
          </p>
        </div>
      ) : null}

      {/* ── Submit ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">
          Custom glazes are added to your inventory and appear in the combination search.
        </p>
        <SubmitButton canSubmit={canSubmit} isPending={isPending} />
      </div>
    </form>
  );
}
