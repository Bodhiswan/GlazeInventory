import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Package, ShoppingCart, Star } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getAdminUserDetail } from "@/lib/data";
import { requireViewer } from "@/lib/data/users";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
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

  const { userId } = await params;

  let detail;
  try {
    detail = await getAdminUserDetail(userId);
  } catch (e) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Error loading user</h1>
        <p className="mt-3 text-sm leading-6 text-muted font-mono">{e instanceof Error ? e.message : String(e)}</p>
      </Panel>
    );
  }

  if (!detail) notFound();

  const { profile, inventory, activity } = detail;
  const totalItems = inventory.owned.length + inventory.wishlist.length + inventory.archived.length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin / Analytics"
        title={profile.displayName ?? profile.email}
        description={profile.displayName ? profile.email : undefined}
        actions={
          <Link href="/admin/analytics" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to analytics
          </Link>
        }
      />

      {/* ── Profile info ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Joined</p>
          <p className="text-sm font-medium text-foreground">{format(new Date(profile.createdAt), "d MMM yyyy")}</p>
          <p className="text-xs text-muted">{formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}</p>
        </Panel>

        <Panel className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Studio</p>
          <p className="text-sm font-medium text-foreground">{profile.studioName ?? "—"}</p>
          {profile.location ? <p className="text-xs text-muted">{profile.location}</p> : null}
        </Panel>

        <Panel className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Preferences</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.preferredCone ? <Badge tone="neutral">{profile.preferredCone}</Badge> : null}
            {profile.preferredAtmosphere ? <Badge tone="neutral">{profile.preferredAtmosphere}</Badge> : null}
            {!profile.preferredCone && !profile.preferredAtmosphere ? <p className="text-sm text-muted">Not set</p> : null}
          </div>
        </Panel>

        <Panel className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Activity</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1 text-foreground"><Star className="h-3.5 w-3.5 text-muted" />{activity.ratingsCount} ratings</span>
            <span className="flex items-center gap-1 text-foreground">{activity.commentsCount} comments</span>
            <span className="flex items-center gap-1 text-foreground">{activity.postsCount} posts</span>
          </div>
        </Panel>
      </section>

      {/* ── Inventory: Owned ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <Package className="h-4 w-4 text-muted" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Owned glazes ({inventory.owned.length})
          </p>
        </div>
        <Panel className="divide-y divide-border p-0">
          {inventory.owned.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No owned glazes.</p>
          ) : (
            inventory.owned.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.brand}{item.code ? ` · ${item.code}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.quantity > 1 ? <Badge tone="neutral">x{item.quantity}</Badge> : null}
                  {item.fillLevel !== "full" ? (
                    <Badge tone={item.fillLevel === "low" ? "accent" : "neutral"}>{item.fillLevel}</Badge>
                  ) : null}
                  {item.notes ? (
                    <span className="max-w-[160px] truncate text-xs text-muted" title={item.notes}>{item.notes}</span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </Panel>
      </section>

      {/* ── Wishlist ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Wishlist ({inventory.wishlist.length})
        </p>
        <Panel className="divide-y divide-border p-0">
          {inventory.wishlist.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No wishlist items.</p>
          ) : (
            inventory.wishlist.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.brand}{item.code ? ` · ${item.code}` : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </Panel>
      </section>

      {/* ── Archived ── */}
      {inventory.archived.length > 0 ? (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Archived ({inventory.archived.length})
          </p>
          <Panel className="divide-y divide-border p-0">
            {inventory.archived.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.brand}{item.code ? ` · ${item.code}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}

      {/* ── Buy clicks ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-4 w-4 text-muted" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Buy clicks ({activity.buyClicks.length})
          </p>
        </div>
        <Panel className="divide-y divide-border p-0">
          {activity.buyClicks.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No buy clicks recorded.</p>
          ) : (
            activity.buyClicks.map((click, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {click.glazeName ?? "Unknown glaze"}
                    {click.glazeBrand ? <span className="ml-1.5 text-xs text-muted">({click.glazeBrand})</span> : null}
                  </p>
                  <p className="text-xs text-muted">{click.storeName ?? "Unknown store"}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatDistanceToNow(new Date(click.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </Panel>
      </section>

      <p className="text-xs text-muted">
        Showing {totalItems} total inventory items for this user.
      </p>
    </div>
  );
}
