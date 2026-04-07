import { publishUserCombinationAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { PublishCombinationForm } from "@/components/publish-combination-form";
import { SetupCallout } from "@/components/setup-callout";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { getCatalogGlazes } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await requireViewer();
  const allGlazes = await getCatalogGlazes(viewer.profile.id);
  const params = await searchParams;
  const error = formatSearchQuery(params.error);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Publish"
        title="Share a kiln-tested combination"
        description="Document your result so other members can repeat or avoid it: show the fired surface, explain how the layers were applied, and leave enough kiln context for someone else to learn from."
      />

      {viewer.mode === "demo" ? <SetupCallout compact /> : null}
      {error ? (
        <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Panel className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">Member example</Badge>
              <Badge tone="neutral">Up to 4 layers</Badge>
              <Badge tone="accent">Notes matter</Badge>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">What good entries include</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Give the result enough context to travel</h2>
            </div>

            <div className="grid gap-4">
              <div className="border border-border bg-panel px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Result</p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">
                  Show the fired surface clearly and say what stood out: breaking, movement, crystal growth, running, pinholing, or color shift.
                </p>
              </div>
              <div className="border border-border bg-panel px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Application</p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">
                  Note the layer order, number of coats, and whether you brushed, dipped, poured, sprayed, or overlapped on a rim.
                </p>
              </div>
              <div className="border border-border bg-panel px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Firing</p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">
                  Capture the clay body, cone, atmosphere, cool-down, and anything unusual about placement or loading that changed the outcome.
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Prompts</p>
            <div className="grid gap-3">
              <p className="border border-border bg-panel px-4 py-3 text-sm text-foreground/90">
                "Two brushed coats of the base, one heavier overlap on the rim, and the top glaze broke blue where it thinned."
              </p>
              <p className="border border-border bg-panel px-4 py-3 text-sm text-foreground/90">
                "Cone 6 oxidation on speckled buff stoneware with a slow cool. The overlap ran more on the front shelf than my test tile."
              </p>
            </div>
          </Panel>
        </div>

        <Panel className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Member submission</p>
            <h2 className="display-font text-3xl tracking-tight">Build a documented example</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              This publishes into the combinations area. Choose 2-4 glaze layers, upload your result photo, and add enough notes for the example to be useful.
            </p>
          </div>

          <form action={publishUserCombinationAction} className="grid gap-6">
            <PublishCombinationForm
              disabled={viewer.mode === "demo"}
              glazes={allGlazes}
            />
          </form>
        </Panel>
      </section>
    </div>
  );
}
