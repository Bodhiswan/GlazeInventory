import Link from "next/link";

import { CombinationsBrowser } from "@/components/combinations-browser";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  getPublicGuestViewer,
  getPublishedCombinationPosts,
  getVendorCombinationExamples,
  getViewer,
} from "@/lib/data";
import { formatSearchQuery } from "@/lib/utils";

type CombinationsView = "all" | "possible" | "mine";

export default async function CombinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const viewer = (await getViewer()) ?? getPublicGuestViewer();
  const params = await searchParams;
  const isGuest = Boolean(viewer.profile.isAnonymous);
  const requestedView = formatSearchQuery(params.view);
  const selectedView: CombinationsView =
    !isGuest && (requestedView === "possible" || requestedView === "mine") ? requestedView : "all";
  const [examples, publishedPosts] = await Promise.all([
    getVendorCombinationExamples(viewer.profile.id),
    getPublishedCombinationPosts(viewer.profile.id, { publicRead: isGuest }),
  ]);
  const myPosts = isGuest ? [] : publishedPosts.filter((post) => post.authorUserId === viewer.profile.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Combinations"
        title="Explore glaze combinations"
        description={
          isGuest
            ? "Browse imported Mayco combinations in the public tab, then sign in when you want to compare against your shelf or open your own published results."
            : selectedView === "possible"
              ? "Possible combinations shows imported Mayco examples that only use glazes already on your shelf, so every result is something you can test right now."
              : selectedView === "mine"
                ? "My combinations only shows results you published yourself, so you can quickly revisit your own test tiles, notes, and photos."
                : "All combinations shows the full imported Mayco reference wall. Switch to Possible combinations for shelf-matched ideas or My combinations to review your own published results."
        }
        actions={
          isGuest ? (
            <Link href="/auth/sign-in" className={buttonVariants({})}>
              Sign in to save your shelf
            </Link>
          ) : (
            <Link href="/publish" className={buttonVariants({})}>
              Publish your own result
            </Link>
          )
        }
      />

      <CombinationsBrowser
        examples={examples}
        publishedPosts={publishedPosts}
        myPosts={myPosts}
        isGuest={isGuest}
        initialView={selectedView}
      />
    </div>
  );
}
