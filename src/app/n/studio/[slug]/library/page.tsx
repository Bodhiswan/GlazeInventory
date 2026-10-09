import { Suspense } from "react";

import ClassicLibraryPage from "@/app/studio/[slug]/library/page";
import { MemberGlazes } from "@/components/new-layout/studio-member";
import { getStudioBySlug } from "@/lib/data/studios";

export default async function StudioLibraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const studio = await getStudioBySlug((await params).slug);
  if (studio && studio.firingRange !== "midfire") return <ClassicLibraryPage params={params} />;
  return <Suspense><MemberGlazes /></Suspense>;
}
