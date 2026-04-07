import { InventoryWorkspace } from "@/components/inventory-workspace";
import { getFavouriteIds, getUserCombinationExamples, getPublishedCombinationPosts } from "@/lib/data";
import { getInventory } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await requireViewer();
  const [inventory, userExamples, publishedPosts, favouriteGlazeIds] = await Promise.all([
    getInventory(viewer.profile.id),
    getUserCombinationExamples(viewer.profile.id),
    getPublishedCombinationPosts(viewer.profile.id),
    getFavouriteIds(viewer.profile.id, "glaze"),
  ]);
  const params = await searchParams;
  const error = formatSearchQuery(params.error);

  const myCombinationPosts = publishedPosts.filter((p) => p.authorUserId === viewer.profile.id);
  const myUserExamples = userExamples.filter((ue) => ue.authorUserId === viewer.profile.id);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <InventoryWorkspace
        items={inventory}
        firingImageMap={{}}
        preferredCone={viewer.profile.preferredCone ?? null}
        preferredAtmosphere={viewer.profile.preferredAtmosphere ?? null}
        myUserExamples={myUserExamples}
        myCombinationPosts={myCombinationPosts}
        favouriteGlazeIds={favouriteGlazeIds}
      />
    </div>
  );
}
