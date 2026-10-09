import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ClassicStudioLayout from "@/app/studio/[slug]/layout";
import { StudioGate, StudioMember } from "@/components/new-layout/studio-member";
import { getStudioBySlug, getStudioSharedGlazes } from "@/lib/data/studios";
import { getViewer } from "@/lib/data/users";
import { isVisitorCookieValid, visitorCookieName } from "@/lib/studio-auth";

/**
 * Studio member pages in the Cone 6 layout. Studios set to earthenware or "both"
 * keep the classic studio pages, which have the cone switcher they rely on.
 */
export default async function NewStudioLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();
  if (studio.firingRange !== "midfire") return <ClassicStudioLayout params={params}>{children}</ClassicStudioLayout>;

  const viewer = await getViewer();
  const isOwner = viewer?.profile.id === studio.ownerUserId;
  const cookie = (await cookies()).get(visitorCookieName(studio.slug))?.value;
  if (!isOwner && !isVisitorCookieValid(studio.id, cookie)) {
    return <StudioGate slug={studio.slug} name={studio.displayName} />;
  }

  const shared = await getStudioSharedGlazes(studio, "midfire");
  return (
    <StudioMember slug={studio.slug} name={studio.displayName} glazeIds={shared.map((glaze) => glaze.id)} isOwner={isOwner}>
      {children}
    </StudioMember>
  );
}
