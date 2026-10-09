import { Suspense } from "react";

import ClassicCombinationsPage from "@/app/studio/[slug]/combinations/page";
import { MemberCombos } from "@/components/new-layout/studio-member";
import { getStudioBySlug } from "@/lib/data/studios";

export default async function StudioCombinationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const studio = await getStudioBySlug((await params).slug);
  if (studio && studio.firingRange !== "midfire") return <ClassicCombinationsPage params={params} />;
  return <Suspense><MemberCombos /></Suspense>;
}
