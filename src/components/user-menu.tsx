"use client";

import Link from "next/link";
import { useState } from "react";

import type { PointsBreakdownEntry } from "@/lib/types";

export function UserMenu({
  displayName,
  points = 0,
  pointsBreakdown = [],
}: {
  displayName: string;
  points?: number;
  pointsBreakdown?: PointsBreakdownEntry[];
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* ── Points badge ── */}
      <div
        className="relative"
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
      >
          <div className="flex cursor-default items-center gap-1.5 border border-border bg-panel px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px] sm:tracking-[0.16em]">
            <span className="tabular-nums text-foreground">{points.toLocaleString()}</span>
            <span>pts</span>
          </div>

          {tooltipOpen && pointsBreakdown.length > 0 ? (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-border bg-background shadow-sm">
              <p className="border-b border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                Your points breakdown
              </p>
              <div className="divide-y divide-border">
                {pointsBreakdown.map((entry) => (
                  <div key={entry.action} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span className="text-sm text-foreground">{entry.label}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted">
                      {entry.points % 1 === 0
                        ? entry.points.toLocaleString()
                        : entry.points.toFixed(1)}{" "}
                      pts
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">Total</span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {points.toLocaleString()} pts
                </span>
              </div>
            </div>
        ) : null}
      </div>

      {/* ── Username link ── */}
      <Link
        href="/profile"
        className="flex max-w-[11rem] items-center gap-1.5 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:bg-panel hover:text-foreground sm:max-w-[14rem] sm:text-[11px] sm:tracking-[0.16em]"
      >
        <span className="truncate">{displayName}</span>
      </Link>
    </div>
  );
}
