import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { reportPostAction } from "@/app/actions/community";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { getCombinationDetail, getGlazesByIds } from "@/lib/data/combinations";
import { getViewer } from "@/lib/data/users";
import { parsePairKey } from "@/lib/combinations";
import { formatGlazeLabel, formatGlazeMeta, formatSearchQuery } from "@/lib/utils";

// ─── SEO: dynamic metadata ──────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pairKey: string }>;
}): Promise<Metadata> {
  const { pairKey } = await params;
  const ids = parsePairKey(pairKey);

  if (!ids) {
    return { title: "Combination not found" };
  }

  const glazes = await getGlazesByIds("public", [...ids], null, {
    skipTags: true,
  });

  if (glazes.length !== 2) {
    return { title: "Combination not found" };
  }

  const sorted = [...glazes].sort((a, b) => a.name.localeCompare(b.name));
  const title = `${formatGlazeLabel(sorted[0])} + ${formatGlazeLabel(sorted[1])}`;
  const description = `See kiln-tested results, firing images, and member notes for ${formatGlazeLabel(sorted[0])} layered with ${formatGlazeLabel(sorted[1])}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/combinations/${pairKey}`,
    },
    openGraph: {
      title,
      description,
    },
  };
}

// ─── Structured data (JSON-LD) ──────────────────────────────────────────────

function CombinationJsonLd({
  glazeA,
  glazeB,
  postCount,
}: {
  glazeA: { name: string; brand?: string | null };
  glazeB: { name: string; brand?: string | null };
  postCount: number;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${glazeA.name} + ${glazeB.name} Glaze Combination`,
    description: `Ceramic glaze combination pairing ${glazeA.name}${glazeA.brand ? ` (${glazeA.brand})` : ""} with ${glazeB.name}${glazeB.brand ? ` (${glazeB.brand})` : ""}. ${postCount} community result${postCount === 1 ? "" : "s"} available.`,
    supply: [
      { "@type": "HowToSupply", name: glazeA.name },
      { "@type": "HowToSupply", name: glazeB.name },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function CombinationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ pairKey: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const viewer = await getViewer();
  const isGuest = !viewer;
  const { pairKey } = await params;

  const detail = await getCombinationDetail(
    viewer?.profile.id ?? "public",
    pairKey,
    isGuest ? { publicRead: true } : undefined,
  );
  const query = await searchParams;

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <CombinationJsonLd
        glazeA={detail.glazes[0]}
        glazeB={detail.glazes[1]}
        postCount={detail.posts.length}
      />

      <PageHeader
        eyebrow="Combination detail"
        title={`${detail.glazes[0].name} + ${detail.glazes[1].name}`}
        description={
          isGuest
            ? "Browse published glaze test results from community members who fired this combination."
            : "See your own notes for this pair and browse published results from other members who fired the same combination."
        }
      />

      {formatSearchQuery(query.reported) ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Report submitted. Admins can now review it.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-5">
          {isGuest ? null : (
            <div className="flex items-center gap-3">
              <Badge tone={detail.viewerOwnsPair ? "success" : "neutral"}>
                {detail.viewerOwnsPair ? "You own both glazes" : "Pair exists in community"}
              </Badge>
            </div>
          )}
          <div className="grid gap-4">
            {detail.glazes.map((glaze) => (
              <div key={glaze.id} className="border border-border bg-panel p-4">
                <Link href={`/glazes/${glaze.id}`} className="font-semibold hover:underline">
                  {formatGlazeLabel(glaze)}
                </Link>
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
          {isGuest ? (
            <Panel className="space-y-3 border-accent-1/20 bg-accent-1/5">
              <p className="text-sm leading-6 text-muted">
                Sign up to track which glazes you own, save private notes on
                combinations, and publish your own kiln results.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/auth/sign-up"
                  className={buttonVariants({ size: "sm" })}
                >
                  Create free account
                </Link>
                <Link
                  href="/auth/sign-in"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Sign in
                </Link>
              </div>
            </Panel>
          ) : (
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">Your private notes</p>
              {detail.inventoryNotes.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                  {detail.inventoryNotes.map((note, index) => (
                    <li key={`${note}-${index}`}>{note}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">No private notes for this pair yet.</p>
              )}
            </div>
          )}
        </Panel>

        <SectionErrorBoundary>
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
                  {isGuest ? null : (
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
                  )}
                </div>
              ))
            ) : (
              <Panel>
                <p className="text-sm leading-6 text-muted">
                  {isGuest
                    ? "No community results for this pairing yet. Sign up to be the first to publish a glaze test."
                    : "Be the first member to publish a glaze test for this pairing."}
                </p>
              </Panel>
            )}
          </div>
        </SectionErrorBoundary>
      </section>
    </div>
  );
}
