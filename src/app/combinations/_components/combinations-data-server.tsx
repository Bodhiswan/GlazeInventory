import { CombinationsBrowser } from "@/components/combinations-browser";
import { FormBanner } from "@/components/ui/form-banner";
import { getFavouriteIds } from "@/lib/data/community";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { getInventoryOwnership } from "@/lib/data/inventory";
import {
  getPublishedCombinationPosts,
  getUserCombinationExamples,
  getVendorCombinationExamples,
} from "@/lib/data/combinations";
import type { InventoryStatus, UserProfile } from "@/lib/types";

export async function CombinationsDataServer({
  profile,
  initialQuery,
  selectedView,
  justPublished,
}: {
  profile: UserProfile;
  initialQuery: string;
  selectedView: "all" | "possible" | "plus1" | "mine" | "user" | "manufacturer";
  justPublished: boolean;
}) {
  const [examples, publishedPosts, ownership, userExamplesRaw, favouriteCombinationIds] = await Promise.all([
    getVendorCombinationExamples(profile.id),
    getPublishedCombinationPosts(profile.id),
    getInventoryOwnership(profile.id),
    getUserCombinationExamples(profile.id).catch(() => []),
    getFavouriteIds(profile.id, "combination"),
  ]);
  const userExamples = (userExamplesRaw ?? []).filter((ue) => ue && ue.id);
  const myPosts = publishedPosts.filter((post) => post.authorUserId === profile.id);
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
        <FormBanner variant="success">
          Your combination has been published and is now visible under your examples.
        </FormBanner>
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
        viewerUserId={profile.id}
        favouriteCombinationIds={favouriteCombinationIds}
      />
    </div>
  );
}
