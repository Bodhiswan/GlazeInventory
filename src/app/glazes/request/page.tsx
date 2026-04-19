import Link from "next/link";

import { requestGlazeBrandAction } from "@/app/actions/glaze-requests";
import { PageHeader } from "@/components/page-header";
import { FormBanner } from "@/components/ui/form-banner";
import { Panel } from "@/components/ui/panel";
import { buttonVariants } from "@/components/ui/button";
import { requireViewer } from "@/lib/data/users";

export default async function RequestGlazeBrandPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <PageHeader
        tone="butter"
        eyebrow="Library"
        title="Request a glaze brand"
        description="Can't find a brand you use? Let us know and we'll look at adding it to the catalog."
        actions={
          <Link href="/glazes" className={buttonVariants({ variant: "ghost" })}>
            Back to library
          </Link>
        }
      />

      {params.error ? (
        <FormBanner variant="error">{decodeURIComponent(params.error)}</FormBanner>
      ) : null}
      {params.saved ? (
        <FormBanner variant="success">
          Thanks — your request has been logged for the team to review.
        </FormBanner>
      ) : null}

      <Panel className="space-y-5">
        <form action={requestGlazeBrandAction} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="brandName" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Brand name
            </label>
            <input
              id="brandName"
              name="brandName"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Opulence"
              className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Notes <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={2000}
              placeholder="Anything we should know — website, product line, why you'd love it in the catalog."
              className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <button type="submit" className={buttonVariants({})}>
            Submit request
          </button>
        </form>
      </Panel>
    </div>
  );
}
