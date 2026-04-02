import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="display-font mt-2 text-[clamp(2rem,7vw,3.6rem)] leading-[0.95] tracking-[-0.03em] text-balance">
          {title}
        </h1>
        <p className="mt-3 max-w-none text-sm leading-6 text-muted sm:max-w-2xl">{description}</p>
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto [&>*]:w-full sm:[&>*]:w-auto [&>form]:w-full sm:[&>form]:w-auto [&>form>button]:w-full sm:[&>form>button]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
