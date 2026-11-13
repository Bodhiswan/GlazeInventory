import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const ACTION_TONES = {
  neutral: "border-border bg-panel text-foreground hover:border-foreground/40",
  approve: "border-accent-3/50 bg-accent-3/10 text-accent-3 hover:bg-accent-3/20",
  danger: "border-[#7f2d22]/40 bg-[#7f2d22]/5 text-[#7f2d22] hover:bg-[#7f2d22]/15",
};

/** Class for the small action buttons used across admin lists. */
export function actionClass(tone: keyof typeof ACTION_TONES = "neutral") {
  return cn(
    // `!` because globals.css sets `button { font: inherit }` outside any layer.
    "inline-flex h-8 cursor-pointer items-center border px-3 !text-[10px] !font-medium uppercase tracking-[0.14em] transition-colors",
    ACTION_TONES[tone],
  );
}

export const linkClass = "underline decoration-border underline-offset-2 hover:decoration-foreground";

export function Tabs({
  tabs,
  active,
  label,
}: {
  tabs: Array<{ key: string; label: string; href: string; count?: number }>;
  active: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={cn(
            "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] transition-colors",
            tab.key === active
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground",
          )}
        >
          {tab.label}
          {tab.count ? (
            <span className="bg-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-normal text-background tabular-nums">
              {tab.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

const STATE_TONES: Record<string, string> = {
  pending: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  approved: "border-accent-3/40 bg-accent-3/10 text-accent-3",
  added: "border-accent-3/40 bg-accent-3/10 text-accent-3",
  rejected: "border-[#7f2d22]/40 bg-[#7f2d22]/5 text-[#7f2d22]",
  declined: "border-border text-muted",
};

/** `state` picks the colour; `label` overrides the text shown. */
export function StateBadge({ state, label }: { state: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
        STATE_TONES[state] ?? "border-border text-muted",
      )}
    >
      {label ?? state}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{children}</h2>
      {aside ? <div className="text-xs text-muted">{aside}</div> : null}
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-border px-4 py-8 text-center text-sm text-muted">{children}</p>
  );
}

export function MemberLink({ id, name }: { id: string | null; name: string }) {
  if (!id) return <span>{name}</span>;
  return (
    <Link href={`/admin/users/${id}`} className={linkClass}>
      {name}
    </Link>
  );
}
