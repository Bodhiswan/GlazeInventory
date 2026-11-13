import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PortfolioView } from "@/components/new-layout/portfolio-view";
import { getNLViewerState, getPotterPortfolio } from "@/lib/new-layout/viewer-state";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(userId: string) {
  if (!UUID.test(userId)) return null;
  const state = await getNLViewerState();
  return getPotterPortfolio(userId, state.viewer?.id ?? null, state.extraGlazes);
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params;
  const portfolio = await load(userId);
  if (!portfolio) return { title: "Portfolio not found" };
  return {
    title: `${portfolio.potter.name}'s portfolio`,
    description: `Glaze combinations and firing results posted by ${portfolio.potter.name}.`,
    // Shared by link; kept out of search results.
    robots: { index: false, follow: true },
  };
}

export default async function PotterPortfolioPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const portfolio = await load(userId);
  if (!portfolio) notFound();
  return (
    <Suspense>
      <PortfolioView potter={portfolio.potter} combos={portfolio.combos} glazes={portfolio.glazes} />
    </Suspense>
  );
}
