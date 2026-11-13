import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { EmptyNote, MemberLink, SectionTitle, linkClass } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { getAdminCounts, getAdminOverview, requireAdminViewer } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

function describeEvent(eventType: string, metadata: Record<string, unknown>) {
  switch (eventType) {
    case "combination_publish":
      return `Published "${String(metadata.title ?? "a combination")}"`;
    case "glaze_create":
      return `Added the glaze ${String(metadata.glaze_name ?? "")}`.trim();
    case "buy_click":
      return `Clicked through to ${String(metadata.store_name ?? "a store")}`;
    case "brand_request":
      return `Requested the brand ${String(metadata.brand_name ?? "")}`.trim();
    case "guide_error_report":
      return `Reported a guide issue in ${String(metadata.section_label ?? "a guide")}`;
    default:
      return eventType.replace(/_/g, " ");
  }
}

export default async function AdminOverviewPage() {
  await requireAdminViewer();
  const [counts, overview] = await Promise.all([getAdminCounts(), getAdminOverview()]);

  const attention = [
    {
      label: "Submissions to review",
      count: counts.pendingSubmissions,
      href: "/admin/moderation",
      detail: `${counts.pendingCombinations} combinations · ${counts.pendingGlazes} glazes · ${counts.pendingPhotos} photos`,
    },
    {
      label: "Reported posts",
      count: counts.openReports,
      href: "/admin/moderation?type=reports",
      detail: "Open reports from members",
    },
    {
      label: "Brand requests",
      count: counts.pendingRequests,
      href: "/admin/requests",
      detail: "Brands members want in the library",
    },
    {
      label: "Imports queued",
      count: counts.queuedIntakes,
      href: "/admin/intake",
      detail: "External examples awaiting review",
    },
  ];
  const { stats } = overview;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        description="What needs your attention right now, and how the site is doing."
      />

      <section className="space-y-3">
        <SectionTitle>Needs attention</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attention.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group border p-4 transition-colors hover:border-foreground/40",
                item.count > 0 ? "border-foreground/25 bg-panel" : "border-border",
              )}
            >
              <p className={cn("text-3xl font-semibold leading-none tabular-nums", item.count === 0 && "text-muted")}>
                {item.count}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em]">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.count === 0 ? "All clear" : item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle aside={<Link href="/admin/analytics" className={linkClass}>Full analytics</Link>}>
          The site
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Members" value={stats.totalUsers.toLocaleString()} />
          <StatTile label="New this week" value={stats.newUsers7d.toLocaleString()} />
          <StatTile label="Combinations" value={stats.publishedCombinations.toLocaleString()} />
          <StatTile label="Custom glazes" value={stats.customGlazes.toLocaleString()} />
          <StatTile label="Comments" value={stats.comments.toLocaleString()} />
          <StatTile label="Inventory items" value={stats.inventoryItems.toLocaleString()} />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle aside={<Link href="/admin/users" className={linkClass}>All members</Link>}>
            Newest members
          </SectionTitle>
          {overview.recentUsers.length ? (
            <ul className="divide-y divide-border border border-border">
              {overview.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      <MemberLink id={user.id} name={user.displayName} />
                    </p>
                    <p className="truncate text-xs text-muted">{user.email || "No email"}</p>
                  </div>
                  <time dateTime={user.createdAt} className="shrink-0 text-xs text-muted">
                    {format(new Date(user.createdAt), "d MMM yyyy")}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No members yet.</EmptyNote>
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle>Recent activity</SectionTitle>
          {overview.recentActivity.length ? (
            <ul className="divide-y divide-border border border-border">
              {overview.recentActivity.map((event) => (
                <li key={event.id} className="px-4 py-3">
                  <p className="text-sm [overflow-wrap:anywhere]">{describeEvent(event.eventType, event.metadata)}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {event.userId ? (
                      <MemberLink id={event.userId} name={event.userName ?? "Unknown member"} />
                    ) : (
                      "A visitor"
                    )}{" "}
                    · {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>Nothing has happened yet.</EmptyNote>
          )}
        </section>
      </div>
    </div>
  );
}
