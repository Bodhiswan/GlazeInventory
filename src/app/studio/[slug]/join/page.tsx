import Link from "next/link";
import { notFound } from "next/navigation";

import { getStudioBySlug } from "@/lib/data/studios";
import { Panel } from "@/components/ui/panel";
import { buttonVariants } from "@/components/ui/button";

export default async function StudioJoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <header className="space-y-2 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Join Glaze Inventory</p>
        <h2 className="display-font text-3xl tracking-tight">
          Track your own glaze tests
        </h2>
        <p className="text-sm leading-6 text-muted">
          Members of {studio.displayName} can browse this page without an
          account, but creating one lets you save your own inventory, log firing
          tests, and follow combinations across studios.
        </p>
      </header>

      <Panel className="flex flex-col items-center gap-3">
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent(`/studio/${slug}/library`)}`}
          className={buttonVariants({})}
        >
          Create a free account
        </Link>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          Already have one?{" "}
          <Link href="/auth/sign-in" className="underline">
            Sign in
          </Link>
        </p>
      </Panel>
    </div>
  );
}
