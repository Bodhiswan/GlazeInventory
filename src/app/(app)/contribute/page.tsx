import Link from "next/link";
import { redirect } from "next/navigation";

import { ContributeForm } from "@/components/contribute-form";
import { PageHeader } from "@/components/page-header";
import { getLeaderboard } from "@/lib/data/admin";
import { getCatalogGlazes } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";

export default async function ContributePage() {
  const viewer = await requireViewer();

  // ── Tutorial gate ──────────────────────────────────────────────────
  if (!viewer.profile.contributionTutorialCompletedAt) {
    redirect("/contribute/welcome");
  }

  // ── Locked-out members (3-strike system) ───────────────────────────
  if (viewer.profile.contributionsDisabled && !viewer.profile.isAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Contribute"
          title="Your contributions are paused"
          description="Your account has accrued three strikes from inaccurate submissions, so contributing is paused while we have a look. This isn't a punishment — we just want to keep the library trustworthy."
        />
        <div className="border border-border bg-panel p-6">
          <p className="text-sm leading-6 text-foreground/90">
            Reach out to a moderator to get your contributions re-enabled. You can still browse,
            comment, and use the library normally in the meantime.
          </p>
        </div>
      </div>
    );
  }

  const [catalogGlazes, leaderboard] = await Promise.all([
    getCatalogGlazes(viewer.profile.id),
    getLeaderboard(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Contribute"
        title="Share what came out of the kiln"
        description="One form for everything — a firing photo, a layered combination, or a glaze that isn't here yet. The form expands as you go."
        actions={
          <Link
            href="/contribute/welcome?revisit=1"
            className="text-[10px] uppercase tracking-[0.16em] text-muted underline-offset-4 hover:underline"
          >
            How contributing works →
          </Link>
        }
      />

      <ContributeForm glazes={catalogGlazes} />

      {/* ── People to thank ── */}
      {leaderboard.length > 0 ? (
        <div className="space-y-4 pt-2">
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
                  <p className="truncate text-sm font-medium text-foreground">
                    {contributor.displayName}
                  </p>
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
