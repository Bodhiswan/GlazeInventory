import { Suspense } from "react";
import { requireViewer } from "@/lib/data/users";
import { GlazeCatalogServer } from "./_components/glaze-catalog-server";
import { GlazeCatalogSkeleton } from "./_components/glaze-catalog-skeleton";

export default async function GlazesPage() {
  const viewer = await requireViewer();

  return (
    <Suspense fallback={<GlazeCatalogSkeleton />}>
      <GlazeCatalogServer profile={viewer.profile} />
    </Suspense>
  );
}
