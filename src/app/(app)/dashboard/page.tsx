import Link from "next/link";

import { DashboardPointsHelp } from "@/components/dashboard-points-help";
import { DashboardWelcome } from "@/components/dashboard-welcome";
import { SetupCallout } from "@/components/setup-callout";
import { Panel } from "@/components/ui/panel";
import { buttonVariants } from "@/components/ui/button";
import { getWeeklyLeaderboard } from "@/lib/data/admin";
import { requireViewer } from "@/lib/data/users";

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const weeklyLeaderboard = await getWeeklyLeaderboard();

  return (
    <div className="space-y-8">
      {viewer.mode === "demo" ? <SetupCallout compact /> : null}

      {/* Welcome + tutorial */}
      <DashboardWelcome displayName={viewer.profile.displayName} />

      {/* Your points */}
      {viewer.mode === "live" ? (
        <section className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Your points</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">Contribution score</h2>
          </div>
          <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="display-font text-5xl tabular-nums text-foreground">
                {(viewer.profile.points ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-muted">
                points earned by helping build the Glaze Inventory community
              </p>
            </div>
            <Link href="/contribute" className={buttonVariants({})}>
              Contribute
            </Link>
          </Panel>
        </section>
      ) : null}

      {/* How to gain points (dismissable) */}
      <DashboardPointsHelp />

      {/* Weekly leaderboard */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">This week</p>
          <h2 className="display-font mt-2 text-3xl tracking-tight">Top contributors this week</h2>
        </div>
        {weeklyLeaderboard.length > 0 ? (
          <div className="divide-y divide-border border border-border">
            {weeklyLeaderboard.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{contributor.displayName}</p>
                  {contributor.studioName ? (
                    <p className="truncate text-xs text-muted">{contributor.studioName}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  {contributor.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Panel>
            <p className="text-sm leading-6 text-muted">
              No contributions yet this week — be the first to earn points by adding a glaze, sharing a
              combination, or uploading a firing photo.
            </p>
            <Link
              href="/contribute"
              className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-4" })}
            >
              Go to contribute →
            </Link>
          </Panel>
        )}
      </section>
    </div>
  );
}
