import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HeaderTone = "default" | "clay" | "rose" | "butter" | "sage";

const eyebrowClasses: Record<HeaderTone, string> = {
  default: "text-muted",
  clay: "text-clay",
  rose: "text-rose",
  butter: "text-butter",
  sage: "text-sage",
};

const borderClasses: Record<HeaderTone, string> = {
  default: "border-border",
  clay: "border-clay/40",
  rose: "border-rose/40",
  butter: "border-butter/40",
  sage: "border-sage/40",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: HeaderTone;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b pb-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between",
        borderClasses[tone],
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className={cn("text-[11px] uppercase tracking-[0.18em]", eyebrowClasses[tone])}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className="display-font mt-2 text-[clamp(2rem,7vw,3.6rem)] leading-[0.95] tracking-[-0.03em] text-balance">
          {title}
        </h1>
        {description ? <p className="mt-3 max-w-none text-sm leading-6 text-muted sm:max-w-2xl">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto [&>*]:w-full sm:[&>*]:w-auto [&>form]:w-full sm:[&>form]:w-auto [&>form>button]:w-full sm:[&>form>button]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
