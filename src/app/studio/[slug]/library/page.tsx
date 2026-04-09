import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { GlazeCatalogExplorer } from "@/components/glaze-catalog-explorer";
import { getStudioBySlug, getStudioSharedGlazes } from "@/lib/data/studios";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import { STUDIO_FIRING_LABELS, type StudioFiringRange } from "@/lib/studio-firing";
import { visitorScopeCookieName } from "@/lib/studio-auth";

export default async function StudioLibraryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();

  const cookieStore = await cookies();
  const scopeCookie = cookieStore.get(visitorScopeCookieName(studio.slug))?.value;
  const effectiveRange: StudioFiringRange =
    studio.firingRange === "both"
      ? scopeCookie === "lowfire" || scopeCookie === "midfire"
        ? scopeCookie
        : "both"
      : studio.firingRange;

  const glazes = await getStudioSharedGlazes(studio, effectiveRange);

  const brandCounts = Array.from(
    glazes.reduce<Map<string, number>>((counts, glaze) => {
      const brand = glaze.brand ?? "Other";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
      return counts;
    }, new Map()),
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const firingImageMap = getGlazeFiringImageMap(glazes.map((g) => g.id));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          {glazes.length} glaze{glazes.length === 1 ? "" : "s"} ·{" "}
          {STUDIO_FIRING_LABELS[effectiveRange]}
        </p>
        <h2 className="display-font text-2xl tracking-tight">
          {studio.displayName}&apos;s shared library
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Every glaze the studio currently has on hand for this firing range.
          Tap a tile for vendor notes, finish, and recipe details.
        </p>
      </header>

      {glazes.length === 0 ? (
        <p className="text-sm text-muted">
          The studio hasn&apos;t shared any glazes yet — check back soon.
        </p>
      ) : (
        <GlazeCatalogExplorer
          glazes={glazes}
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
          hideConeFilter={true}
          groupByLine={true}
        />
      )}
    </div>
  );
}
