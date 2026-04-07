import { format } from "date-fns";

import { addGlazeCommentAction } from "@/app/actions/community";
import { GlazeOwnershipPanel } from "@/components/glaze-ownership-panel";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { getInventoryFolders } from "@/lib/data/inventory";
import { getGlazeUserState } from "@/lib/data/glazes";

export async function GlazeUserStateServer({
  viewerId,
  glazeId,
  glazeSourceType,
}: {
  viewerId: string;
  glazeId: string;
  glazeSourceType: "commercial" | "nonCommercial";
}) {
  const [userState, folders] = await Promise.all([
    getGlazeUserState(viewerId, glazeId),
    getInventoryFolders(viewerId),
  ]);

  return (
    <>
      {glazeSourceType === "commercial" ? (
        <SectionErrorBoundary>
          <GlazeOwnershipPanel
            glazeId={glazeId}
            initialStatus={userState.viewerInventoryItem?.status ?? null}
            initialFillLevel={userState.viewerInventoryItem?.fillLevel ?? "full"}
            initialQuantity={userState.viewerInventoryItem?.quantity ?? 1}
            initialInventoryId={userState.viewerInventoryItem?.id ?? null}
            initialFolderIds={userState.viewerInventoryItem?.folderIds ?? []}
            folders={folders}
          />
        </SectionErrorBoundary>
      ) : null}

      <SectionErrorBoundary>
        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Comments</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">Studio notes under this glaze</h2>
          </div>

          <Panel className="space-y-4">
            <form action={addGlazeCommentAction} className="space-y-4">
              <input type="hidden" name="glazeId" value={glazeId} />
              <input type="hidden" name="returnTo" value={`/glazes/${glazeId}`} />
              <Textarea
                name="body"
                placeholder="Add a useful note about application, clay body, fit, layering, or firing results."
                required
              />
              <div className="flex justify-end">
                <button type="submit" className={buttonVariants({ size: "sm" })}>
                  Post comment
                </button>
              </div>
            </form>
          </Panel>

          {userState.comments.length ? (
            <div className="space-y-3">
              {userState.comments.map((comment) => (
                <Panel key={comment.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{comment.authorName}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                      {format(new Date(comment.createdAt), "d MMM yyyy")}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted">{comment.body}</p>
                </Panel>
              ))}
            </div>
          ) : (
            <Panel>
              <p className="text-sm leading-6 text-muted">
                No comments yet. Start the page with the first note about how this glaze behaves.
              </p>
            </Panel>
          )}
        </section>
      </SectionErrorBoundary>
    </>
  );
}
