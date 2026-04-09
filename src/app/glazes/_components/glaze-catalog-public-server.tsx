import { GlazeCatalogExplorer } from "@/components/glaze-catalog-explorer";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { getAllCatalogGlazes } from "@/lib/catalog";
import { ACTIVE_GLAZE_BRANDS } from "@/lib/glaze-metadata";

export async function GlazeCatalogPublicServer() {
  const catalog = getAllCatalogGlazes();

  const commercial = catalog.filter((glaze) => glaze.sourceType === "commercial");
  const visibleBrands = new Set(ACTIVE_GLAZE_BRANDS);
  const featuredGlazes = commercial.filter(
    (glaze) => glaze.brand && visibleBrands.has(glaze.brand as (typeof ACTIVE_GLAZE_BRANDS)[number]),
  );

  const brandCounts = Array.from(
    featuredGlazes.reduce<Map<string, number>>((counts, glaze) => {
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
      inventoryStates={{}}
      isGuest={true}
      firingImageMap={firingImageMap}
      preferredCone={null}
      preferredAtmosphere={null}
      restrictToPreferredExamples={false}
      isAdmin={false}
      reviewMode={false}
      favouriteGlazeIds={[]}
    />
  );
}
