import { CombinationsBrowser } from "@/components/combinations-browser";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import {
  getPublishedCombinationPosts,
  getVendorCombinationExamples,
} from "@/lib/data/combinations";
import type { CombinationsView } from "@/components/combinations-browser/use-combinations-browser";

const PUBLIC_AVAILABLE_VIEWS: CombinationsView[] = [
  "all",
  "user",
  "manufacturer",
];

function collectPublicGlazeIds(
  examples: Awaited<ReturnType<typeof getVendorCombinationExamples>>,
  publishedPosts: Awaited<ReturnType<typeof getPublishedCombinationPosts>>,
) {
  const allGlazeIds = new Set<string>();

  for (const example of examples) {
    for (const layer of example.layers) {
      if (layer.glaze?.id) {
        allGlazeIds.add(layer.glaze.id);
      }
    }
  }

  for (const post of publishedPosts) {
    for (const glaze of post.glazes ?? []) {
      allGlazeIds.add(glaze.id);
    }
  }

  return Array.from(allGlazeIds);
}

export async function PublicCombinationsDataServer({
  initialQuery,
  selectedView,
}: {
  initialQuery: string;
  selectedView: CombinationsView;
}) {
  const initialView = PUBLIC_AVAILABLE_VIEWS.includes(selectedView)
    ? selectedView
    : "all";
  const [examples, publishedPosts] = await Promise.all([
    getVendorCombinationExamples("public", { skipInventory: true }),
    getPublishedCombinationPosts("public", { publicRead: true }),
  ]);

  const glazeFiringImages = getGlazeFiringImageMap(
    collectPublicGlazeIds(examples, publishedPosts),
  );

  return (
    <CombinationsBrowser
      examples={examples}
      publishedPosts={publishedPosts}
      myPosts={[]}
      userExamples={[]}
      glazeFiringImages={glazeFiringImages}
      inventoryStatusByGlazeId={{}}
      initialView={initialView}
      initialQuery={initialQuery}
      viewerUserId={null}
      favouriteCombinationIds={[]}
      availableViews={PUBLIC_AVAILABLE_VIEWS}
    />
  );
}
