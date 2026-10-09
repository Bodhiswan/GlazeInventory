import type { Metadata } from "next";
import { Suspense } from "react";

import { CombosView } from "@/components/new-layout/combos-view";
import { getNLViewerState, getPotterCombos } from "@/lib/new-layout/viewer-state";

export const metadata: Metadata = {
  title: "Cone 6 Glaze Combinations",
  description: "Layered Cone 6 glaze combinations from Mayco, AMACO and Coyote, plus potters' own results. See which ones you can make with the glazes on your shelf.",
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
