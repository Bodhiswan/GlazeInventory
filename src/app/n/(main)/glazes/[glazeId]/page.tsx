import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CollectionLinks, JsonLd } from "@/components/new-layout/browse";
import { GlazePage } from "@/components/new-layout/detail-pages";
import { getBaseUrl } from "@/lib/env";
import { getCatalogFiringImages } from "@/lib/catalog";
import { resolveGlazeById } from "@/lib/data/glazes";
import { getCone6Catalog, toNLGlaze } from "@/lib/new-layout/catalog";
import { getCollectionsForGlaze, getComboCount } from "@/lib/new-layout/collections";
import { formatGlazeLabel } from "@/lib/utils";

async function loadGlaze(glazeId: string) {
  const known = getCone6Catalog().glazes.find((glaze) => glaze.id === glazeId);
  if (known) return known;
  const glaze = await resolveGlazeById(glazeId);
  return glaze ? toNLGlaze(glaze, getCatalogFiringImages(glaze.id)) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ glazeId: string }> }): Promise<Metadata> {
  const { glazeId } = await params;
  const glaze = await resolveGlazeById(glazeId);
  if (!glaze) return { title: "Glaze not found" };
  const nl = await loadGlaze(glazeId);
  const label = formatGlazeLabel(glaze);
  const cone = nl?.cone6 ? "Cone 6" : glaze.cone;
  const combos = getComboCount(glazeId);
  // People search the code and name together ("PC-20 Blue Rutile") and want to know it's the right cone.
  const title = [label, cone ? `${cone} glaze` : "glaze"].join(" · ") + (combos > 1 ? ` (${combos} combinations)` : "");
  const traits = [nl?.line, nl?.ft.slice(0, 2).join(", "), nl?.ct.filter((colour) => colour !== "Clear").slice(0, 2).join(", ")].filter(Boolean).join(" · ");
  const offer = [
    "the fired result",
    combos ? `${combos} layering ${combos === 1 ? "combination" : "combinations"} that use it` : "combinations you can make with it",
    "where to buy it",
  ];
  const description = `${label}${cone ? `, a ${cone} glaze` : ""}${traits ? ` (${traits})` : ""}. See ${offer[0]}, ${offer[1]}, and ${offer[2]}.`;
  const image = nl?.photos[0]?.[0];
  return {
    title,
    description,
    alternates: { canonical: `/glazes/${glazeId}` },
    openGraph: { title, description, ...(image && image.startsWith("http") ? { images: [{ url: image }] } : {}) },
  };
}

export default async function GlazeDetailPage({ params }: { params: Promise<{ glazeId: string }> }) {
  const { glazeId } = await params;
  const glaze = await loadGlaze(glazeId);
  if (!glaze) notFound();
  const label = `${glaze.brand} ${glaze.code} ${glaze.name}`.trim();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: label,
    description: glaze.desc || `${label} ceramic glaze`,
    ...(glaze.brand ? { brand: { "@type": "Brand", name: glaze.brand } } : {}),
    ...(glaze.photos[0] ? { image: glaze.photos[0][0] } : {}),
    category: "Ceramic Glaze",
  };
  const collections = getCollectionsForGlaze(glaze.id);
  const baseUrl = getBaseUrl();
  const trail = collections.find((collection) => collection.kind === "line") ?? collections.find((collection) => collection.kind === "brand");
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Cone 6 glazes", item: `${baseUrl}/glazes` },
      ...(trail ? [{ name: trail.title, item: `${baseUrl}/cone-6-glazes/${trail.slug}` }] : []),
      { name: label, item: `${baseUrl}/glazes/${glaze.id}` },
    ].map((entry, index) => ({ "@type": "ListItem", position: index + 1, ...entry })),
  };
  return (
    <>
      <JsonLd data={[jsonLd, breadcrumbs]} />
      <Suspense>
        <GlazePage glaze={glaze} />
      </Suspense>
      {collections.length ? (
        <nav className="nl-browse-foot" aria-labelledby="glaze-more">
          <h2 id="glaze-more">More glazes like this</h2>
          <CollectionLinks collections={collections} showCount={false} />
        </nav>
      ) : null}
    </>
  );
}
