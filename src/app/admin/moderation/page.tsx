import { moderatePostAction } from "@/app/actions/admin";
import { actionClass, EmptyNote, Tabs } from "@/components/admin/admin-ui";
import { CommentRow } from "@/components/admin/comment-row";
import { SubmissionCard } from "@/components/admin/submission-card";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import {
  getAdminCounts,
  getRecentComments,
  getReportedPostsQueue,
  getSubmissions,
  MODERATION_STATES,
  requireAdminViewer,
  type ModerationState,
  type SubmissionKind,
} from "@/lib/data/admin";
import { cn } from "@/lib/utils";

const SUBMISSION_TYPES: Record<string, { kind: SubmissionKind; noun: string }> = {
  combinations: { kind: "combination", noun: "combinations" },
  glazes: { kind: "glaze", noun: "custom glazes" },
  photos: { kind: "firingImage", noun: "firing photos" },
};

async function SubmissionQueue({ type, state }: { type: string; state: ModerationState }) {
  const { kind, noun } = SUBMISSION_TYPES[type];
  const items = await getSubmissions(kind, { state });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex border border-border" role="group" aria-label="Review state">
          {MODERATION_STATES.map((option) => (
            <a
              key={option}
              href={`/admin/moderation?type=${type}&state=${option}`}
              aria-current={option === state ? "true" : undefined}
              className={cn(
                "px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
                option === state ? "bg-foreground text-background" : "text-muted hover:text-foreground",
              )}
            >
              {option}
            </a>
          ))}
        </div>
        <p className="text-xs text-muted">
          {items.length} {state} {noun}
          {state === "pending" ? ", oldest first" : ""}
        </p>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <SubmissionCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyNote>{state === "pending" ? `No ${noun} waiting for review.` : `No ${state} ${noun}.`}</EmptyNote>
      )}
    </div>
  );
}

async function CommentList() {
  const comments = await getRecentComments();
  if (!comments.length) return <EmptyNote>No comments yet.</EmptyNote>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">The {comments.length} most recent comments on glazes and combinations.</p>
      {comments.map((comment) => (
        <CommentRow key={`${comment.kind}-${comment.id}`} comment={comment} />
      ))}
    </div>
  );
}

async function ReportedPosts() {
  const queue = await getReportedPostsQueue();
  if (!queue.length) return <EmptyNote>No reported or hidden posts.</EmptyNote>;

  return (
    <div className="space-y-6">
      {queue.map((item) => (
        <div key={item.post.id} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <PostCard post={item.post} showStatus />
          <div className="space-y-4 border border-border bg-panel-strong p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              {item.reports.length ? `${item.reports.length} open report${item.reports.length === 1 ? "" : "s"}` : "Hidden by an admin"}
            </p>
            {item.reports.map((report) => (
              <p key={report.id} className="border border-border bg-background p-3 text-sm leading-6">
                {report.reason}
              </p>
            ))}
            <div className="flex flex-wrap gap-2">
              <form action={moderatePostAction}>
                <input type="hidden" name="postId" value={item.post.id} />
                <input type="hidden" name="status" value="hidden" />
                <button type="submit" className={actionClass("danger")}>
                  Hide post
                </button>
              </form>
              <form action={moderatePostAction}>
                <input type="hidden" name="postId" value={item.post.id} />
                <input type="hidden" name="status" value="published" />
                <button type="submit" className={actionClass()}>
                  Keep published
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; state?: string }>;
}) {
  await requireAdminViewer();
  const [params, counts] = await Promise.all([searchParams, getAdminCounts()]);

  const tabs = [
    { key: "combinations", label: "Combinations", count: counts.pendingCombinations },
    { key: "glazes", label: "Custom glazes", count: counts.pendingGlazes },
    { key: "photos", label: "Firing photos", count: counts.pendingPhotos },
    { key: "comments", label: "Comments" },
    { key: "reports", label: "Reported posts", count: counts.openReports },
  ].map((tab) => ({ ...tab, href: `/admin/moderation?type=${tab.key}` }));

  const type = tabs.some((tab) => tab.key === params.type) ? params.type! : "combinations";
  const state = MODERATION_STATES.find((option) => option === params.state) ?? "pending";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Moderation"
        description="Review what members submit. Approving keeps an item; rejecting voids its points and adds a strike to the author — three strikes turn off their contributions."
      />
      <Tabs tabs={tabs} active={type} label="Content type" />

      {type === "comments" ? (
        <CommentList />
      ) : type === "reports" ? (
        <ReportedPosts />
      ) : (
        <SubmissionQueue type={type} state={state} />
      )}
    </div>
  );
}
