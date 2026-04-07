"use client";

import { Trash2 } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import type { Glaze } from "@/lib/types";
import { buildGlazeSearchIndex, cn, formatGlazeLabel, matchesGlazeSearch } from "@/lib/utils";

const coneChoices = ["Cone 06", "Cone 6", "Cone 10"] as const;
type ConeChoice = (typeof coneChoices)[number];

const MAX_LAYERS = 4;
const MIN_LAYERS = 2;

/* ---------------------------------------------------------------------------
 * Glaze search helpers
 * ------------------------------------------------------------------------ */

function buildSearchText(glaze: Glaze) {
  return buildGlazeSearchIndex([
    glaze.brand,
    glaze.line,
    glaze.code,
    glaze.name,
    glaze.cone,
  ]);
}

function filterGlazes(glazes: Glaze[], query: string, excludedIds: Set<string>) {
  const normalizedQuery = query.trim().toLowerCase();

  return glazes.filter((glaze) => {
    if (excludedIds.has(glaze.id)) return false;
    if (!normalizedQuery) return true;
    return matchesGlazeSearch(buildSearchText(glaze), query);
  });
}

function renderGlazeOptionLabel(glaze: Glaze) {
  return [glaze.brand, glaze.code, glaze.name].filter(Boolean).join(" · ");
}

/* ---------------------------------------------------------------------------
 * Layer combobox
 * ------------------------------------------------------------------------ */

function GlazeCombobox({
  disabled,
  excludedIds,
  glazes,
  label,
  roleLabel,
  query,
  selectedGlazeId,
  onQueryChange,
  onSelect,
  onRemove,
  removable,
}: {
  disabled: boolean;
  excludedIds: Set<string>;
  glazes: Glaze[];
  label: string;
  roleLabel: string;
  query: string;
  selectedGlazeId: string;
  onQueryChange: (value: string) => void;
  onSelect: (glazeId: string) => void;
  onRemove?: () => void;
  removable: boolean;
}) {
  const deferredQuery = useDeferredValue(query);
  const filteredGlazes = useMemo(
    () => filterGlazes(glazes, deferredQuery, excludedIds).slice(0, 12),
    [deferredQuery, excludedIds, glazes],
  );
  const selectedGlaze = glazes.find((glaze) => glaze.id === selectedGlazeId) ?? null;

  return (
    <Panel className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{label}</Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{roleLabel}</p>
        </div>
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-muted transition hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        ) : null}
      </div>

      <Input
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          onQueryChange(nextValue);
          if (
            selectedGlaze &&
            nextValue.trim().toLowerCase() !== renderGlazeOptionLabel(selectedGlaze).toLowerCase()
          ) {
            onSelect("");
          }
        }}
        placeholder="Search by brand, code, name, or cone"
        disabled={disabled}
        className="border-foreground/20 bg-white shadow-sm"
      />

      <div className="border border-foreground/15 bg-white shadow-sm">
        {filteredGlazes.length ? (
          <div className="max-h-48 overflow-y-auto">
            {filteredGlazes.map((glaze) => {
              const selected = glaze.id === selectedGlazeId;

              return (
                <button
                  key={glaze.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(glaze.id);
                    onQueryChange(renderGlazeOptionLabel(glaze));
                  }}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-foreground/10 px-4 py-2.5 text-left transition last:border-b-0",
                    selected
                      ? "bg-foreground text-white"
                      : "bg-white text-foreground hover:bg-foreground/[0.04]",
                  )}
                >
                  <span className="text-sm font-medium">{renderGlazeOptionLabel(glaze)}</span>
                  <span className={cn("text-xs", selected ? "text-white/75" : "text-muted")}>
                    {[glaze.line, glaze.cone].filter(Boolean).join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-3 space-y-1">
            <p className="text-sm text-muted">No matches. Try a shorter search.</p>
            <a
              href="/glazes/new?returnTo=/publish"
              className="text-xs font-medium text-foreground underline underline-offset-4 hover:text-muted transition"
            >
              Can&apos;t find it? Add a custom glaze →
            </a>
          </div>
        )}
      </div>

      <p className="text-xs leading-5 text-muted">
        {selectedGlaze
          ? `${roleLabel}: ${formatGlazeLabel(selectedGlaze)}`
          : `${filteredGlazes.length} matches shown.`}
      </p>
    </Panel>
  );
}

/* ---------------------------------------------------------------------------
 * Layer state type
 * ------------------------------------------------------------------------ */

interface LayerState {
  query: string;
  glazeId: string;
}

function getLayerRole(index: number, total: number) {
  if (index === 0) return "Top layer";
  if (index === total - 1) return total > 2 ? "Base layer" : "Bottom layer";
  return `Middle layer ${index}`;
}

/* ---------------------------------------------------------------------------
 * Submit button — uses useFormStatus to show pending state
 * ------------------------------------------------------------------------ */

function PublishSubmitButton({ canPublish }: { canPublish: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={!canPublish || pending}>
      {pending ? "Publishing…" : "Publish combination"}
    </Button>
  );
}

/* ---------------------------------------------------------------------------
 * Main form
 * ------------------------------------------------------------------------ */

export function PublishCombinationForm({
  disabled,
  glazes,
}: {
  disabled: boolean;
  glazes: Glaze[];
}) {
  const [layers, setLayers] = useState<LayerState[]>([
    { query: "", glazeId: "" },
    { query: "", glazeId: "" },
  ]);
  const [coneChoice, setConeChoice] = useState<ConeChoice | "">("");

  const selectedIds = useMemo(
    () => new Set(layers.map((l) => l.glazeId).filter(Boolean)),
    [layers],
  );

  const filledLayerCount = layers.filter((l) => l.glazeId).length;
  const canPublish = filledLayerCount >= MIN_LAYERS && !!coneChoice && !disabled;

  const layerSummary = layers
    .filter((l) => l.glazeId)
    .map((l) => {
      const glaze = glazes.find((g) => g.id === l.glazeId);
      return glaze ? formatGlazeLabel(glaze) : "?";
    })
    .join(" over ");

  function updateLayer(index: number, update: Partial<LayerState>) {
    setLayers((current) =>
      current.map((layer, i) => (i === index ? { ...layer, ...update } : layer)),
    );
  }

  function addLayer() {
    if (layers.length >= MAX_LAYERS) return;
    setLayers((current) => [...current, { query: "", glazeId: "" }]);
  }

  function removeLayer(index: number) {
    if (layers.length <= MIN_LAYERS) return;
    setLayers((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-6">
      {/* Hidden inputs for all layer glaze IDs */}
      {layers.map((layer, index) => (
        <input
          key={`hidden-layer-${index}`}
          type="hidden"
          name={`layer${index + 1}GlazeId`}
          value={layer.glazeId}
        />
      ))}
      <input type="hidden" name="coneValue" value={coneChoice} />

      {/* --- Glaze layers --- */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
            Glaze layers ({layers.length}/{MAX_LAYERS})
          </p>
          {layers.length < MAX_LAYERS ? (
            <button
              type="button"
              onClick={addLayer}
              disabled={disabled}
              className="text-xs font-medium text-foreground underline underline-offset-4 transition hover:text-muted"
            >
              + Add layer
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {layers.map((layer, index) => {
            const otherIds = new Set(
              layers
                .filter((_, i) => i !== index)
                .map((l) => l.glazeId)
                .filter(Boolean),
            );

            return (
              <GlazeCombobox
                key={index}
                disabled={disabled}
                excludedIds={otherIds}
                glazes={glazes}
                label={`Layer ${index + 1}`}
                roleLabel={getLayerRole(index, layers.length)}
                query={layer.query}
                selectedGlazeId={layer.glazeId}
                onQueryChange={(value) => updateLayer(index, { query: value })}
                onSelect={(glazeId) => updateLayer(index, { glazeId })}
                onRemove={() => removeLayer(index)}
                removable={layers.length > MIN_LAYERS}
              />
            );
          })}
        </div>
      </div>

      {/* --- Layer order summary --- */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={filledLayerCount >= MIN_LAYERS ? "success" : "neutral"}>
            {filledLayerCount >= MIN_LAYERS ? "Layers ready" : "Choose layers"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Layer order</p>
        </div>
        <div className="border border-foreground/15 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm leading-6 text-foreground">
            {filledLayerCount >= MIN_LAYERS
              ? layerSummary
              : "Pick at least two glaze layers to lock the order before publishing."}
          </p>
        </div>
      </Panel>

      {/* --- Images --- */}
      <Panel className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Photos</p>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Post-firing photo <span className="text-muted">(required)</span>
          </span>
          <Input name="postFiringImage" type="file" accept="image/*" required disabled={disabled} className="border-foreground/20 bg-white shadow-sm" />
          <span className="text-xs leading-5 text-muted">
            Show the fired surface clearly. Cropped close-ups work well.
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Pre-firing photo <span className="text-muted">(optional)</span>
          </span>
          <Input name="preFiringImage" type="file" accept="image/*" disabled={disabled} className="border-foreground/20 bg-white shadow-sm" />
          <span className="text-xs leading-5 text-muted">
            Helpful for showing application thickness, overlap areas, or raw glaze placement before the kiln.
          </span>
        </label>
      </Panel>

      {/* --- Cone selector --- */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={coneChoice ? "success" : "neutral"}>{coneChoice || "Pick one cone"}</Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Firing temperature</p>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground">Which firing range?</p>
          <div className="flex flex-wrap gap-3">
            {coneChoices.map((choice) => {
              const selected = choice === coneChoice;

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={disabled}
                  onClick={() => setConeChoice(choice)}
                  className={cn(
                    "border px-4 py-3 text-sm uppercase tracking-[0.14em] transition",
                    selected
                      ? "border-foreground bg-foreground text-white shadow-sm"
                      : "border-foreground/20 bg-white text-foreground shadow-sm hover:bg-foreground/[0.04]",
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* --- Notes fields --- */}
      <div className="grid gap-4">
        <div className="grid gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Glazing process</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">How did you apply the layers?</span>
            <Textarea
              name="glazingProcess"
              placeholder="Number of coats, overlap area, dip or brush details, and any thickness notes."
              className="border-foreground/20 bg-white shadow-sm"
            />
          </label>
        </div>

        <div className="grid gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Thoughts</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              What happened once it came out of the kiln?
            </span>
            <Textarea
              name="notes"
              placeholder="Describe the visual result, clay body, surprises, or takeaways."
              className="border-foreground/20 bg-white shadow-sm"
            />
          </label>
        </div>

        <div className="grid gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Kiln specifics</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Anything unusual about the firing?
            </span>
            <Textarea
              name="kilnNotes"
              placeholder="Only needed if not a regular oxidation firing. Reduction, slow cool, special schedule, shelf position, etc."
              className="border-foreground/20 bg-white shadow-sm"
            />
            <span className="text-xs leading-5 text-muted">
              Leave blank for standard oxidation firings — only fill this in if you did something different.
            </span>
          </label>
        </div>
      </div>

      {/* --- Submit --- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">
          Published examples appear in combinations and help other members compare layering results.
        </p>
        <PublishSubmitButton canPublish={canPublish} />
      </div>
    </div>
  );
}
