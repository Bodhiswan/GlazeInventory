import type { Metadata } from "next";
import { Suspense } from "react";

import { ShelfView } from "@/components/new-layout/shelf-view";
import { requireViewer } from "@/lib/data/users";
import { getMyResults, getNLViewerState } from "@/lib/new-layout/viewer-state";

export const metadata: Metadata = {
  title: "My shelf",
  robots: { index: false, follow: false },
};

export default async function ShelfPage() {
  await requireViewer();
  const state = await getNLViewerState();
  const mine = state.viewer ? await getMyResults(state.viewer.id, state.extraGlazes) : { combos: [], glazes: [] };
  return (
    <Suspense>
      <ShelfView myResults={mine.combos} resultGlazes={mine.glazes} />
    </Suspense>
  );
}
