import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PanelTone = "default" | "terracotta" | "rose" | "butter" | "sage";

const toneClasses: Record<PanelTone, string> = {
  default: "bg-panel-strong border-border",
  terracotta: "bg-tile-terracotta border-clay/20",
  rose: "bg-tile-rose border-rose/20",
  butter: "bg-tile-butter border-butter/25",
  sage: "bg-tile-sage border-sage/25",
};

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  tone?: PanelTone;
};

export function Panel({ className, tone = "default", ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "border p-4 sm:p-5 lg:p-6",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
