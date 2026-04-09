import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { CombinationsBrowser } from "@/components/combinations-browser";
import { getStudioBySlug, getStudioSharedGlazes } from "@/lib/data/studios";
import { getVendorCombinationExamples } from "@/lib/data/combinations";
import { getGlazeFiringImageMap } from "@/lib/data/glazes";
import {
  glazeMatchesStudioFiring,
  STUDIO_FIRING_LABELS,
  type StudioFiringRange,
} from "@/lib/studio-firing";
import { visitorScopeCookieName } from "@/lib/studio-auth";

export default async function StudioCombinationsPage({
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

  const sharedGlazes = await getStudioSharedGlazes(studio, effectiveRange);
  const sharedIds = new Set(sharedGlazes.map((g) => g.id));

  const allExamples = await getVendorCombinationExamples("", { skipInventory: true });
  const possibleExamples = allExamples.filter((ex) => {
    if (!glazeMatchesStudioFiring(ex.cone ?? null, effectiveRange)) return false;
    const matched = ex.layers.filter((l) => l.glazeId);
    if (matched.length === 0) return false;
    return matched.every((l) => l.glazeId && sharedIds.has(l.glazeId));
  });

  const layerGlazeIds = new Set<string>();
  for (const ex of possibleExamples) {
    for (const layer of ex.layers) {
      if (layer.glaze?.id) layerGlazeIds.add(layer.glaze.id);
    }
  }
  const glazeFiringImages = getGlazeFiringImageMap(Array.from(layerGlazeIds));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          {possibleExamples.length} combination
          {possibleExamples.length === 1 ? "" : "s"} ·{" "}
          {STUDIO_FIRING_LABELS[effectiveRange]}
        </p>
        <h2 className="display-font text-2xl tracking-tight">Possible combinations</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Vendor combinations whose layers are all in the studio&apos;s shared
          library and match the studio&apos;s firing range.
        </p>
      </header>

      <CombinationsBrowser
        examples={possibleExamples}
        publishedPosts={[]}
        myPosts={[]}
        userExamples={[]}
        glazeFiringImages={glazeFiringImages}
        inventoryStatusByGlazeId={{}}
        initialView="all"
        initialQuery=""
        viewerUserId={null}
        favouriteCombinationIds={[]}
        lockedConeScope={effectiveRange === "both" ? null : effectiveRange}
      />
    </div>
  );
}
