import { GlazeCatalogExplorer } from "@/components/glaze-catalog-explorer";
import { getFavouriteIds } from "@/lib/data/community";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { getCatalogGlazes, getInventory } from "@/lib/data/inventory";
import { ACTIVE_GLAZE_BRANDS } from "@/lib/glaze-metadata";
import type { UserProfile } from "@/lib/types";

export async function GlazeCatalogServer({ profile }: { profile: UserProfile }) {
  const [catalog, inventory, favouriteGlazeIds] = await Promise.all([
    getCatalogGlazes(profile.id),
    getInventory(profile.id),
    getFavouriteIds(profile.id, "glaze"),
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
      preferredCone={profile.preferredCone ?? null}
      preferredAtmosphere={profile.preferredAtmosphere ?? null}
      restrictToPreferredExamples={Boolean(profile.restrictToPreferredExamples)}
      isAdmin={false}
      reviewMode={false}
      favouriteGlazeIds={favouriteGlazeIds}
    />
  );
}
