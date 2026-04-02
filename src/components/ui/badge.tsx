import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "bg-transparent text-foreground/70 ring-1 ring-border",
  accent: "bg-transparent text-accent-2 ring-1 ring-accent-2/20",
  success: "bg-transparent text-accent-3 ring-1 ring-accent-3/20",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
