"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import type { Glaze } from "@/lib/types";
import { cn, formatGlazeLabel } from "@/lib/utils";

const coneChoices = ["Cone 06", "Cone 6", "Cone 10"] as const;
type ConeChoice = (typeof coneChoices)[number];

function buildSearchText(glaze: Glaze) {
  return [
    glaze.brand,
    glaze.line,
    glaze.code,
    glaze.name,
    glaze.cone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function createPairKey(glazeAId: string, glazeBId: string) {
  return [glazeAId, glazeBId].sort().join("--");
}

function filterGlazes(glazes: Glaze[], query: string, excludedGlazeId: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return glazes.filter((glaze) => {
    if (excludedGlazeId && glaze.id === excludedGlazeId) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return buildSearchText(glaze).includes(normalizedQuery);
  });
}

function renderGlazeOptionLabel(glaze: Glaze) {
  return [glaze.brand, glaze.code, glaze.name].filter(Boolean).join(" · ");
}

function GlazeCombobox({
  disabled,
  emptyText,
  excludedGlazeId,
  glazes,
  helperText,
  label,
  placeholder,
  query,
  roleLabel,
  selectedGlazeId,
  onQueryChange,
  onSelect,
}: {
  disabled: boolean;
  emptyText: string;
  excludedGlazeId: string;
  glazes: Glaze[];
  helperText: string;
  label: string;
  placeholder: string;
  query: string;
  roleLabel: string;
  selectedGlazeId: string;
  onQueryChange: (value: string) => void;
  onSelect: (glazeId: string) => void;
}) {
  const deferredQuery = useDeferredValue(query);
  const filteredGlazes = useMemo(
    () => filterGlazes(glazes, deferredQuery, excludedGlazeId).slice(0, 12),
    [deferredQuery, excludedGlazeId, glazes],
  );
  const selectedGlaze = glazes.find((glaze) => glaze.id === selectedGlazeId) ?? null;

  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{label}</Badge>
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{roleLabel}</p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">{helperText}</span>
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
          placeholder={placeholder}
          disabled={disabled}
        />
      </label>

      <div className="border border-border bg-panel">
        {filteredGlazes.length ? (
          <div className="max-h-72 overflow-y-auto">
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
                    "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition last:border-b-0",
                    selected
                      ? "bg-foreground text-white"
                      : "bg-transparent text-foreground hover:bg-white",
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
          <div className="px-4 py-4 text-sm text-muted">{emptyText}</div>
        )}
      </div>

      <p className="text-xs leading-5 text-muted">
        {selectedGlaze
          ? `${roleLabel}: ${formatGlazeLabel(selectedGlaze)}`
          : `${filteredGlazes.length} matches shown. Keep typing to narrow further.`}
      </p>
    </Panel>
  );
}

export function PublishCombinationForm({
  disabled,
  glazes,
}: {
  disabled: boolean;
  glazes: Glaze[];
}) {
  const [topQuery, setTopQuery] = useState("");
  const [baseQuery, setBaseQuery] = useState("");
  const [topGlazeId, setTopGlazeId] = useState("");
  const [baseGlazeId, setBaseGlazeId] = useState("");
  const [coneChoice, setConeChoice] = useState<ConeChoice | "">("");

  const selectedTopGlaze = glazes.find((glaze) => glaze.id === topGlazeId) ?? null;
  const selectedBaseGlaze = glazes.find((glaze) => glaze.id === baseGlazeId) ?? null;
  const pairKey = topGlazeId && baseGlazeId ? createPairKey(topGlazeId, baseGlazeId) : "";
  const layerOrderSummary =
    selectedTopGlaze && selectedBaseGlaze
      ? `${formatGlazeLabel(selectedTopGlaze)} over ${formatGlazeLabel(selectedBaseGlaze)}`
      : null;

  return (
    <div className="grid gap-6">
      <input type="hidden" name="topGlazeId" value={topGlazeId} />
      <input type="hidden" name="baseGlazeId" value={baseGlazeId} />
      <input type="hidden" name="pairKey" value={pairKey} />
      <input type="hidden" name="coneValue" value={coneChoice} />

      <div className="grid gap-4 md:grid-cols-2">
        <GlazeCombobox
          disabled={disabled}
          emptyText="No top-glaze matches yet. Try a shorter code, brand, or glaze name."
          excludedGlazeId={baseGlazeId}
          glazes={glazes}
          helperText="Type to narrow the glaze that sits on top, then pick it from the inline dropdown."
          label="Layer 1"
          placeholder="Search top glaze by brand, code, name, or cone"
          query={topQuery}
          roleLabel="Top glaze"
          selectedGlazeId={topGlazeId}
          onQueryChange={setTopQuery}
          onSelect={setTopGlazeId}
        />
        <GlazeCombobox
          disabled={disabled}
          emptyText="No base-glaze matches yet. Try a shorter code, brand, or glaze name."
          excludedGlazeId={topGlazeId}
          glazes={glazes}
          helperText="Type to narrow the glaze that sits underneath, then pick it from the inline dropdown."
          label="Layer 2"
          placeholder="Search base glaze by brand, code, name, or cone"
          query={baseQuery}
          roleLabel="Base glaze"
          selectedGlazeId={baseGlazeId}
          onQueryChange={setBaseQuery}
          onSelect={setBaseGlazeId}
        />
      </div>

      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={layerOrderSummary ? "success" : "neutral"}>
            {layerOrderSummary ? "Layer order ready" : "Choose both layers"}
          </Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Ordered result</p>
        </div>

        <div className="border border-border bg-panel px-4 py-4">
          <p className="text-sm leading-6 text-foreground/90">
            {layerOrderSummary
              ? layerOrderSummary
              : "Pick a top glaze and a base glaze to lock the order before publishing."}
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Upload the fired example photo</span>
          <Input name="image" type="file" accept="image/*" required disabled={disabled} />
          <span className="text-xs leading-5 text-muted">
            Use the clearest fired photo you have. Cropped close-ups are fine if they show the surface response well.
          </span>
        </label>
      </Panel>

      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={coneChoice ? "success" : "neutral"}>{coneChoice || "Pick one cone"}</Badge>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Firing temperature</p>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground">Which firing range does this result belong to?</p>
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
                      ? "border-foreground bg-foreground text-white"
                      : "border-border bg-panel text-foreground hover:bg-white",
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-5 text-muted">
            Pick one of the supported firing groups so the example stays filterable later.
          </p>
        </div>
      </Panel>

      <div className="grid gap-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Result notes</p>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            What happened once it came out of the kiln?
          </span>
          <Textarea
            name="caption"
            placeholder="Describe the visual result, clay body, and the main surprise or takeaway from the firing."
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Application</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">How did you apply the layers?</span>
            <Textarea
              name="applicationNotes"
              placeholder="Number of coats, overlap area, dip or brush details, and any thickness notes."
            />
          </label>
        </div>

        <div className="grid gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Firing</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              What kiln context should another potter know?
            </span>
            <Textarea
              name="firingNotes"
              placeholder="Cone, atmosphere, cool-down, shelf position, clay body, or anything unusual that affected the result."
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">
          Published examples help other members compare your ordered layering result against vendor references.
        </p>
        <Button type="submit" disabled={disabled || !layerOrderSummary || !coneChoice}>
          Publish member example
        </Button>
      </div>
    </div>
  );
}
