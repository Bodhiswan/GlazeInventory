import Link from "next/link";

import { actionClass, EmptyNote, Tabs } from "@/components/admin/admin-ui";
import { CommentRow } from "@/components/admin/comment-row";
import { PageHeader } from "@/components/page-header";
import { getRecentComments, requireAdminViewer, type CommentKind } from "@/lib/data/admin";

const KINDS: Array<{ key: "all" | CommentKind; label: string }> = [
  { key: "all", label: "All comments" },
  { key: "combination", label: "On combinations" },
  { key: "glaze", label: "On glazes" },
];

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ on?: string; q?: string }>;
}) {
  await requireAdminViewer();
  const params = await searchParams;

  const kind = KINDS.find((option) => option.key === params.on)?.key ?? "all";
  const search = params.q?.trim() ?? "";
  const comments = await getRecentComments({ kind: kind === "all" ? undefined : kind, search });

  const href = (on: string, q = search) => {
    const query = new URLSearchParams();
    if (on !== "all") query.set("on", on);
    if (q) query.set("q", q);
    const qs = query.toString();
    return qs ? `/admin/comments?${qs}` : "/admin/comments";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Comments"
        description="Everything members have written on glazes and combinations, newest first. Delete anything that should not be there."
      />

      <Tabs label="Comment type" active={kind} tabs={KINDS.map((option) => ({ ...option, href: href(option.key) }))} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {kind !== "all" ? <input type="hidden" name="on" value={kind} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search comment text"
            aria-label="Search comments"
            className="h-8 min-w-[220px] max-w-md flex-1 border border-border bg-background px-3 text-sm"
          />
          <button type="submit" className={actionClass()}>
            Search
          </button>
          {search ? (
            <Link href={href(kind, "")} className={actionClass()}>
              Clear
            </Link>
          ) : null}
        </form>
        <p className="text-xs text-muted">
          {comments.length === 100 ? "Showing the latest 100" : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {comments.length ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentRow key={`${comment.kind}-${comment.id}`} comment={comment} />
          ))}
        </div>
      ) : (
        <EmptyNote>{search ? "No comments match that search." : "No comments yet."}</EmptyNote>
      )}
    </div>
  );
}
