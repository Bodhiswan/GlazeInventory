import type { Metadata } from "next";
import { Suspense } from "react";

import { GlazesView } from "@/components/new-layout/glazes-view";
import { getInitialGlazes } from "@/lib/new-layout/initial";

export const metadata: Metadata = {
  title: "Cone 6 Glazes",
  description: "Search Cone 6 glazes from Mayco, AMACO, Coyote, Spectrum and more by colour, finish and brand. See the Cone 6 result, combos you can make, and where to buy.",
  alternates: { canonical: "/glazes" },
};

export default function GlazesPage() {
  return (
    <Suspense>
      <GlazesView initialGlazes={getInitialGlazes()} />
    </Suspense>
  );
}
