import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GlazePage } from "@/components/new-layout/detail-pages";
import { getCatalogFiringImages } from "@/lib/catalog";
import { resolveGlazeById } from "@/lib/data/glazes";
import { getCone6Catalog, toNLGlaze } from "@/lib/new-layout/catalog";
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
  const traits = [nl?.cone6 ? "Cone 6" : glaze.cone, nl?.ft.slice(0, 2).join(", "), nl?.ct.slice(0, 2).join(", ")].filter(Boolean).join(" · ");
  const description = traits
    ? `${label}: ${traits}. See the fired result, combos you can make with it, and where to buy it.`
    : `${label}: see the fired result, combos you can make with it, and where to buy it.`;
  const image = nl?.photos[0]?.[0];
  return {
    title: label,
    description,
    alternates: { canonical: `/glazes/${glazeId}` },
    openGraph: { title: label, description, ...(image && image.startsWith("http") ? { images: [{ url: image }] } : {}) },
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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense>
        <GlazePage glaze={glaze} />
      </Suspense>
    </>
  );
}
