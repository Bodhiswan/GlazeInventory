import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getAllUsersForAdmin } from "@/lib/data/admin";
import { requireViewer } from "@/lib/data/users";


const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) redirect("/dashboard");

  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { rows, total } = await getAllUsersForAdmin({
    search,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseQs = search ? `&q=${encodeURIComponent(search)}` : "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="All users"
        description={`${total.toLocaleString()} total user${total === 1 ? "" : "s"}. Browse, search, and jump into a user to message or review their contributions.`}
      />

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search by email or display name"
          className="min-w-[260px] flex-1 border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Search
        </button>
        {search ? (
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Clear
          </Link>
        ) : null}
      </form>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-panel/40 text-left text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Pts</th>
              <th className="px-4 py-3 text-right font-medium">Inv.</th>
              <th className="px-4 py-3 text-right font-medium">Combos</th>
              <th className="px-4 py-3 text-right font-medium">Glazes</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No users match.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {u.displayName ?? "(no name)"}
                        </span>
                        {u.isAdmin ? <Badge tone="accent">Admin</Badge> : null}
                        {u.isAnonymous ? <Badge tone="neutral">Anon</Badge> : null}
                        {u.contributionsDisabled ? (
                          <Badge tone="neutral">Disabled</Badge>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted">{u.email || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {format(new Date(u.createdAt), "d MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {u.points.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.inventoryCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.combinationCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.glazeCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/profile?tab=chats&with=${u.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Message
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/users?page=${page - 1}${baseQs}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                ← Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/admin/users?page=${page + 1}${baseQs}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Next →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
