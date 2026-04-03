import Link from "next/link";
import { notFound } from "next/navigation";

import { reportPostAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { getCombinationDetail, getPublicGuestViewer, getViewer } from "@/lib/data";
import { formatGlazeLabel, formatGlazeMeta, formatSearchQuery } from "@/lib/utils";

export default async function CombinationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ pairKey: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const viewer = (await getViewer()) ?? getPublicGuestViewer();
  const isGuest = Boolean(viewer.profile.isAnonymous);
  const { pairKey } = await params;
  const detail = await getCombinationDetail(viewer.profile.id, pairKey, { publicRead: isGuest });
  const query = await searchParams;

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Combination detail"
        title={`${detail.glazes[0].name} + ${detail.glazes[1].name}`}
        description={
          isGuest
            ? "Browse published member results for this glaze pairing. Sign in if you want to publish your own result or compare the pair against your shelf."
            : "See your own notes for this pair and browse published results from other members who fired the same combination."
        }
        actions={
          isGuest ? (
            <Link href="/auth/sign-in" className={buttonVariants({})}>
              Sign in to save your shelf
            </Link>
          ) : null
        }
      />

      {!isGuest && formatSearchQuery(query.reported) ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Report submitted. Admins can now review it.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-5">
          <div className="flex items-center gap-3">
            <Badge tone={detail.viewerOwnsPair ? "success" : "neutral"}>
              {detail.viewerOwnsPair ? "You own both glazes" : isGuest ? "Published community pairing" : "Pair exists in community"}
            </Badge>
          </div>
          <div className="grid gap-4">
            {detail.glazes.map((glaze) => (
              <div key={glaze.id} className="border border-border bg-panel p-4">
                <p className="font-semibold">{formatGlazeLabel(glaze)}</p>
                <p className="mt-1 text-sm text-muted">{formatGlazeMeta(glaze)}</p>
                {glaze.description ? (
                  <p className="mt-2 text-sm leading-6 text-muted">{glaze.description}</p>
                ) : null}
                {glaze.finishNotes ? (
                  <p className="mt-2 text-sm text-muted">Finish: {glaze.finishNotes}</p>
                ) : null}
                {glaze.colorNotes ? (
                  <p className="mt-2 text-sm text-muted">Color: {glaze.colorNotes}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              {isGuest ? "Member context" : "Your private notes"}
            </p>
            {isGuest ? (
              <p className="mt-3 text-sm text-muted">
                Sign in to compare this pair against your inventory and keep your own private notes on the glazes you test together.
              </p>
            ) : detail.inventoryNotes.length ? (
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                {detail.inventoryNotes.map((note, index) => (
                  <li key={`${note}-${index}`}>{note}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No private notes for this pair yet.</p>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Member examples</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">
              {detail.posts.length ? "Published results" : "No published results yet"}
            </h2>
          </div>
          {detail.posts.length ? (
            detail.posts.map((post) => (
              <div key={post.id} className="space-y-4">
                <PostCard post={post} showStatus={post.status !== "published"} />
                {!isGuest ? (
                  <Panel>
                    <form action={reportPostAction} className="grid gap-3">
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="pairKey" value={detail.pairKey} />
                      <p className="text-sm font-semibold">Report this post</p>
                      <Textarea
                        name="reason"
                        placeholder="Why should an admin review this image or caption?"
                      />
                      <Button type="submit" variant="ghost">
                        Submit report
                      </Button>
                    </form>
                  </Panel>
                ) : null}
              </div>
            ))
          ) : (
            <Panel>
              <p className="text-sm leading-6 text-muted">
                {isGuest
                  ? "No member has published a public result for this pair yet."
                  : "Be the first member to publish a glaze test for this pairing."}
              </p>
            </Panel>
          )}
        </div>
      </section>
    </div>
  );
}
