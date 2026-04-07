import { Suspense } from "react";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";
import { CombinationsDataServer } from "./_components/combinations-data-server";
import { CombinationsSkeleton } from "./_components/combinations-skeleton";

const validViews = new Set(["all", "possible", "plus1", "mine", "user", "manufacturer"]);
type CombinationsView = "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";

export default async function CombinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; published?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const initialQuery = formatSearchQuery(params.q) ?? "";
  const justPublished = formatSearchQuery(params.published) === "1";
  const requestedView = formatSearchQuery(params.view);
  const selectedView: CombinationsView =
    requestedView && validViews.has(requestedView) ? (requestedView as CombinationsView) : "all";

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
