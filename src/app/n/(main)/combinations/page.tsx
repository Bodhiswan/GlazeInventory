import type { Metadata } from "next";
import { Suspense } from "react";

import { CombosView } from "@/components/new-layout/combos-view";
import { getNLViewerState, getPotterCombos } from "@/lib/new-layout/viewer-state";

export const metadata: Metadata = {
  title: "Cone 6 Glaze Combinations: Layering Results with Photos",
  description: "What does one glaze look like over another? Browse layered Cone 6 glaze combinations from Mayco, AMACO and Coyote test tiles, plus potters' own results, and see which you can make with the glazes on your shelf.",
  alternates: { canonical: "/combinations" },
};

export default async function CombinationsPage() {
  const state = await getNLViewerState();
  const potterCombos = await getPotterCombos(state.viewer?.id ?? null, state.extraGlazes);
  return (
    <Suspense>
      <CombosView potterCombos={potterCombos} />
    </Suspense>
  );
}
