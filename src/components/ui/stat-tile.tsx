import type { ElementType } from "react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  icon?: ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "border p-4",
        accent ? "border-foreground/20 bg-foreground/5" : "border-border bg-panel",
        Icon ? "flex items-start gap-3" : undefined,
      )}
    >
      {Icon ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-background">
          <Icon className="h-3.5 w-3.5 text-muted" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums leading-none text-foreground">{value}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        {sublabel ? <p className="mt-0.5 text-xs text-muted">{sublabel}</p> : null}
      </div>
    </div>
  );
}
