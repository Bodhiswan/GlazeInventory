import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { EmptyNote, MemberLink, SectionTitle, linkClass } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { getLikesOverview, requireAdminViewer, type LikedItem } from "@/lib/data/admin";

function Target({ label, href }: { label: string; href: string | null }) {
  return href ? (
    <Link href={href} className={linkClass}>
      {label}
    </Link>
  ) : (
    <span>{label}</span>
  );
}

function Ranking({ items, empty }: { items: LikedItem[]; empty: string }) {
  if (!items.length) return <EmptyNote>{empty}</EmptyNote>;
  const most = items[0].likes;

  return (
    <ol className="divide-y divide-border border border-border">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3">
          <span className="w-5 shrink-0 text-xs tabular-nums text-muted">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              <Target label={item.label} href={item.href} />
            </p>
            {item.ownerName ? (
              <p className="truncate text-xs text-muted">
                by <MemberLink id={item.ownerId} name={item.ownerName} />
              </p>
            ) : null}
            <div className="mt-1.5 h-1 bg-border" aria-hidden="true">
              <div className="h-1 bg-foreground/70" style={{ width: `${Math.max(4, (item.likes / most) * 100)}%` }} />
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums">{item.likes.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function AdminLikesPage() {
  await requireAdminViewer();
  const { stats, topCombinations, topGlazes, recent } = await getLikesOverview();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Likes"
        description="What members are liking. Liking a glaze or a combination also saves it to that member's list."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Likes in total" value={stats.total.toLocaleString()} />
        <StatTile label="This week" value={stats.last7d.toLocaleString()} />
        <StatTile label="On combinations" value={stats.onCombinations.toLocaleString()} />
        <StatTile label="On glazes" value={stats.onGlazes.toLocaleString()} />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle>Most liked combinations</SectionTitle>
          <Ranking items={topCombinations} empty="No combinations have been liked yet." />
        </section>
        <section className="space-y-3">
          <SectionTitle>Most liked glazes</SectionTitle>
          <Ranking items={topGlazes} empty="No glazes have been liked yet." />
        </section>
      </div>

      <section className="space-y-3">
        <SectionTitle aside="Latest 30">Recent likes</SectionTitle>
        {recent.length ? (
          <ul className="divide-y divide-border border border-border text-sm">
            {recent.map((like) => (
              <li key={like.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-2.5">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <MemberLink id={like.userId} name={like.userName} /> liked{" "}
                  <Target label={like.label} href={like.href} />
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {like.kind} · {formatDistanceToNow(new Date(like.createdAt), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>No likes yet.</EmptyNote>
        )}
      </section>
    </div>
  );
}
