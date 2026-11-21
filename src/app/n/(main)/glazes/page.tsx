import type { Metadata } from "next";
import { Suspense } from "react";

import Link from "next/link";

import { CollectionLinks } from "@/components/new-layout/browse";
import { GlazesView } from "@/components/new-layout/glazes-view";
import { getCone6Catalog } from "@/lib/new-layout/catalog";
import { getCollections } from "@/lib/new-layout/collections";
import { getInitialGlazes } from "@/lib/new-layout/initial";

export function generateMetadata(): Metadata {
  // "2,000+" rather than an exact figure, so the title doesn't change with every catalogue update.
  const rounded = Math.floor(getCone6Catalog().glazes.length / 100) * 100;
  return {
    title: `Cone 6 Glazes: Compare ${rounded.toLocaleString("en")}+ Commercial Midfire Glazes`,
    description: "Find the right cone 6 glaze: search commercial midfire glazes from Mayco, AMACO, Coyote, Spectrum and more by colour, finish and brand. See each fired result, the combinations it works in, and where to buy it.",
    alternates: { canonical: "/glazes" },
  };
}

export default function GlazesPage() {
  const collections = getCollections();
  const pick = (kind: string, limit: number) => collections.filter((collection) => collection.kind === kind).slice(0, limit);
  return (
    <>
      <Suspense>
        <GlazesView initialGlazes={getInitialGlazes()} />
      </Suspense>
      <nav className="nl-browse-foot" aria-labelledby="glazes-browse">
        <h2 id="glazes-browse">Browse Cone 6 glazes</h2>
        <CollectionLinks collections={[...pick("colour", 12), ...pick("finish", 3), ...pick("type", 9), ...pick("brand", 8)]} showCount={false} />
        <p className="nl-note">
          <Link className="nl-link" href="/cone-6-glazes">All colours, finishes, brands and product lines</Link>
          {" · "}
          <Link className="nl-link" href="/guides/glazing-pottery/choosing-a-glaze">How to choose a glaze</Link>
        </p>
      </nav>
    </>
  );
}
