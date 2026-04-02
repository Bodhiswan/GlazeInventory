import Link from "next/link";
import { notFound } from "next/navigation";

import {
  publishExternalExampleIntakeAction,
  setExternalExampleIntakeStatusAction,
  updateExternalExampleGlazeMatchAction,
  updateExternalExampleReviewNotesAction,
} from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { getCatalogGlazes, getExternalExampleIntake, requireViewer } from "@/lib/data";
import { formatGlazeLabel, formatSearchQuery } from "@/lib/utils";

export default async function ExternalExampleIntakeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ intakeId: string }>;
  searchParams: Promise<{ saved?: string; error?: string; published?: string }>;
}) {
  const viewer = await requireViewer();

  if (!viewer.profile.isAdmin) {
    return (
      <Panel>
        <h1 className="display-font text-3xl tracking-tight">Intake access required</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          This screen is only available for studio administrators.
        </p>
      </Panel>
    );
  }

  const { intakeId } = await params;
  const intake = await getExternalExampleIntake(intakeId);

  if (!intake) {
    notFound();
  }

  const glazes = await getCatalogGlazes(viewer.profile.id);
  const query = await searchParams;
  const saved = formatSearchQuery(query.saved);
  const error = formatSearchQuery(query.error);
  const published = formatSearchQuery(query.published);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="External intake review"
        description="Keep the archived record private, refine the glaze matches, and only publish once exactly two approved glazes are locked in."
        actions={
          <>
            <Link href="/admin/intake" className={buttonVariants({ variant: "ghost" })}>
              Back to queue
            </Link>
            <a href={intake.sourceUrl} target="_blank" rel="noreferrer" className={buttonVariants({})}>
              Open source post
            </a>
          </>
        }
      />

      {saved ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Intake update saved.
        </div>
      ) : null}
      {published ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Intake published into the community pair feed.
        </div>
      ) : null}
      {error ? (
        <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Panel className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={intake.reviewStatus === "published" ? "success" : "neutral"}>
                {intake.reviewStatus}
              </Badge>
              <Badge tone="accent">{intake.assets.length} assets</Badge>
              <Badge tone="accent">
                {intake.glazeMentions.filter((mention) => mention.isApproved).length} approved matches
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Group</p>
                <p className="text-sm">{intake.groupLabel}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Captured</p>
                <p className="text-sm">{new Date(intake.createdAt).toLocaleString("en-AU")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Visible source timestamp</p>
                <p className="text-sm">{intake.rawSourceTimestamp ?? "Not captured"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Privacy mode</p>
                <p className="text-sm">{intake.privacyMode}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Raw caption</p>
              <p className="text-sm leading-6 text-foreground/90 whitespace-pre-wrap">
                {intake.rawCaption ?? "No caption captured."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Hidden attribution</p>
              <p className="text-sm text-muted">
                {intake.rawAuthorDisplayName ?? "No visible author name captured."}
              </p>
            </div>
          </Panel>

          <Panel className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Archived assets</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Imported images</h2>
            </div>
            {intake.assets.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {intake.assets.map((asset) => (
                  <div key={asset.id} className="space-y-3 border border-border bg-panel p-3">
                    {asset.signedImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.signedImageUrl}
                        alt={intake.rawCaption ?? "Archived imported glaze result"}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-border text-sm text-muted">
                        Signed preview unavailable
                      </div>
                    )}
                    <div className="space-y-1 text-xs text-muted">
                      <p>Method: {asset.captureMethod}</p>
                      <p>Size: {asset.width ?? "?"} × {asset.height ?? "?"}</p>
                      <p className="break-all">SHA-256: {asset.sha256}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No archived assets were stored for this intake.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Parser output</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Detected signals</h2>
            </div>
            <div className="space-y-2 text-sm text-muted">
              <p>Cone: {intake.parserOutput.extractedCone ?? "Not detected"}</p>
              <p>Atmosphere: {intake.parserOutput.extractedAtmosphere ?? "Not detected"}</p>
              <p>Clay body: {intake.parserOutput.extractedClayBody ?? "Not detected"}</p>
              <p>Duplicate source URL: {intake.parserOutput.duplicateSourceUrl ? "Likely" : "No signal"}</p>
              <p>
                Duplicate hashes: {intake.parserOutput.duplicateSha256s?.length ? intake.parserOutput.duplicateSha256s.join(", ") : "None"}
              </p>
            </div>
          </Panel>

          <Panel className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Glaze matches</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Approve exactly two</h2>
            </div>

            <datalist id="catalog-glaze-options">
              {glazes.map((glaze) => (
                <option key={glaze.id} value={formatGlazeLabel(glaze)} />
              ))}
            </datalist>

            {intake.glazeMentions.length ? (
              <div className="space-y-4">
                {intake.glazeMentions.map((mention) => (
                  <form
                    key={mention.id}
                    action={updateExternalExampleGlazeMatchAction}
                    className="space-y-3 border border-border bg-panel p-4"
                  >
                    <input type="hidden" name="mentionId" value={mention.id} />
                    <input type="hidden" name="intakeId" value={intake.id} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={mention.isApproved ? "success" : "neutral"}>
                        {mention.isApproved ? "approved" : "pending"}
                      </Badge>
                      <Badge tone="accent">{Math.round(mention.confidence * 100)}% confidence</Badge>
                    </div>
                    <p className="text-sm font-medium">{mention.freeformText}</p>
                    <label className="grid gap-2 text-sm font-medium">
                      Match to glaze
                      <Input
                        name="matchInput"
                        defaultValue={mention.matchedGlaze ? formatGlazeLabel(mention.matchedGlaze) : mention.freeformText}
                        list="catalog-glaze-options"
                        placeholder="Start typing a glaze label or code"
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm text-muted">
                      <input
                        type="checkbox"
                        name="approved"
                        defaultChecked={mention.isApproved}
                        className="h-4 w-4 border border-border bg-transparent"
                      />
                      Mark this match as approved for publishing
                    </label>
                    {mention.matchedGlaze ? (
                      <p className="text-sm text-muted">Current match: {formatGlazeLabel(mention.matchedGlaze)}</p>
                    ) : null}
                    <Button type="submit" variant="ghost">
                      Save match
                    </Button>
                  </form>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No glaze mentions were detected from the raw caption.</p>
            )}
          </Panel>

          <Panel className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Reviewer notes</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Archive notes</h2>
            </div>
            <form action={updateExternalExampleReviewNotesAction} className="space-y-3">
              <input type="hidden" name="intakeId" value={intake.id} />
              <Textarea
                name="reviewNotes"
                defaultValue={intake.reviewNotes ?? ""}
                placeholder="Keep any notes you want to surface as application context once this is published."
              />
              <Button type="submit" variant="ghost">
                Save notes
              </Button>
            </form>
          </Panel>

          <Panel className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Review status</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Queue controls</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {["queued", "approved", "rejected"].map((status) => (
                <form key={status} action={setExternalExampleIntakeStatusAction}>
                  <input type="hidden" name="intakeId" value={intake.id} />
                  <input type="hidden" name="reviewStatus" value={status} />
                  <Button type="submit" variant={status === "rejected" ? "danger" : "ghost"}>
                    Mark {status}
                  </Button>
                </form>
              ))}
            </div>

            <form action={setExternalExampleIntakeStatusAction} className="space-y-3 border border-border bg-panel p-4">
              <input type="hidden" name="intakeId" value={intake.id} />
              <input type="hidden" name="reviewStatus" value="duplicate" />
              <label className="grid gap-2 text-sm font-medium">
                Duplicate of intake ID
                <Input
                  name="duplicateOfIntakeId"
                  defaultValue={intake.duplicateOfIntakeId ?? ""}
                  placeholder="Optional intake UUID if you want to link to an older record"
                />
              </label>
              <Button type="submit" variant="ghost">
                Mark duplicate
              </Button>
            </form>

            <form action={publishExternalExampleIntakeAction}>
              <input type="hidden" name="intakeId" value={intake.id} />
              <Button type="submit">
                Publish as community pair
              </Button>
            </form>

            {intake.publishedPostId ? (
              <p className="text-sm text-muted">
                Published post ID: <span className="font-mono">{intake.publishedPostId}</span>
              </p>
            ) : null}
          </Panel>
        </div>
      </section>
    </div>
  );
}
