import { format } from "date-fns";
import Link from "next/link";

import { actionClass, MemberLink, StateBadge, Tabs } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/page-header";
import { getAllUsersForAdmin, requireAdminViewer, type AdminUserFilter } from "@/lib/data/admin";

const PAGE_SIZE = 50;
const FILTERS: Array<{ key: AdminUserFilter; label: string }> = [
  { key: "all", label: "Everyone" },
  { key: "admins", label: "Admins" },
  { key: "flagged", label: "With strikes" },
  { key: "disabled", label: "Contributions off" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string; sort?: string }>;
}) {
  await requireAdminViewer();

  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const filter = FILTERS.find((option) => option.key === sp.filter)?.key ?? "all";
  const sort = sp.sort === "points" ? "points" : "newest";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const { rows, total } = await getAllUsersForAdmin({
    search,
    filter,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (overrides: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    const values = { q: search, filter, sort, page: undefined, ...overrides };
    if (values.q) query.set("q", String(values.q));
    if (values.filter && values.filter !== "all") query.set("filter", String(values.filter));
    if (values.sort && values.sort !== "newest") query.set("sort", String(values.sort));
    if (values.page && Number(values.page) > 1) query.set("page", String(values.page));
    const qs = query.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Members"
        description="Find a member, see what they have contributed, and manage their access."
      />

      <Tabs
        label="Member filter"
        active={filter}
        tabs={FILTERS.map((option) => ({ ...option, href: href({ filter: option.key }) }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          {sort !== "newest" ? <input type="hidden" name="sort" value={sort} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search by name or email"
            aria-label="Search members"
            className="h-8 min-w-[220px] max-w-md flex-1 border border-border bg-background px-3 text-sm"
          />
          <button type="submit" className={actionClass()}>
            Search
          </button>
          {search ? (
            <Link href={href({ q: "" })} className={actionClass()}>
              Clear
            </Link>
          ) : null}
        </form>
        <p className="text-xs text-muted">
          {total.toLocaleString()} member{total === 1 ? "" : "s"} ·{" "}
          <Link href={href({ sort: sort === "points" ? "newest" : "points" })} className="underline underline-offset-2">
            {sort === "points" ? "Sort by newest" : "Sort by points"}
          </Link>
        </p>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-panel text-left text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Points</th>
              <th className="px-4 py-3 text-right font-medium">Strikes</th>
              <th className="px-4 py-3 text-right font-medium">Inventory</th>
              <th className="px-4 py-3 text-right font-medium">Combos</th>
              <th className="px-4 py-3 text-right font-medium">Glazes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No members match.
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 font-medium">
                      <MemberLink id={user.id} name={user.displayName} />
                      {user.isAdmin ? <StateBadge state="admin" /> : null}
                      {user.contributionsDisabled ? <StateBadge state="rejected" label="Contributions off" /> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{user.email || "No email"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{format(new Date(user.createdAt), "d MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.strikes || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.inventoryCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.combinationCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.glazeCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={href({ page: page - 1 })} className={actionClass()}>
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={href({ page: page + 1 })} className={actionClass()}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
