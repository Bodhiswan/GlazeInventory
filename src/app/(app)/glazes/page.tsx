import { GlazeCatalogExplorer } from "@/components/glaze-catalog-explorer";
import { getCatalogGlazes, getGlazeFiringImageMap, getInventory, requireViewer } from "@/lib/data";
import { ACTIVE_GLAZE_BRANDS } from "@/lib/utils";

export default async function GlazesPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const reviewMode = params.review === "descriptions" && Boolean(viewer.profile.isAdmin);
  const [catalog, inventory] = await Promise.all([
    getCatalogGlazes(viewer.profile.id),
    getInventory(viewer.profile.id),
  ]);
  const commercial = catalog.filter((glaze) => glaze.sourceType === "commercial");
  const visibleBrands = new Set(ACTIVE_GLAZE_BRANDS);
  const featuredGlazes = commercial.filter((glaze) => glaze.brand && visibleBrands.has(glaze.brand as (typeof ACTIVE_GLAZE_BRANDS)[number]));
  const firingImageMap = await getGlazeFiringImageMap(featuredGlazes.map((glaze) => glaze.id));
  const inventoryStates = Object.fromEntries(
    inventory.map((item) => [
      item.glazeId,
      {
        inventoryId: item.id,
        status: item.status,
      },
    ]),
  );
  const brandCounts = Array.from(
    featuredGlazes.reduce<Map<string, number>>((counts, glaze) => {
      const brand = glaze.brand ?? "Other";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
      return counts;
    }, new Map()),
  ).sort((left, right) => left[0].localeCompare(right[0]));

  return (
    <GlazeCatalogExplorer
      glazes={featuredGlazes}
      brandCounts={brandCounts}
      inventoryStates={inventoryStates}
      isGuest={Boolean(viewer.profile.isAnonymous)}
      firingImageMap={firingImageMap}
      preferredCone={viewer.profile.preferredCone ?? null}
      preferredAtmosphere={viewer.profile.preferredAtmosphere ?? null}
      restrictToPreferredExamples={Boolean(viewer.profile.restrictToPreferredExamples)}
      isAdmin={Boolean(viewer.profile.isAdmin)}
      reviewMode={reviewMode}
    />
  );
}
