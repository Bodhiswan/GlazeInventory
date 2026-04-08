import { PageHeader } from "@/components/page-header";
import { SetupCallout } from "@/components/setup-callout";
import type { CatalogEntry } from "@/components/custom-glaze-form";
import { CustomGlazeForm } from "@/components/custom-glaze-form";
import { Panel } from "@/components/ui/panel";
import { getCatalogGlazes } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";

export default async function NewGlazePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const returnTo = formatSearchQuery(params.returnTo) ?? "/inventory";

  // Fetch both static catalog and user's existing custom glazes for dupe detection
  const allGlazes = await getCatalogGlazes(viewer.profile.id);
  const catalogEntries: CatalogEntry[] = allGlazes.map((g) => ({
    id: g.id,
    name: g.name,
    brand: g.brand ?? null,
    code: g.code ?? null,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Custom glaze"
        title="Add an unlisted glaze"
        description="If a glaze is not in the catalog, you can add it here. It will appear in your inventory and in the combination search so you can document results that use it."
      />

      {viewer.mode === "demo" ? <SetupCallout compact /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* ── Guidance ── */}
        <div className="space-y-4">
          <Panel className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">Before adding</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Check the library first</h2>
            </div>
            <p className="text-sm leading-6 text-muted">
              The catalog includes glazes from AMACO, Coyote, Duncan, Laguna, Mayco, Spectrum, and Speedball.
              Search the library before adding — duplicate entries make the catalog harder to use for everyone.
            </p>
            <div className="grid gap-3">
              <div className="border border-border bg-panel px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Name</p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">
                  Use Title Case. Write the glaze name exactly as it appears on the label or in documentation — not a nickname.
                </p>
              </div>
              <div className="border border-border bg-panel px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Cone</p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">
                  Required. Select the correct firing range — this is the most important field for usefulness in combinations.
                </p>
              </div>
              <div className="border border-border bg-panel px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Code</p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">
                  If the glaze has an official product code (e.g. TB-01), enter it exactly. Leave blank for studio or recipe glazes.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Form ── */}
        <Panel className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">New entry</p>
            <h2 className="display-font text-3xl tracking-tight">Describe the glaze</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Accurate fields let others find and compare combinations correctly.
            </p>
          </div>

          <CustomGlazeForm
            catalogEntries={catalogEntries}
            returnTo={returnTo}
            disabled={viewer.mode === "demo"}
          />
        </Panel>
      </section>
    </div>
  );
}
