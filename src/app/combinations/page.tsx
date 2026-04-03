import Link from "next/link";

import { CombinationsBrowser } from "@/components/combinations-browser";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  getInventory,
  getPublicGuestViewer,
  getPublishedCombinationPosts,
  getVendorCombinationExamples,
  getViewer,
} from "@/lib/data";
import type { InventoryStatus } from "@/lib/types";
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
  const initialQuery = formatSearchQuery(params.q) ?? "";
  const requestedView = formatSearchQuery(params.view);
  const selectedView: CombinationsView =
    !isGuest && (requestedView === "possible" || requestedView === "mine") ? requestedView : "all";
  const inventoryPromise = isGuest ? Promise.resolve([]) : getInventory(viewer.profile.id);
  const [examples, publishedPosts] = await Promise.all([
    getVendorCombinationExamples(viewer.profile.id),
    getPublishedCombinationPosts(viewer.profile.id, { publicRead: isGuest }),
  ]);
  const myPosts = isGuest ? [] : publishedPosts.filter((post) => post.authorUserId === viewer.profile.id);
  const inventory = await inventoryPromise;
  const inventoryStatusByGlazeId = inventory.reduce<Record<string, InventoryStatus>>((map, item) => {
    map[item.glazeId] = item.status;
    return map;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Combinations"
        title="Explore glaze combinations"
        actions={
          isGuest ? (
            <Link href="/auth/sign-in" className={buttonVariants({})}>
              Sign in to save your shelf
            </Link>
          ) : null
        }
      />

      <CombinationsBrowser
        examples={examples}
        publishedPosts={publishedPosts}
        myPosts={myPosts}
        isGuest={isGuest}
        glazeFiringImages={{}}
        inventoryStatusByGlazeId={inventoryStatusByGlazeId}
        initialView={selectedView}
        initialQuery={initialQuery}
      />
    </div>
  );
}
