import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import type { CombinationPost } from "@/lib/types";
import { formatGlazeLabel } from "@/lib/utils";

const publishedAtFormatter = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
});

export function PostCard({ post, showStatus = false }: { post: CombinationPost; showStatus?: boolean }) {
  const publishedAt = new Date(post.createdAt);
  const hasValidPublishedAt = !Number.isNaN(publishedAt.getTime());
  const imageSrc = typeof post.imagePath === "string" && post.imagePath.trim() ? post.imagePath : null;

  return (
    <Panel className="overflow-hidden p-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-panel">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={post.caption ?? "Published glaze combination"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-[11px] uppercase tracking-[0.18em] text-muted">
            Example image unavailable
          </div>
        )}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{post.authorName}</p>
            {hasValidPublishedAt ? (
              <time
                dateTime={post.createdAt}
                title={publishedAtFormatter.format(publishedAt)}
                className="text-xs uppercase tracking-[0.16em] text-muted"
              >
                {formatDistanceToNow(publishedAt, { addSuffix: true })}
              </time>
            ) : (
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Recently published</p>
            )}
          </div>
          {showStatus ? <Badge tone="accent">{post.status}</Badge> : null}
        </div>
        {post.glazes?.length ? (
          <div className="space-y-3">
            {post.glazes.map((glaze) => {
              const topTags = (glaze.communityTags ?? [])
                .filter((tag) => tag.voteCount > 0)
                .sort((left, right) => right.voteCount - left.voteCount)
                .slice(0, 3);

              return (
                <div key={glaze.id} className="space-y-2">
                  <p className="text-sm text-muted break-words">{formatGlazeLabel(glaze)}</p>
                  {topTags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {topTags.map((tag) => (
                        <Badge key={`${glaze.id}-${tag.slug}`} tone="neutral" className="normal-case tracking-[0.08em]">
                          {tag.label} {tag.voteCount}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
        {post.caption ? <p className="text-sm leading-6 text-foreground/90">{post.caption}</p> : null}
        {post.applicationNotes ? (
          <p className="text-sm leading-6 text-muted">Application: {post.applicationNotes}</p>
        ) : null}
        {post.firingNotes ? (
          <p className="text-sm leading-6 text-muted">Firing: {post.firingNotes}</p>
        ) : null}
      </div>
    </Panel>
  );
}
