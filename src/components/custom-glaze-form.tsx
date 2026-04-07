"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  CUSTOM_GLAZE_ATMOSPHERE_VALUES,
  CUSTOM_GLAZE_COLOR_OPTIONS,
  CUSTOM_GLAZE_CONE_VALUES,
  CUSTOM_GLAZE_FINISH_OPTIONS,
} from "@/lib/glaze-constants";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
 * Submit button — reads form pending state
 * ------------------------------------------------------------------------ */

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={!canSubmit || pending}>
      {pending ? "Adding glaze…" : "Add to catalog"}
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

  const canSubmit = name.trim().length >= 2 && !!cone && !duplicate && !disabled;

  return (
    <div className="grid gap-6">
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
          <Badge tone="neutral">Optional</Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Brand or maker</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Brand or studio name</span>
            <Input
              name="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onBlur={() => setBrand(toTitleCase(brand.trim()))}
              placeholder="e.g. Local Studio, Self-made"
              className="border-foreground/20 bg-white shadow-sm"
              autoComplete="off"
              disabled={disabled}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Product code</span>
            <Input
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
          <Badge tone="neutral">Optional</Badge>
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
          <p className="text-xs leading-5 text-muted">
            Leave blank if you are not sure or if it works across both.
          </p>
        </div>
      </Panel>

      {/* ── Colors ── */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Optional</Badge>
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
          <Badge tone="neutral">Optional</Badge>
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
          <Badge tone="neutral">Optional</Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Notes</p>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Anything useful about this glaze?</span>
          <Textarea
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
        <SubmitButton canSubmit={canSubmit} />
      </div>
    </div>
  );
}
