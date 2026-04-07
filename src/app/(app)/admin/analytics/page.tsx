import { format, formatDistanceToNow } from "date-fns";
import {
  BarChart3,
  Eye,
  Layers3,
  Package,
  PenLine,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  adminArchiveCombinationAction,
  adminDeleteCustomGlazeAction,
  adminFlagFalseContributionAction,
} from "@/app/actions";
import { CombinationPreviewModal } from "./combination-preview-modal";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { type AdminDashboard, type DashboardRange, getAdminDashboard } from "@/lib/data/admin";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const RANGE_LABELS: Record<DashboardRange, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
  all: "all time",
};

function eventIcon(eventType: string) {
  switch (eventType) {
    case "glaze_view": return Eye;
    case "glaze_create": return PenLine;
    case "combination_publish": return Layers3;
    case "buy_click": return ShoppingCart;
    default: return BarChart3;
  }
}

function eventLabel(eventType: string, metadata: Record<string, unknown>): string {
  switch (eventType) {
    case "glaze_view":
      return `Viewed ${[metadata.glaze_brand, metadata.glaze_name].filter(Boolean).join(" ") || "a glaze"}`;
    case "glaze_create":
      return `Created glaze "${[metadata.brand, metadata.name].filter(Boolean).join(" ") || "custom glaze"}"`;
    case "combination_publish":
      return `Published "${String(metadata.title ?? "a combination")}"`;
    case "buy_click":
      return `Clicked buy at ${String(metadata.store_name ?? "a store")}`;
    default:
      return eventType.replace(/_/g, " ");
  }
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-3 border p-4", accent ? "border-foreground/20 bg-foreground/5" : "border-border bg-panel")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-background">
        <Icon className="h-3.5 w-3.5 text-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums leading-none text-foreground">{value}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{children}</p>;
}

function CollapsibleSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group space-y-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 select-none">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
        <span className="text-[10px] text-muted transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-3">{children}</div>
    </details>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const viewer = await requireViewer();

  if (!viewer.profile.isAdmin) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Access required</h1>
        <p className="mt-3 text-sm leading-6 text-muted">This screen is only available for administrators.</p>
      </Panel>
    );
  }

  const adminCheck = createSupabaseAdminClient();
  if (!adminCheck) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Configuration error</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          SUPABASE_SERVICE_ROLE_KEY is not set. Add it to Vercel environment variables.
        </p>
      </Panel>
    );
  }

  const params = await searchParams;
  const rawRange = params.range;
  const range: DashboardRange =
    rawRange === "7d" || rawRange === "30d" || rawRange === "90d" || rawRange === "all"
      ? rawRange
      : "30d";

  let dashboard: AdminDashboard;
  try {
    dashboard = await getAdminDashboard(range);
  } catch (e) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Dashboard error</h1>
        <p className="mt-3 font-mono text-xs text-muted">{e instanceof Error ? e.message : String(e)}</p>
      </Panel>
    );
  }

  const { stats } = dashboard;

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Admin"
          title="Dashboard"
          description={`Showing activity for the ${RANGE_LABELS[range]}.`}
        />
        <Link
          href="/admin/analytics/moderation"
          className="border border-border bg-panel px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-foreground hover:text-background"
        >
          Moderation queue →
        </Link>
        <div className="flex items-center gap-1 border border-border bg-panel p-1">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/analytics?range=${r.value}`}
              className={cn(
                "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors",
                range === r.value
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground",
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stats grid ── */}
      <CollapsibleSection label={`Overview · ${RANGE_LABELS[range]}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Total users" value={stats.totalUsers} icon={Users} />
          <StatCard label="New users" value={stats.newUsers} icon={Users} accent />
          <StatCard label="Glaze views" value={stats.glazeViews} icon={Eye} accent />
          <StatCard label="Combinations" value={stats.combinationsPublished} icon={Layers3} accent />
          <StatCard label="Custom glazes" value={stats.customGlazesCreated} icon={PenLine} accent />
          <StatCard label="Buy clicks" value={stats.buyClicks} icon={ShoppingCart} accent />
          <StatCard label="Inventory items" value={stats.totalInventoryItems} icon={Package} />
        </div>
      </CollapsibleSection>

      {/* ── Main content: 3 columns ── */}
      <div className="grid gap-8 xl:grid-cols-3">

        {/* ── Activity feed ── */}
        <CollapsibleSection label="Recent activity">
          <Panel className="divide-y divide-border p-0">
            {dashboard.recentActivity.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No events yet.</p>
            ) : (
              dashboard.recentActivity.slice(0, 25).map((event) => {
                const Icon = eventIcon(event.eventType);
                return (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-border bg-background">
                      <Icon className="h-3 w-3 text-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {eventLabel(event.eventType, event.metadata)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {event.userId ? (
                          <Link href={`/admin/analytics/${event.userId}`} className="hover:text-foreground">
                            {event.userDisplayName ?? "Unknown user"}
                          </Link>
                        ) : "Anonymous"} · {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </Panel>
        </CollapsibleSection>

        {/* ── Recent combinations ── */}
        <CollapsibleSection label="Recent combinations">
          <div className="space-y-2">
            {dashboard.recentCombinations.length === 0 ? (
              <Panel><p className="text-sm text-muted">No combinations yet.</p></Panel>
            ) : (
              dashboard.recentCombinations.map((combo) => (
                <div key={combo.id} className="border border-border bg-panel">
                  <CombinationPreviewModal comboId={combo.id}>
                  <div className="flex items-start gap-3 p-3 transition-colors hover:bg-foreground/[0.03]">
                    <div className="h-12 w-12 shrink-0 overflow-hidden border border-border bg-white">
                      {combo.imageUrl ? (
                        <Image
                          src={combo.imageUrl}
                          alt={combo.title}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] text-muted">No img</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{combo.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        by {combo.authorName}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-[0.12em] text-muted">{combo.cone}</span>
                        <span className="text-[9px] uppercase tracking-[0.12em] text-muted">·</span>
                        <span className="text-[9px] uppercase tracking-[0.12em] text-muted">{combo.atmosphere}</span>
                        <span className={cn("ml-auto text-[9px] uppercase tracking-[0.12em]", combo.status === "published" ? "text-green-700" : "text-muted")}>
                          {combo.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  </CombinationPreviewModal>
                  <div className="flex items-center justify-between border-t border-border px-3 py-2">
                    <span className="text-[10px] text-muted">
                      {formatDistanceToNow(new Date(combo.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await adminFlagFalseContributionAction({
                            referenceId: combo.id,
                            authorUserId: combo.authorId,
                          });
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-100"
                        >
                          Flag
                        </button>
                      </form>
                      <form action={adminArchiveCombinationAction}>
                        <input type="hidden" name="exampleId" value={combo.id} />
                        <input type="hidden" name="action" value={combo.status === "published" ? "archive" : "restore"} />
                        <button
                          type="submit"
                          className={cn(
                            "text-[10px] uppercase tracking-[0.12em] transition-colors",
                            combo.status === "published"
                              ? "text-muted hover:text-foreground"
                              : "text-amber-700 hover:text-foreground",
                          )}
                        >
                          {combo.status === "published" ? "Archive" : "Restore"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleSection>

        {/* ── Recent custom glazes ── */}
        <CollapsibleSection label="Recent custom glazes">
          <div className="space-y-2">
            {dashboard.recentCustomGlazes.length === 0 ? (
              <Panel><p className="text-sm text-muted">No custom glazes yet.</p></Panel>
            ) : (
              dashboard.recentCustomGlazes.map((glaze) => (
                <div key={glaze.id} className="border border-border bg-panel">
                  <div className="p-3">
                    <Link href={`/glazes/${glaze.id}`} className="text-xs font-semibold text-foreground hover:underline">
                      {[glaze.brand, glaze.name].filter(Boolean).join(" ")}
                    </Link>
                    <p className="mt-0.5 text-[10px] text-muted">
                      by{" "}
                      <Link href={`/admin/analytics/${glaze.creatorId}`} className="hover:text-foreground">
                        {glaze.creatorName}
                      </Link>
                    </p>
                    {glaze.colorNotes ? (
                      <p className="mt-1 truncate text-[10px] text-muted">Colors: {glaze.colorNotes}</p>
                    ) : null}
                    {glaze.finishNotes ? (
                      <p className="mt-0.5 truncate text-[10px] text-muted">Finish: {glaze.finishNotes}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between border-t border-border px-3 py-2">
                    <span className="text-[10px] text-muted">
                      {formatDistanceToNow(new Date(glaze.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await adminFlagFalseContributionAction({
                            referenceId: glaze.id,
                            authorUserId: glaze.creatorId ?? "",
                          });
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-100"
                        >
                          Flag
                        </button>
                      </form>
                      <form action={adminDeleteCustomGlazeAction}>
                        <input type="hidden" name="glazeId" value={glaze.id} />
                        <button
                          type="submit"
                          className="text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-red-700"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* ── Bottom section: Users + Popular + Buy clicks ── */}
      <div className="grid gap-8 xl:grid-cols-3">

        {/* ── Users table ── */}
        <CollapsibleSection label={`Recent users (${stats.totalUsers} total)`} defaultOpen={true}>
          <Panel className="p-0">
            <div className="divide-y divide-border">
              {dashboard.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/analytics/${user.id}`}
                      className="block truncate text-xs font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                    >
                      {user.displayName ?? user.email}
                    </Link>
                    <p className="truncate text-[10px] text-muted">{user.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold tabular-nums text-foreground">{user.inventoryCount}</p>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-muted">items</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </CollapsibleSection>

        {/* ── Popular glazes ── */}
        <CollapsibleSection label="Most added to inventory (all time)">
          <Panel className="divide-y divide-border p-0">
            {dashboard.topGlazesByInventory.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No data yet.</p>
            ) : (
              dashboard.topGlazesByInventory.map((glaze, i) => (
                <div key={glaze.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/glazes/${glaze.id}`} className="block truncate text-xs font-medium text-foreground hover:underline">
                      {glaze.name}
                    </Link>
                    <p className="text-[10px] text-muted">{glaze.brand}{glaze.code ? ` · ${glaze.code}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">{glaze.count}</span>
                </div>
              ))
            )}
          </Panel>

          {dashboard.topGlazesByViews.length > 0 && (
            <>
              <SectionLabel>Most viewed · {RANGE_LABELS[range]}</SectionLabel>
              <Panel className="divide-y divide-border p-0">
                {dashboard.topGlazesByViews.map((glaze, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{glaze.glazeName}</p>
                      {glaze.glazeBrand ? <p className="text-[10px] text-muted">{glaze.glazeBrand}</p> : null}
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">{glaze.count}</span>
                  </div>
                ))}
              </Panel>
            </>
          )}
        </CollapsibleSection>

        {/* ── Buy clicks ── */}
        <CollapsibleSection label={`Buy clicks by store · ${RANGE_LABELS[range]}`}>
          <Panel className="divide-y divide-border p-0">
            {dashboard.buyClicksByStore.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No clicks yet.</p>
            ) : (
              dashboard.buyClicksByStore.map(({ storeName, count }) => (
                <div key={storeName} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-xs font-medium text-foreground">{storeName}</p>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{count}</span>
                </div>
              ))
            )}
          </Panel>

          <SectionLabel>Recent buy clicks</SectionLabel>
          <Panel className="divide-y divide-border p-0">
            {dashboard.recentBuyClicks.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No clicks yet.</p>
            ) : (
              dashboard.recentBuyClicks.map((click) => (
                <div key={click.id} className="flex items-start gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {click.glazeName ?? "Unknown glaze"}
                      {click.glazeBrand ? <span className="ml-1 text-muted">({click.glazeBrand})</span> : null}
                    </p>
                    <p className="text-[10px] text-muted">{click.storeName ?? "Unknown store"}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted" title={format(new Date(click.createdAt), "d MMM yyyy HH:mm")}>
                    {formatDistanceToNow(new Date(click.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </Panel>
        </CollapsibleSection>
      </div>

      <p className="text-[10px] text-muted">
        Tracking started 5 Apr 2026. Glaze views tracked from {format(new Date("2026-04-07"), "d MMM yyyy")}.
      </p>
    </div>
  );
}
