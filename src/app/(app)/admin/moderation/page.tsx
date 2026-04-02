import { moderatePostAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getModerationQueue, requireViewer } from "@/lib/data";
import { formatSearchQuery } from "@/lib/utils";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const viewer = await requireViewer();

  if (!viewer.profile.isAdmin) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Moderation access required</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          This screen is only available for studio administrators.
        </p>
      </Panel>
    );
  }

  const queue = await getModerationQueue();
  const query = await searchParams;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Moderation queue"
        description="Review reported posts, hide anything inappropriate, and republish posts once the queue has been resolved."
      />

      {formatSearchQuery(query.saved) ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Moderation update saved.
        </div>
      ) : null}

      <div className="space-y-6">
        {queue.map((item) => (
          <div key={item.post.id} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <PostCard post={item.post} showStatus />
            <Panel className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted">Open reports</p>
                {item.reports.length ? (
                  <div className="mt-3 space-y-3">
                    {item.reports.map((report) => (
                      <div key={report.id} className="border border-border bg-panel p-4">
                        <p className="text-sm leading-6 text-muted">{report.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">No open reports. Post is manually hidden.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={moderatePostAction}>
                  <input type="hidden" name="postId" value={item.post.id} />
                  <input type="hidden" name="status" value="hidden" />
                  <Button type="submit" variant="danger">
                    Hide post
                  </Button>
                </form>
                <form action={moderatePostAction}>
                  <input type="hidden" name="postId" value={item.post.id} />
                  <input type="hidden" name="status" value="published" />
                  <Button type="submit" variant="ghost">
                    Republish post
                  </Button>
                </form>
              </div>
            </Panel>
          </div>
        ))}
      </div>
    </div>
  );
}
