import { CombinationsBrowser } from "@/components/combinations-browser";
import {
  getGlazeFiringImageMap,
  getInventoryOwnership,
  getPublishedCombinationPosts,
  getUserCombinationExamples,
  getVendorCombinationExamples,
  requireViewer,
} from "@/lib/data";
import type { InventoryStatus } from "@/lib/types";
import { formatSearchQuery } from "@/lib/utils";

type CombinationsView = "all" | "possible" | "mine";

export default async function CombinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const initialQuery = formatSearchQuery(params.q) ?? "";
  const requestedView = formatSearchQuery(params.view);
  const selectedView: CombinationsView =
    requestedView === "possible" || requestedView === "mine" ? requestedView : "all";
  const [examples, publishedPosts, ownership, userExamples] = await Promise.all([
    getVendorCombinationExamples(viewer.profile.id),
    getPublishedCombinationPosts(viewer.profile.id),
    getInventoryOwnership(viewer.profile.id),
    getUserCombinationExamples(viewer.profile.id),
  ]);
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
      />
    </div>
  );
}
