import Link from "next/link";

import ClassicJoinPage from "@/app/studio/[slug]/join/page";
import { getStudioBySlug } from "@/lib/data/studios";

export default async function StudioJoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (studio && studio.firingRange !== "midfire") return <ClassicJoinPage params={params} />;
  return (
    <div className="nl-gate">
      <div>
        <div className="nl-eyebrow">Join Glaze Inventory</div>
        <h1>Track your own glaze tests</h1>
        <p className="nl-muted">Members of {studio?.displayName ?? "this studio"} can browse without an account. A free account lets you keep a shelf, post firing results and see which combos you can make.</p>
      </div>
      <div className="nl-actions" style={{ justifyContent: "center" }}>
        <Link className="nl-btn primary" href={`/auth/sign-up?redirectTo=${encodeURIComponent(`/studio/${slug}/library`)}`}>Create a free account</Link>
        <Link className="nl-btn quiet" href="/auth/sign-in">Sign in</Link>
      </div>
    </div>
  );
}
