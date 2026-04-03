import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Star } from "lucide-react";

import {
  addGlazeCommentAction,
  setGlazeRatingAction,
  updateGlazeDescriptionAction,
} from "@/app/actions";
import { GlazeImageGallery } from "@/components/glaze-image-gallery";
import { GlazeOwnershipPanel } from "@/components/glaze-ownership-panel";
import { GuestGateCallout } from "@/components/guest-gate-callout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { getGlazeDetail, getInventoryFolders, requireViewer } from "@/lib/data";
import {
  formatGlazeLabel,
  formatGlazeMeta,
  getGlazeFamilyTraits,
  getGlazeSkimDescription,
  pickPreferredGlazeImage,
} from "@/lib/utils";
import coyoteLocalGallery from "../../../../../data/vendors/coyote-local-gallery.json";

export default async function GlazeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ glazeId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const viewer = await requireViewer();
  const { glazeId } = await params;
  const pageParams = await searchParams;
  const [detail, folders] = await Promise.all([
    getGlazeDetail(viewer.profile.id, glazeId),
    getInventoryFolders(viewer.profile.id),
  ]);

  if (!detail) {
    notFound();
  }

  const { glaze } = detail;
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
  const averageRatingLabel =
    detail.rating.averageRating === null ? "No ratings yet" : `${detail.rating.averageRating.toFixed(1)} / 5`;
  const heroImage =
    pickPreferredGlazeImage(
      glaze,
      galleryImages,
      viewer.profile.preferredCone ?? null,
      viewer.profile.preferredAtmosphere ?? null,
    ) ?? glaze.imageUrl;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Glaze"
        title={formatGlazeLabel(glaze)}
        description="See the official glaze details, available firing reference images, and studio comments for this glaze."
        actions={
          <>
            <Link href="/glazes" className={buttonVariants({ variant: "ghost" })}>
              Back to library
            </Link>
            {viewer.profile.isAnonymous ? (
              <Link href={`/auth/sign-up?redirectTo=${encodeURIComponent(`/glazes/${glazeId}`)}`} className={buttonVariants({})}>
                Sign up to save glazes
              </Link>
            ) : (
              <Link href="/inventory" className={buttonVariants({})}>
                View inventory
              </Link>
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
            <div className="mt-4 border border-border bg-panel p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Skim read</p>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-muted">
                <p><span className="font-semibold text-foreground">Overview:</span> {skim.summary}</p>
                <p><span className="font-semibold text-foreground">Surface:</span> {skim.surface}</p>
                {skim.application ? (
                  <p><span className="font-semibold text-foreground">Application:</span> {skim.application}</p>
                ) : null}
                <p><span className="font-semibold text-foreground">Firing:</span> {skim.firing}</p>
              </div>

            </div>
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

          {glaze.sourceType === "commercial" ? (
            viewer.profile.isAnonymous ? (
              <GuestGateCallout
                feature="Create an account to save this glaze to your shelf, wishlist, or folders."
                redirectTo={`/glazes/${glaze.id}`}
              />
            ) : (
              <GlazeOwnershipPanel
                glazeId={glaze.id}
                initialStatus={detail.viewerInventoryItem?.status ?? null}
                initialFillLevel={detail.viewerInventoryItem?.fillLevel ?? "full"}
                initialQuantity={detail.viewerInventoryItem?.quantity ?? 1}
                initialInventoryId={detail.viewerInventoryItem?.id ?? null}
                initialFolderIds={detail.viewerInventoryItem?.folderIds ?? []}
                folders={folders}
              />
            )
          ) : null}
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">Community rating</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">{averageRatingLabel}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {detail.rating.ratingCount
                  ? `${detail.rating.ratingCount} ratings from members.`
                  : "No one has rated this glaze yet."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 5 }, (_, index) => {
                const ratingValue = index + 1;
                const filled = detail.rating.averageRating !== null && ratingValue <= Math.round(detail.rating.averageRating);

                return (
                  <Star
                    key={`average-${ratingValue}`}
                    className={`h-5 w-5 ${filled ? "fill-foreground text-foreground" : "text-border"}`}
                  />
                );
              })}
            </div>

            {viewer.profile.isAnonymous ? (
              <GuestGateCallout
                feature="Sign up to rate this glaze and help other potters find the best options."
                redirectTo={`/glazes/${glaze.id}`}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Your rating: {detail.rating.viewerRating ? `${detail.rating.viewerRating} / 5` : "Not rated yet"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }, (_, index) => {
                    const ratingValue = index + 1;
                    const isActive = detail.rating.viewerRating !== null && ratingValue <= detail.rating.viewerRating;

                    return (
                      <form key={`rate-${ratingValue}`} action={setGlazeRatingAction}>
                        <input type="hidden" name="glazeId" value={glaze.id} />
                        <input type="hidden" name="rating" value={ratingValue} />
                        <input type="hidden" name="returnTo" value={`/glazes/${glaze.id}`} />
                        <button
                          type="submit"
                          className={buttonVariants({
                            variant: isActive ? "primary" : "ghost",
                            size: "sm",
                            className: "gap-2",
                          })}
                        >
                          <Star className={`h-4 w-4 ${isActive ? "fill-current" : ""}`} />
                          {ratingValue}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>

        </div>
      </section>

      {viewer.profile.isAdmin ? (
        <Panel className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Description editor</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">Write the skim-readable version.</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Keep this tight and consistent so future glaze pages are faster to scan. Focus on what the glaze looks like, how it behaves, and what firing context matters most.
            </p>
          </div>

          <form action={updateGlazeDescriptionAction} className="grid gap-4">
            <input type="hidden" name="glazeId" value={glaze.id} />
            <input type="hidden" name="returnTo" value={`/glazes/${glaze.id}`} />
            <label className="grid gap-2 text-sm font-medium">
              Overview
              <Textarea
                name="editorialSummary"
                defaultValue={glaze.editorialSummary ?? ""}
                className="min-h-24"
                placeholder="One short paragraph. What is this glaze and why would a potter reach for it?"
              />
            </label>
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                Surface
                <Textarea
                  name="editorialSurface"
                  defaultValue={glaze.editorialSurface ?? ""}
                  className="min-h-24"
                  placeholder="Glossy blue-purple surface with subtle movement and darker pooling."
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Application
                <Textarea
                  name="editorialApplication"
                  defaultValue={glaze.editorialApplication ?? ""}
                  className="min-h-24"
                  placeholder="Looks strongest with 3 coats. Watch for movement on vertical forms."
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Firing
                <Textarea
                  name="editorialFiring"
                  defaultValue={glaze.editorialFiring ?? ""}
                  className="min-h-24"
                  placeholder="Most often referenced at cone 6 oxidation. Cone 10 results may differ."
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={buttonVariants({})}>
                Save description summary
              </button>
              <Link href="/glazes?review=descriptions" className={buttonVariants({ variant: "ghost" })}>
                Back to review queue
              </Link>
            </div>
          </form>
        </Panel>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Comments</p>
          <h2 className="display-font mt-2 text-3xl tracking-tight">Studio notes under this glaze</h2>
        </div>

        <Panel className="space-y-4">
          {viewer.profile.isAnonymous ? (
            <GuestGateCallout
              feature="Create an account to leave notes about application, clay body, or firing results."
              redirectTo={`/glazes/${glaze.id}`}
            />
          ) : (
            <form action={addGlazeCommentAction} className="space-y-4">
              <input type="hidden" name="glazeId" value={glaze.id} />
              <input type="hidden" name="returnTo" value={`/glazes/${glaze.id}`} />
              <Textarea
                name="body"
                placeholder="Add a useful note about application, clay body, fit, layering, or firing results."
                required
              />
              <div className="flex justify-end">
                <button type="submit" className={buttonVariants({ size: "sm" })}>
                  Post comment
                </button>
              </div>
            </form>
          )}
        </Panel>

        {detail.comments.length ? (
          <div className="space-y-3">
            {detail.comments.map((comment) => (
              <Panel key={comment.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{comment.authorName}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                    {format(new Date(comment.createdAt), "d MMM yyyy")}
                  </p>
                </div>
                <p className="text-sm leading-6 text-muted">{comment.body}</p>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel>
            <p className="text-sm leading-6 text-muted">
              No comments yet. Start the page with the first note about how this glaze behaves.
            </p>
          </Panel>
        )}
      </section>
    </div>
  );
}
