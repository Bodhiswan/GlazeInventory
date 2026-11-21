import type { Metadata } from "next";
import Link from "next/link";

import { CollectionLinks, JsonLd } from "@/components/new-layout/browse";
import { getBaseUrl } from "@/lib/env";
import { getCone6Catalog } from "@/lib/new-layout/catalog";
import { COLLECTION_KIND_HEADINGS, getCollections, type CollectionKind } from "@/lib/new-layout/collections";

export const metadata: Metadata = {
  title: "Cone 6 Glazes by Colour, Finish, Type & Brand",
  description:
    "Find a cone 6 glaze by what you want it to do: browse commercial midfire glazes by colour, finish, type, brand and product line, each with fired photos and layering combinations.",
  alternates: { canonical: "/cone-6-glazes" },
};

const KINDS: CollectionKind[] = ["colour", "finish", "type", "brand", "line"];

const KIND_NOTES: Record<CollectionKind, string> = {
  colour: "Sorted by the colour in each manufacturer's fired photo, not the name on the jar.",
  finish: "Grouped by the surface the manufacturer describes.",
  type: "Glaze families and effects potters ask for by name.",
  brand: "Every cone 5–6 glaze we list from each maker.",
  line: "Each maker's ranges, with every colour in the range on one page.",
};

export default function BrowseGlazesPage() {
  const collections = getCollections();
  const total = getCone6Catalog().glazes.length;
  const baseUrl = getBaseUrl();

  return (
    <div className="nl-browse">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Cone 6 Glazes by Colour, Finish, Type & Brand",
          url: `${baseUrl}/cone-6-glazes`,
          hasPart: collections.map((collection) => ({
            "@type": "CollectionPage",
            name: collection.title,
            url: `${baseUrl}/cone-6-glazes/${collection.slug}`,
          })),
        }}
      />
      <div className="nl-browse-head">
        <ol className="nl-crumbs" aria-label="Breadcrumb">
          <li><Link href="/glazes">Cone 6 glazes</Link></li>
          <li aria-current="page">Browse</li>
        </ol>
        <h1>Browse Cone 6 glazes</h1>
        <p>
          {total.toLocaleString("en")} commercial midfire glazes, grouped the way people look for them. Pick a colour, a
          finish, a type of glaze or a brand to see every match with its fired photo, the layering combinations it
          appears in, and where to buy it.
        </p>
        <p className="nl-muted">
          Not sure where to start? Read <Link className="nl-link" href="/guides/glazing-pottery/choosing-a-glaze">how to choose a glaze</Link>, or{" "}
          <Link className="nl-link" href="/glazes">search the whole library</Link>.
        </p>
      </div>

      {KINDS.map((kind) => {
        const group = collections.filter((collection) => collection.kind === kind);
        if (!group.length) return null;
        return (
          <section key={kind} className="nl-browse-section" aria-labelledby={`browse-${kind}`}>
            <h2 id={`browse-${kind}`}>{COLLECTION_KIND_HEADINGS[kind]}</h2>
            <p className="nl-muted">{KIND_NOTES[kind]}</p>
            <CollectionLinks collections={group} />
          </section>
        );
      })}
    </div>
  );
}
