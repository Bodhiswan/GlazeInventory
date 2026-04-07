import { format, formatDistanceToNow } from "date-fns";
import { BarChart3, MousePointerClick, Package, ShoppingCart, Star, Users } from "lucide-react";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { getAnalyticsDashboard, requireViewer } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-4 border border-border bg-panel p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-background">
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const viewer = await requireViewer();

  if (!viewer.profile.isAdmin) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Access required</h1>
        <p className="mt-3 text-sm leading-6 text-muted">This screen is only available for administrators.</p>
      </Panel>
    );
  }

  // Verify admin client is available
  const adminCheck = createSupabaseAdminClient();
  if (!adminCheck) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Configuration error</h1>
        <p className="mt-3 text-sm leading-6 text-muted">SUPABASE_SERVICE_ROLE_KEY is not set. Add it to Vercel environment variables.</p>
      </Panel>
    );
  }

  let dashboard;
  try {
    dashboard = await getAnalyticsDashboard();
  } catch (e) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Analytics error</h1>
        <p className="mt-3 text-sm leading-6 text-muted font-mono text-xs">{e instanceof Error ? e.message : String(e)}</p>
      </Panel>
    );
  }
  const { stats } = dashboard;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Analytics"
        description="User activity, popular glazes, and buy-click tracking across the library."
      />

      {/* ── Summary stats ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Overview</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard label="Total users" value={stats.totalUsers} icon={Users} />
          <StatCard label="New (7 days)" value={stats.newUsers7d} icon={Users} />
          <StatCard label="New (30 days)" value={stats.newUsers30d} icon={Users} />
          <StatCard label="With inventory" value={stats.usersWithInventory} sub={`${stats.totalInventoryItems} items total`} icon={Package} />
          <StatCard label="Buy clicks" value={stats.totalBuyClicks} icon={ShoppingCart} />
          <StatCard label="Ratings given" value={stats.totalRatings} icon={Star} />
          <StatCard label="Comments posted" value={stats.totalComments} icon={BarChart3} />
          <StatCard label="Published posts" value={stats.totalPublishedPosts} icon={MousePointerClick} />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* ── Top glazes by inventory ── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Most added to inventory</p>
          <Panel className="divide-y divide-border p-0">
            {dashboard.topGlazesByInventory.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No data yet.</p>
            ) : (
              dashboard.topGlazesByInventory.map((glaze, i) => (
                <div key={glaze.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{glaze.name}</p>
                    <p className="text-xs text-muted">
                      {glaze.brand}{glaze.code ? ` · ${glaze.code}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{glaze.count}</span>
                </div>
              ))
            )}
          </Panel>
        </section>

        {/* ── Top glazes by buy clicks ── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Most buy-clicks</p>
          <Panel className="divide-y divide-border p-0">
            {dashboard.topGlazesByBuyClicks.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No buy clicks tracked yet.</p>
            ) : (
              dashboard.topGlazesByBuyClicks.map((glaze, i) => (
                <div key={glaze.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{glaze.name}</p>
                    <p className="text-xs text-muted">
                      {glaze.brand}{glaze.code ? ` · ${glaze.code}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{glaze.count}</span>
                </div>
              ))
            )}
          </Panel>
        </section>

        {/* ── Buy clicks by store ── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Buy clicks by store</p>
          <Panel className="divide-y divide-border p-0">
            {dashboard.buyClicksByStore.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No clicks yet.</p>
            ) : (
              dashboard.buyClicksByStore.map(({ storeName, count }) => (
                <div key={storeName} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{storeName}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{count}</span>
                </div>
              ))
            )}
          </Panel>
        </section>

        {/* ── Recent buy clicks ── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Recent buy clicks</p>
          <Panel className="divide-y divide-border p-0">
            {dashboard.recentBuyClicks.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No buy clicks yet.</p>
            ) : (
              dashboard.recentBuyClicks.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {event.glazeName ?? "Unknown glaze"}
                      {event.glazeBrand ? <span className="ml-1.5 text-xs text-muted">({event.glazeBrand})</span> : null}
                    </p>
                    <p className="text-xs text-muted">{event.storeName ?? "Unknown store"}</p>
                  </div>
                  <span
                    className="shrink-0 text-xs text-muted"
                    title={format(new Date(event.createdAt), "d MMM yyyy HH:mm")}
                  >
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </Panel>
        </section>
      </div>

      {/* ── Users table ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Recent users ({stats.totalUsers} total)</p>
        <Panel className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">Email</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">Display name</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted">Inventory</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dashboard.recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/analytics/${user.id}`} className="text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground">
                        {user.email}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{user.displayName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{user.inventoryCount}</td>
                    <td className="px-4 py-2.5 text-right text-muted">
                      {format(new Date(user.createdAt), "d MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <p className="text-xs text-muted">
        Page views tracked via Vercel Analytics. Buy-click tracking started {format(new Date("2026-04-05"), "d MMM yyyy")}.
      </p>
    </div>
  );
}
