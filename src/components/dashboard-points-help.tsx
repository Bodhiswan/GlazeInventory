"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { buttonVariants } from "@/components/ui/button";

const KEY = "glaze-library-points-help-dismissed-v1";

const ROWS = [
  { action: "Add a custom glaze to the catalog", pts: "10 pts" },
  { action: "Share a combination", pts: "5 pts" },
  { action: "Upload a community firing photo", pts: "2 pts" },
  { action: "Leave a comment", pts: "0.1 pts", cap: "max 50" },
  { action: "Vote on glaze tags", pts: "0.1 pts", cap: "max 50" },
  { action: "Receive an upvote on your content", pts: "1 pt" },
];

export function DashboardPointsHelp() {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      if (localStorage.getItem(KEY)) setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  if (hydrated && dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">How to earn points</p>
          <h2 className="display-font mt-2 text-3xl tracking-tight">Help build the library</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss how to earn points"
          className="mt-1 text-muted transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <Panel className="space-y-0 divide-y divide-border">
        {ROWS.map(({ action, pts, cap }) => (
          <div key={action} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <p className="text-sm text-foreground">{action}</p>
            <div className="flex shrink-0 items-center gap-2">
              {cap ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">{cap}</span>
              ) : null}
              <span className="w-14 text-right text-sm font-medium tabular-nums text-foreground">
                {pts}
              </span>
            </div>
          </div>
        ))}
      </Panel>
      <p className="text-sm text-muted">
        Points appear on your profile and on the{" "}
        <Link href="/contribute" className="underline underline-offset-2 hover:text-foreground">
          People to thank
        </Link>{" "}
        leaderboard on the Contribute page.
      </p>
    </section>
  );
}
