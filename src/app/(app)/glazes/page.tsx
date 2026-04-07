import { GlazeCatalogExplorer } from "@/components/glaze-catalog-explorer";
import { getFavouriteIds } from "@/lib/data";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { getCatalogGlazes, getInventory } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { ACTIVE_GLAZE_BRANDS } from "@/lib/glaze-metadata";

export default async function GlazesPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const reviewMode = false;
  const [catalog, inventory, favouriteGlazeIds] = await Promise.all([
    getCatalogGlazes(viewer.profile.id),
    getInventory(viewer.profile.id),
    getFavouriteIds(viewer.profile.id, "glaze"),
  ]);
  const commercial = catalog.filter((glaze) => glaze.sourceType === "commercial");
  const custom = catalog.filter((glaze) => glaze.sourceType === "nonCommercial");
  const visibleBrands = new Set(ACTIVE_GLAZE_BRANDS);
  const featuredGlazes = [
    ...commercial.filter((glaze) => glaze.brand && visibleBrands.has(glaze.brand as (typeof ACTIVE_GLAZE_BRANDS)[number])),
    ...custom,
  ];

  const inventoryStates = Object.fromEntries(
    inventory.map((item) => [
      item.glazeId,
      {
        inventoryId: item.id,
        status: item.status,
      },
    ]),
  );
  const commercialFeatured = featuredGlazes.filter((glaze) => glaze.sourceType === "commercial");
  const brandCounts = Array.from(
    commercialFeatured.reduce<Map<string, number>>((counts, glaze) => {
      const brand = glaze.brand ?? "Other";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
      return counts;
    }, new Map()),
  ).sort((left, right) => left[0].localeCompare(right[0]));
  const firingImageMap = getGlazeFiringImageMap(featuredGlazes.map((g) => g.id));

  return (
    <GlazeCatalogExplorer
      glazes={featuredGlazes}
      brandCounts={brandCounts}
      inventoryStates={inventoryStates}
      isGuest={false}
      firingImageMap={firingImageMap}
      preferredCone={viewer.profile.preferredCone ?? null}
      preferredAtmosphere={viewer.profile.preferredAtmosphere ?? null}
      restrictToPreferredExamples={Boolean(viewer.profile.restrictToPreferredExamples)}
      isAdmin={false}
      reviewMode={reviewMode}
      favouriteGlazeIds={favouriteGlazeIds}
    />
  );
}
