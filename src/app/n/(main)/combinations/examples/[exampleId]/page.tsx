import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ComboPage } from "@/components/new-layout/detail-pages";
import { getNLComboForPage } from "@/lib/new-layout/catalog";

export async function generateMetadata({ params }: { params: Promise<{ exampleId: string }> }): Promise<Metadata> {
  const { exampleId } = await params;
  const found = getNLComboForPage(exampleId);
  if (!found) return { title: "Combination not found" };
  const title = found.combo.title;
  const description = `${title}: the fired ${found.combo.cone ?? "Cone 6"} result from ${found.combo.vendor}, how to apply it, and which glazes you need.`;
  return {
    title,
    description,
    alternates: { canonical: `/combinations/examples/${exampleId}` },
    openGraph: { title, description, ...(found.combo.image ? { images: [{ url: found.combo.image }] } : {}) },
  };
}

export default async function ComboDetailPage({ params }: { params: Promise<{ exampleId: string }> }) {
  const { exampleId } = await params;
  const found = getNLComboForPage(exampleId);
  if (!found) notFound();
  return (
    <Suspense>
      <ComboPage combo={found.combo} glazes={found.glazes} />
    </Suspense>
  );
}
