import Link from "next/link";

import { beginAccountCreationAction, signOutAction, updateProfilePreferencesAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { requireViewer } from "@/lib/data";
import { formatSearchQuery } from "@/lib/utils";

const coneOptions = ["Cone 06", "Cone 6", "Cone 10"];
const atmosphereOptions = ["Oxidation", "Reduction"];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const viewer = await requireViewer();
  const query = await searchParams;
  const saved = formatSearchQuery(query.saved);
  const error = formatSearchQuery(query.error);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Profile"
        title="Profile and viewing defaults"
        description="Manage your basic profile details and choose which glaze example images the library should prefer by default."
        actions={
          <>
            <Link href="/glazes" className={buttonVariants({ variant: "ghost" })}>
              Back to library
            </Link>
            {!viewer.profile.isAnonymous ? (
              <form action={signOutAction}>
                <button type="submit" className={buttonVariants({ variant: "ghost" })}>
                  Sign out
                </button>
              </form>
            ) : null}
          </>
        }
      />

      {saved ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Profile preferences saved.
        </div>
      ) : null}

      {error ? (
        <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      {viewer.profile.isAnonymous ? (
        <Panel className="space-y-4 opacity-80">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Guest mode</p>
          <h2 className="display-font text-3xl tracking-tight">Profile settings need a verified account.</h2>
          <p className="text-sm leading-6 text-muted">
            Guest browsing is great for exploring the glaze inventory, but saved viewing defaults live
            on your member profile so they can follow you every time you sign in.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={beginAccountCreationAction}>
              <button type="submit" className={buttonVariants({})}>
                Create account
              </button>
            </form>
            <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel>
            <form action={updateProfilePreferencesAction} className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium md:col-span-2">
                  Display name
                  <Input name="displayName" defaultValue={viewer.profile.displayName} required />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Studio name
                  <Input name="studioName" defaultValue={viewer.profile.studioName ?? ""} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Location
                  <Input name="location" defaultValue={viewer.profile.location ?? ""} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Default cone image view
                  <Select name="preferredCone" defaultValue={viewer.profile.preferredCone ?? ""}>
                    <option value="">Any cone</option>
                    {coneOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Default atmosphere view
                  <Select
                    name="preferredAtmosphere"
                    defaultValue={viewer.profile.preferredAtmosphere ?? ""}
                  >
                    <option value="">Any atmosphere</option>
                    {atmosphereOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <label className="flex items-start gap-3 border border-border bg-panel px-4 py-4 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="restrictToPreferredExamples"
                  defaultChecked={Boolean(viewer.profile.restrictToPreferredExamples)}
                  className="mt-1 h-4 w-4 rounded border-border accent-[#2d1c16]"
                />
                <span className="leading-6">
                  Only show glazes that have example images matching my preferred cone and atmosphere.
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
                <Link href="/glazes" className={buttonVariants({ variant: "ghost" })}>
                  Cancel
                </Link>
              </div>
            </form>
          </Panel>

          <Panel className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">How defaults work</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Shape the glaze views around your firing context.</h2>
            </div>
            <p className="text-sm leading-6 text-muted">
              If you choose a preferred cone or atmosphere, the library will try to show that
              image first whenever the vendor provides it. On individual glaze pages, the matching
              firing references will be shown first as well.
            </p>
            <p className="text-sm leading-6 text-muted">
              Turning on the restriction option makes the main library view narrower: it only keeps
              glazes that already have a matching example image for your preferred cone and
              atmosphere settings.
            </p>
            <div className="border border-border bg-panel p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Current defaults</p>
              <div className="mt-3 space-y-2 text-sm text-muted">
                <p>Cone: {viewer.profile.preferredCone ?? "Any cone"}</p>
                <p>Atmosphere: {viewer.profile.preferredAtmosphere ?? "Any atmosphere"}</p>
                <p>
                  Restrict to matching examples:{" "}
                  {viewer.profile.restrictToPreferredExamples ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
