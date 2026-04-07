import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { getExternalExampleIntakeQueue } from "@/lib/data/admin";
import { requireViewer } from "@/lib/data/users";
import type { IntakeStatus } from "@/lib/types";
import { cn, formatSearchQuery } from "@/lib/utils";

const statusOptions: Array<{ value: IntakeStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "approved", label: "Approved" },
  { value: "duplicate", label: "Duplicate" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
];

export default async function ExternalExampleIntakeQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string; error?: string }>;
}) {
  const viewer = await requireViewer();

  if (!viewer.profile.isAdmin) {
    return <EmptyState title="Intake access required" description="This queue is only available for studio administrators." />;
  }

  const params = await searchParams;
  const selectedStatus = (formatSearchQuery(params.status) || "all") as IntakeStatus | "all";
  const saved = formatSearchQuery(params.saved);
  const error = formatSearchQuery(params.error);
  const allIntakes = await getExternalExampleIntakeQueue("all");
  const filteredIntakes =
    selectedStatus === "all"
      ? allIntakes
      : allIntakes.filter((intake) => intake.reviewStatus === selectedStatus);

  const counts = statusOptions.reduce<Record<string, number>>((map, option) => {
    map[option.value] =
      option.value === "all"
        ? allIntakes.length
        : allIntakes.filter((intake) => intake.reviewStatus === option.value).length;
    return map;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="External intake queue"
        description="Review archived Facebook group captures, verify the parser output, and only promote clean two-glaze results into the public community feed."
        actions={
          <Link href="/admin/moderation" className={buttonVariants({ variant: "ghost" })}>
            Open moderation
          </Link>
        }
      />

      {saved ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Intake update saved.
        </div>
      ) : null}
      {error ? (
        <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {statusOptions.map((option) => {
          const isActive = option.value === selectedStatus;
          return (
            <Link
              key={option.value}
              href={option.value === "all" ? "/admin/intake" : `/admin/intake?status=${option.value}`}
              className={cn(
                "inline-flex items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors",
                isActive
                  ? "border-foreground bg-panel text-foreground"
                  : "border-border text-muted hover:bg-panel/60 hover:text-foreground",
              )}
            >
              <span>{option.label}</span>
              <span className="text-muted">{counts[option.value]}</span>
            </Link>
          );
        })}
      </div>

      {filteredIntakes.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredIntakes.map((intake) => {
            const heroAsset = intake.assets[0];
            const approvedMentionCount = intake.glazeMentions.filter((mention) => mention.isApproved).length;

            return (
              <Panel key={intake.id} className="space-y-4">
                {heroAsset?.signedImageUrl ? (
                  <div className="overflow-hidden border border-border bg-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroAsset.signedImageUrl}
                      alt={intake.rawCaption ?? "Imported glaze example"}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={intake.reviewStatus === "published" ? "success" : "neutral"}>
                    {intake.reviewStatus}
                  </Badge>
                  <Badge tone="accent">{approvedMentionCount} approved matches</Badge>
                  <Badge tone="neutral">{intake.assets.length} assets</Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.16em] text-muted">{intake.groupLabel}</p>
                  <p className="text-sm leading-6 text-foreground/90">
                    {(intake.rawCaption ?? "No caption captured.").slice(0, 220)}
                    {(intake.rawCaption ?? "").length > 220 ? "..." : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-muted">
                  {intake.parserOutput.extractedCone ? <span>{intake.parserOutput.extractedCone}</span> : null}
                  {intake.parserOutput.extractedAtmosphere ? <span>{intake.parserOutput.extractedAtmosphere}</span> : null}
                  {intake.parserOutput.extractedClayBody ? <span>{intake.parserOutput.extractedClayBody}</span> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {intake.glazeMentions.length ? (
                    intake.glazeMentions.slice(0, 4).map((mention) => (
                      <Badge key={mention.id} tone={mention.isApproved ? "success" : "neutral"} className="normal-case tracking-[0.08em]">
                        {mention.freeformText}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No glaze mentions detected yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/intake/${intake.id}`} className={buttonVariants({})}>
                    Review intake
                  </Link>
                  <a
                    href={intake.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "ghost" })}
                  >
                    Open source
                  </a>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No intake records in this view."
          description="Run `npm run import:facebook` to capture posts, then come back here to review them."
        />
      )}
    </div>
  );
}
