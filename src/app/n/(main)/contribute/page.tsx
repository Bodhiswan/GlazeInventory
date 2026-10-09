import type { Metadata } from "next";
import { Suspense } from "react";

import { AddResultView } from "@/components/new-layout/add-result-view";
import { requireViewer } from "@/lib/data/users";

export const metadata: Metadata = {
  title: "Add a result",
  robots: { index: false, follow: false },
};

export default async function AddResultPage({ searchParams }: { searchParams: Promise<{ glaze?: string }> }) {
  const viewer = await requireViewer();
  const { glaze } = await searchParams;
  const disabled = Boolean(viewer.profile.contributionsDisabled && !viewer.profile.isAdmin);
  return (
    <Suspense>
      <AddResultView userId={viewer.profile.id} preselect={glaze ?? null} disabled={disabled} />
    </Suspense>
  );
}
