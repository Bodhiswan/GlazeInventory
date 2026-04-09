import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";
import { CombinationsDataServer } from "./_components/combinations-data-server";
import { CombinationsSkeleton } from "./_components/combinations-skeleton";
import { PublicCombinationsDataServer } from "./_components/public-combinations-data-server";

export const metadata: Metadata = {
  title: "Glaze Combinations",
  description:
    "Explore ceramic glaze combinations and see real kiln-tested results from the community. Find pairings that work with the glazes you already own.",
  alternates: {
    canonical: "/combinations",
  },
};

const validViews = new Set(["all", "possible", "plus1", "mine", "user", "manufacturer"]);
type CombinationsView = "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";

export default async function CombinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; published?: string }>;
}) {
  const viewer = await getViewer();
  const params = await searchParams;
  const initialQuery = formatSearchQuery(params.q) ?? "";
  const justPublished = formatSearchQuery(params.published) === "1";
  const requestedView = formatSearchQuery(params.view);
  const selectedView: CombinationsView =
    requestedView && validViews.has(requestedView) ? (requestedView as CombinationsView) : "all";

  if (!viewer) {
    return (
      <Suspense fallback={<CombinationsSkeleton />}>
        <PublicCombinationsDataServer
          initialQuery={initialQuery}
          selectedView={selectedView}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<CombinationsSkeleton />}>
      <CombinationsDataServer
        profile={viewer.profile}
        initialQuery={initialQuery}
        selectedView={selectedView}
        justPublished={justPublished}
      />
    </Suspense>
  );
}
