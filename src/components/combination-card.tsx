import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import type { CombinationSummary } from "@/lib/types";
import { formatGlazeLabel, formatGlazeMeta } from "@/lib/utils";

export function CombinationCard({ pair }: { pair: CombinationSummary }) {
  return (
    <Link href={`/combinations/${pair.pairKey}`}>
      <Panel className="h-full transition hover:-translate-y-0.5 hover:bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-muted">Owned combination</p>
            <h3 className="display-font mt-2 text-2xl tracking-tight">
              {pair.glazes.map((glaze) => glaze.name).join(" + ")}
            </h3>
          </div>
          <Badge tone={pair.postCount ? "accent" : "neutral"}>
            {pair.postCount} example{pair.postCount === 1 ? "" : "s"}
          </Badge>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {pair.glazes.map((glaze) => (
            <div key={`${glaze.id}-image`} className="overflow-hidden border border-border bg-panel">
              {glaze.imageUrl ? (
                <img
                  src={glaze.imageUrl}
                  alt={`${glaze.brand ?? "Glaze"} ${glaze.name}`}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-32 items-center justify-center px-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted">
                  No image
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3 text-sm text-muted">
          {pair.glazes.map((glaze) => (
            <div key={glaze.id}>
              <p className="font-semibold text-foreground">{formatGlazeLabel(glaze)}</p>
              <p>{formatGlazeMeta(glaze)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </Link>
  );
}
