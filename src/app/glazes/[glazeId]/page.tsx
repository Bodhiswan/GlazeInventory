import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { Heart } from "lucide-react";

import { toggleGlazeFavouriteAction } from "@/app/actions/glazes";
import { GlazeImageGallery } from "@/components/glaze-image-gallery";
import { PageHeader } from "@/components/page-header";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Panel } from "@/components/ui/panel";
import { getGlazeStaticDetail, resolveGlazeById } from "@/lib/data/glazes";
import { getCatalogFiringImages } from "@/lib/catalog";
import { getViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGlazeFamilyTraits, getManufacturerUrl } from "@/lib/glaze-metadata";
import {
  formatGlazeLabel,
  formatGlazeMeta,
  getGlazeSkimDescription,
  pickPreferredGlazeImage,
  summarizeGlazeColor,
  summarizeGlazeFinish,
} from "@/lib/utils";
import coyoteLocalGallery from "../../../../data/vendors/coyote-local-gallery.json";
import { GlazeUserStateServer } from "./_components/glaze-user-state-server";
import { GlazeUserStateSkeleton } from "./_components/glaze-user-state-skeleton";
import { GlazeSignUpCta } from "./_components/glaze-sign-up-cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ glazeId: string }>;
}): Promise<Metadata> {
  const { glazeId } = await params;
  const glaze = await resolveGlazeById(glazeId);

  if (!glaze) {
    return { title: "Glaze not found" };
  }

  const label = formatGlazeLabel(glaze);
  const color = summarizeGlazeColor(glaze);
  const finish = summarizeGlazeFinish(glaze);
  const traits = [glaze.cone, glaze.atmosphere, finish, color]
    .filter(Boolean)
    .join(" · ");
  const description = traits
    ? `${label} — ${traits}. See firing images, community results, and application notes.`
    : `${label} — See firing images, community results, and application notes.`;

  return {
    title: label,
    description,
    alternates: {
      canonical: `/glazes/${glazeId}`,
    },
    openGraph: {
      title: label,
      description,
      ...(glaze.imageUrl ? { images: [{ url: glaze.imageUrl }] } : {}),
    },
  };
}

// ─── Structured data (JSON-LD) ──────────────────────────────────────────────

function GlazeJsonLd({ glaze }: { glaze: Parameters<typeof formatGlazeLabel>[0] & { imageUrl?: string | null; description?: string | null; brand?: string | null } }) {
  const label = formatGlazeLabel(glaze);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: label,
    description: glaze.description ?? `${label} ceramic glaze`,
    ...(glaze.brand ? { brand: { "@type": "Brand", name: glaze.brand } } : {}),
    ...(glaze.imageUrl ? { image: glaze.imageUrl } : {}),
    category: "Ceramic Glaze",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function GlazeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ glazeId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const viewer = await getViewer();
  const { glazeId } = await params;
  const pageParams = await searchParams;

  // Try the bundled static catalog first, then fall back to Supabase so
  // community-contributed custom glazes resolve to a full detail page too.
  let detail = getGlazeStaticDetail(glazeId);
  if (!detail) {
    const fallback = await resolveGlazeById(glazeId);
    if (!fallback) {
      notFound();
    }
    detail = { glaze: fallback, firingImages: getCatalogFiringImages(glazeId) };
  }

  const { glaze } = detail;
  const isGuest = !viewer;

  // Track glaze view after the response is sent (logged-in users only).
  if (viewer) {
    after(async () => {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return;
      await supabase.from("analytics_events").insert({
        event_type: "glaze_view",
        user_id: viewer.profile.id,
        glaze_id: null,
        metadata: {
          catalog_glaze_id: glaze.id,
          glaze_name: glaze.name,
          glaze_brand: glaze.brand ?? null,
        },
      });
    });
  }

  const coyoteGalleryImages =
    glaze.brand === "Coyote" && glaze.code
      ? (coyoteLocalGallery[glaze.code as keyof typeof coyoteLocalGallery] ?? []).map((image) => ({
          id: image.id,
          label: image.label,
          cone: image.cone,
          atmosphere: image.atmosphere,
          imageUrl: image.imageUrl,
        }))
      : [];
  const galleryImages = coyoteGalleryImages.length ? coyoteGalleryImages : detail.firingImages;
  const familyTraits = getGlazeFamilyTraits(glaze);
  const skim = getGlazeSkimDescription(glaze);
  const error = pageParams.error;
  const saved = pageParams.saved;
  const heroImage =
    pickPreferredGlazeImage(
      glaze,
      galleryImages,
      viewer?.profile.preferredCone ?? null,
      viewer?.profile.preferredAtmosphere ?? null,
    ) ?? glaze.imageUrl;

  const viewerHasFavourited = false;

  return (
    <div className="space-y-8">
      <GlazeJsonLd glaze={glaze} />

      <PageHeader
        eyebrow="Glaze"
        title={formatGlazeLabel(glaze)}
        description="See the official glaze details, available firing reference images, and studio comments for this glaze."
        actions={
          <>
            <Link href="/glazes" className={buttonVariants({ variant: "ghost" })}>
              Back to library
            </Link>
            {glaze.brand && getManufacturerUrl(glaze.brand) ? (
              <a
                href={getManufacturerUrl(glaze.brand)!}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "ghost" })}
              >
                {glaze.brand} website
              </a>
            ) : null}
            {glaze.code ? (
              <Link
                href={`/combinations?q=${encodeURIComponent(glaze.code)}`}
                className={buttonVariants({ variant: "ghost" })}
              >
                Combinations
              </Link>
            ) : null}
            {isGuest ? null : (
              <form action={toggleGlazeFavouriteAction}>
                <input type="hidden" name="glazeId" value={glaze.id} />
                <input type="hidden" name="returnTo" value={`/glazes/${glaze.id}`} />
                <button
                  type="submit"
                  className={buttonVariants({ variant: viewerHasFavourited ? "primary" : "ghost", className: "gap-2" })}
                >
                  <Heart className={`h-4 w-4 ${viewerHasFavourited ? "fill-current" : ""}`} />
                  {viewerHasFavourited ? "Favourited" : "Favourite"}
                </button>
              </form>
            )}
          </>
        }
      />

      {error ? (
        <FormBanner variant="error">{decodeURIComponent(error)}</FormBanner>
      ) : null}
      {saved === "description" ? (
        <FormBanner variant="success">Description summary updated.</FormBanner>
      ) : null}
      {saved === "shelf" ? (
        <FormBanner variant="success">Amount left updated.</FormBanner>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          {heroImage ? (
            <GlazeImageGallery
              baseImageUrl={glaze.imageUrl ?? heroImage}
              baseImageAlt={formatGlazeLabel(glaze)}
              firingImages={galleryImages}
              initialImageUrl={heroImage}
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Badge tone={glaze.sourceType === "commercial" ? "neutral" : "accent"}>
              {glaze.sourceType === "commercial" ? "Commercial glaze" : "Custom glaze"}
            </Badge>
            {glaze.cone ? <Badge tone="neutral">{glaze.cone}</Badge> : null}
            {familyTraits.map((family) => (
              <Badge key={`${glaze.id}-${family}`} tone="accent">
                {family}
              </Badge>
            ))}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">{formatGlazeMeta(glaze)}</p>
            {familyTraits.length ? (
              <p className="mt-3 text-sm leading-6 text-muted">
                <span className="font-semibold text-foreground">Comparable family:</span>{" "}
                {familyTraits.join(" · ")}
              </p>
            ) : null}
            <Panel className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Skim read</p>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-muted">
                <p><span className="font-semibold text-foreground">Overview:</span> {skim.summary}</p>
                <p><span className="font-semibold text-foreground">Surface:</span> {skim.surface}</p>
                {skim.application ? (
                  <p><span className="font-semibold text-foreground">Application:</span> {skim.application}</p>
                ) : null}
                <p><span className="font-semibold text-foreground">Firing:</span> {skim.firing}</p>
              </div>
            </Panel>
            {glaze.description ? (
              <details className="mt-4 border border-border bg-panel px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                  Official vendor description
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted">{glaze.description}</p>
              </details>
            ) : null}
            {glaze.finishNotes ? (
              <p className="mt-3 text-sm leading-6 text-muted">Finish: {glaze.finishNotes}</p>
            ) : null}
            {glaze.colorNotes ? (
              <p className="mt-2 text-sm leading-6 text-muted">Color: {glaze.colorNotes}</p>
            ) : null}
          </div>
        </Panel>

      </section>

      {isGuest ? (
        <GlazeSignUpCta glazeName={formatGlazeLabel(glaze)} />
      ) : (
        <SectionErrorBoundary>
          <Suspense fallback={<GlazeUserStateSkeleton />}>
            <GlazeUserStateServer
              viewerId={viewer.profile.id}
              glazeId={glaze.id}
              glazeSourceType={glaze.sourceType}
            />
          </Suspense>
        </SectionErrorBoundary>
      )}
    </div>
  );
}
