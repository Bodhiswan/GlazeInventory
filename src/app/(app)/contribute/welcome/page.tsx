import { redirect } from "next/navigation";
import { Camera, HeartHandshake, Layers3, ShieldCheck, SwatchBook } from "lucide-react";

import { completeContributionTutorialAction } from "@/app/actions/contribute";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { requireViewer } from "@/lib/data/users";

export default async function ContributeWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ revisit?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const isRevisit = params?.revisit === "1";

  // If they've already completed it and aren't revisiting, send them straight in.
  if (viewer.profile.contributionTutorialCompletedAt && !isRevisit) {
    redirect("/contribute");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        tone="butter"
        eyebrow="Contribute · Welcome"
        title="Welcome to the kiln circle"
        description="Every photo you share helps another potter avoid a misfire or find their next favourite glaze. Thank you for being here — here's a quick tour before you start."
      />

      {/* ── Slide 1: Why we share ── */}
      <Panel className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background">
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Why we share</p>
        </div>
        <p className="text-sm leading-6 text-foreground/90">
          Glaze testing is slow, expensive, and full of surprises. When you share a result — even a
          messy one — you're saving someone else a wasted firing. The library only works because
          potters like you take a moment to document what came out of the kiln.
        </p>
      </Panel>

      {/* ── Slide 2: What you can share ── */}
      <Panel className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">What you can share</p>
        </div>
        <p className="text-sm leading-6 text-foreground/90">
          One unified form covers everything. You only fill in what's relevant — the form expands
          as you go.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="border border-border bg-background p-4">
            <Camera className="mb-2 h-4 w-4 text-muted" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">A firing photo</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Attach a fired result to a glaze that's already in the library.
            </p>
          </li>
          <li className="border border-border bg-background p-4">
            <Layers3 className="mb-2 h-4 w-4 text-muted" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">A combination</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Pick two or more glazes you layered, in order, and share the result.
            </p>
          </li>
        </ul>
      </Panel>

      {/* ── Slide 3: How to fill it in well ── */}
      <Panel className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background">
            <SwatchBook className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">How to fill it in well</p>
        </div>
        <ul className="grid gap-2 text-sm leading-6 text-foreground/90">
          <li>
            <strong>Sharp, well-lit photos of the fired surface.</strong> Natural light or a lightbox
            beats overhead studio lighting. Include a close-up if you can.
          </li>
          <li>
            <strong>Accurate cone and atmosphere.</strong> A photo without a cone is hard to learn
            from — even an estimate is better than blank.
          </li>
          <li>
            <strong>Name the glazes you actually used.</strong> Search by brand, code, or name. If
            the whole brand is missing, use the "Request a glaze brand" link and we'll add it.
          </li>
          <li>
            <strong>For combinations, get the layer order right</strong> — top layer first. It
            matters more than the notes.
          </li>
        </ul>
      </Panel>

      {/* ── Slide 4: Moderation ── */}
      <Panel className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-border bg-background">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">A gentle heads-up about moderation</p>
        </div>
        <p className="text-sm leading-6 text-foreground/90">
          Every submission gets a quick review to keep the library trustworthy. If a contribution has
          a few too many mistakes — wrong cone, mismatched glazes, blurry photo — we'll let you
          know and apply a strike.
        </p>
        <p className="text-sm leading-6 text-foreground/90">
          <strong>Three strikes</strong> pauses new contributions until we have a chat. It's not a
          punishment — it just means something in the workflow needs a tune-up. We'd rather catch it
          early than have other members work from inaccurate data.
        </p>
      </Panel>

      {/* ── Submit ── */}
      <form action={completeContributionTutorialAction} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <p className="text-sm text-muted">
          That's everything. Share what you've made — someone out there is about to learn from it.
        </p>
        <Button type="submit">{isRevisit ? "Back to contributing" : "I'm ready — let's go"}</Button>
      </form>
    </div>
  );
}
