import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/lib/data/users";
import { GlazeCatalogServer } from "./_components/glaze-catalog-server";
import { GlazeCatalogSkeleton } from "./_components/glaze-catalog-skeleton";
import { GlazeCatalogPublicServer } from "./_components/glaze-catalog-public-server";

export const metadata: Metadata = {
  title: "Ceramic Glaze Catalog",
  description:
    "Browse glazes from Mayco, AMACO, Coyote, Duncan, Spectrum, and more. Filter by color, finish, cone range, and brand. See firing images and community results.",
  alternates: {
    canonical: "/glazes",
  },
};

export default async function GlazesPage() {
  const viewer = await getViewer();

  if (viewer) {
    return (
      <Suspense fallback={<GlazeCatalogSkeleton />}>
        <GlazeCatalogServer profile={viewer.profile} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<GlazeCatalogSkeleton />}>
      <GlazeCatalogPublicServer />
    </Suspense>
  );
}
