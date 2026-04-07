import { CombinationsBrowser } from "@/components/combinations-browser";
import { getFavouriteIds } from "@/lib/data";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { getInventoryOwnership } from "@/lib/data/inventory";
import {
  getPublishedCombinationPosts,
  getUserCombinationExamples,
  getVendorCombinationExamples,
} from "@/lib/data/combinations";
import { requireViewer } from "@/lib/data/users";
import type { InventoryStatus } from "@/lib/types";
import { formatSearchQuery } from "@/lib/utils";

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
  const [examples, publishedPosts, ownership, userExamplesRaw, favouriteCombinationIds] = await Promise.all([
    getVendorCombinationExamples(viewer.profile.id),
    getPublishedCombinationPosts(viewer.profile.id),
    getInventoryOwnership(viewer.profile.id),
    getUserCombinationExamples(viewer.profile.id).catch(() => []),
    getFavouriteIds(viewer.profile.id, "combination"),
  ]);
  const userExamples = (userExamplesRaw ?? []).filter((ue) => ue && ue.id);
  const myPosts = publishedPosts.filter((post) => post.authorUserId === viewer.profile.id);
  const inventoryStatusByGlazeId = ownership.reduce<Record<string, InventoryStatus>>((map, item) => {
    map[item.glazeId] = item.status;
    return map;
  }, {});

  // Collect all glaze IDs from examples, posts, and user examples for firing images
  const allGlazeIds = new Set<string>();
  for (const ex of examples) {
    for (const layer of ex.layers) {
      if (layer.glaze?.id) allGlazeIds.add(layer.glaze.id);
    }
  }
  for (const post of publishedPosts) {
    for (const glaze of post.glazes ?? []) {
      allGlazeIds.add(glaze.id);
    }
  }
  for (const ue of userExamples) {
    for (const layer of ue.layers) {
      if (layer.glaze?.id) allGlazeIds.add(layer.glaze.id);
    }
  }
  const glazeFiringImages = getGlazeFiringImageMap(Array.from(allGlazeIds));

  return (
    <div className="space-y-6">
      {justPublished ? (
        <div className="border border-[#3a6642]/20 bg-[#3a6642]/10 px-4 py-3 text-sm text-[#2e5234]">
          Your combination has been published and is now visible under your examples.
        </div>
      ) : null}
      <CombinationsBrowser
        examples={examples}
        publishedPosts={publishedPosts}
        myPosts={myPosts}
        userExamples={userExamples}
        glazeFiringImages={glazeFiringImages}
        inventoryStatusByGlazeId={inventoryStatusByGlazeId}
        initialView={selectedView}
        initialQuery={initialQuery}
        viewerUserId={viewer.profile.id}
        favouriteCombinationIds={favouriteCombinationIds}
      />
    </div>
  );
}
