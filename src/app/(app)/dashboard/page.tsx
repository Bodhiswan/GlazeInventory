import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { SetupCallout } from "@/components/setup-callout";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getInventory, getInventoryFolders, getWeeklyLeaderboard } from "@/lib/data";
import { requireViewer } from "@/lib/data/users";

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const [inventory, folders, weeklyLeaderboard] = await Promise.all([
    getInventory(viewer.profile.id),
    getInventoryFolders(viewer.profile.id),
    getWeeklyLeaderboard(),
  ]);
  const ownedItems = inventory.filter((item) => item.status === "owned");
  const wishlistItems = inventory.filter((item) => item.status === "wishlist");
  const emptyItems = inventory.filter((item) => item.status === "archived");

  return (
    <div className="space-y-8">
      {viewer.mode === "demo" ? <SetupCallout compact /> : null}

      <PageHeader
        eyebrow="Workspace"
        title={`Welcome back, ${viewer.profile.displayName.split(" ")[0]}`}
        description="Keep track of what is on your shelf, what is on your wishlist, and how your glazes are grouped for real studio work."
        actions={
          <>
            <Link href="/glazes" className={buttonVariants({})}>
              Open library
            </Link>
            <Link href="/inventory" className={buttonVariants({ variant: "ghost" })}>
              View inventory
            </Link>
          </>
        }
      />

      {/* ── Points system ── */}
      <section className="grid gap-5 xl:grid-cols-2">
        {/* Explainer */}
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Contribution points</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">Earn points by helping build the library</h2>
          </div>
          <Panel className="space-y-0 divide-y divide-border">
            {[
              { action: "Add a custom glaze to the catalog", pts: "10 pts" },
              { action: "Share a combination", pts: "5 pts" },
              { action: "Upload a community firing photo", pts: "2 pts" },
              { action: "Leave a comment", pts: "0.1 pts", cap: "max 50" },
              { action: "Vote on glaze tags", pts: "0.1 pts", cap: "max 50" },
              { action: "Receive an upvote on your content", pts: "1 pt" },
            ].map(({ action, pts, cap }) => (
              <div key={action} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-foreground">{action}</p>
                <div className="flex shrink-0 items-center gap-2">
                  {cap ? (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted">{cap}</span>
                  ) : null}
                  <span className="w-14 text-right text-sm font-medium tabular-nums text-foreground">{pts}</span>
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
        </div>

        {/* Weekly leaderboard */}
        <div className="space-y-4">
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
                No contributions yet this week — be the first to earn points by adding a glaze, sharing a combination, or uploading a firing photo.
              </p>
              <Link
                href="/contribute"
                className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-4" })}
              >
                Go to contribute →
              </Link>
            </Panel>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Your inventory</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Pieces you can act on right now</h2>
            </div>
            <Link href="/inventory" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View inventory
            </Link>
          </div>

          <div className="grid gap-4">
            {[...ownedItems, ...wishlistItems].slice(0, 5).map((item) => (
              <Panel key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{item.glaze.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {[item.glaze.brand, item.glaze.code, item.glaze.cone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={item.status === "owned" ? "success" : "accent"}>
                    {item.status === "owned" ? "Owned" : "Wishlist"}
                  </Badge>
                  <Link
                    href={`/glazes/${item.glaze.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full sm:w-auto" })}
                  >
                    Open glaze
                  </Link>
                </div>
              </Panel>
            ))}
            {!ownedItems.length && !wishlistItems.length ? (
              <Panel>
                <p className="text-sm leading-6 text-muted">
                  You have not saved anything yet. Start in the library and put some on your shelf or wishlist.
                </p>
              </Panel>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Catalog workflow</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">Work straight from the library</h2>
          </div>
          <Panel className="space-y-4">
            <p className="text-sm leading-6 text-muted">
              Browse Mayco, AMACO, Coyote, Duncan, Spectrum, and Speedball glazes, save them to your shelf or wishlist directly from the library, and use folders to organize them around actual projects.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/glazes" className={buttonVariants({})}>
                Open library
              </Link>
              <Link href="/inventory" className={buttonVariants({ variant: "ghost" })}>
                Review inventory
              </Link>
            </div>
          </Panel>
        </div>
      </section>

      <Panel className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Current focus</p>
            <h3 className="display-font mt-2 text-3xl tracking-tight">
              Inventory first, combinations later.
            </h3>
          </div>

          <Badge tone="success">Multi-brand inventory workflow</Badge>
        </div>
      </Panel>
    </div>
  );
}
