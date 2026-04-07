import Link from "next/link";
import { Camera, Layers3, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { getLeaderboard } from "@/lib/data/admin";
import { requireViewer } from "@/lib/data/users";

export default async function ContributePage() {
  await requireViewer();
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Contribute · Beta"
        title="Share your knowledge"
        description="Help build the library by sharing combination results or adding glazes that aren't in the catalog yet."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* ── Share a combination ── */}
        <Link
          href="/publish"
          className="group flex flex-col gap-4 border border-border bg-panel p-6 transition-colors hover:border-foreground/30 hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors group-hover:border-foreground/30">
            <Layers3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="space-y-1.5">
            <span className="block text-base font-medium text-foreground">Share a combination</span>
            <span className="block text-sm leading-6 text-muted">
              Document a kiln-tested layered result — fired surface photo, layer order, cone, and atmosphere. Helps others repeat or avoid it.
            </span>
          </span>
          <span className="mt-auto text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-foreground">
            Go to publish →
          </span>
        </Link>

        {/* ── Add a custom glaze ── */}
        <Link
          href="/glazes/new"
          className="group flex flex-col gap-4 border border-border bg-panel p-6 transition-colors hover:border-foreground/30 hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors group-hover:border-foreground/30">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="space-y-1.5">
            <span className="block text-base font-medium text-foreground">Add a custom glaze</span>
            <span className="block text-sm leading-6 text-muted">
              Got a studio glaze, recipe glaze, or brand not yet in the catalog? Add it so it appears in the library and combination search.
            </span>
          </span>
          <span className="mt-auto text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-foreground">
            Go to add glaze →
          </span>
        </Link>

        {/* ── Upload a firing photo ── */}
        <Link
          href="/contribute/firing-image"
          className="group flex flex-col gap-4 border border-border bg-panel p-6 transition-colors hover:border-foreground/30 hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors group-hover:border-foreground/30">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="space-y-1.5">
            <span className="block text-base font-medium text-foreground">Upload a firing photo</span>
            <span className="block text-sm leading-6 text-muted">
              Attach a fired result photo to any glaze or combination in the library. Helps others see real-world results across different kilns and bodies.
            </span>
          </span>
          <span className="mt-auto text-[10px] uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-foreground">
            Go to upload →
          </span>
        </Link>
      </div>

      {/* ── People to thank ── */}
      {leaderboard.length > 0 ? (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">People to thank</p>
            <p className="mt-1 text-sm text-muted">Top contributors who have helped build this library</p>
          </div>
          <div className="divide-y divide-border border border-border">
            {leaderboard.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{contributor.displayName}</p>
                  {contributor.studioName ? (
                    <p className="truncate text-xs text-muted">{contributor.studioName}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  {contributor.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
