import Link from "next/link";

import { updateProfilePreferencesAction } from "@/app/actions/profile";
import { ChatsTab } from "./chats-tab";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { getUserPointsRank } from "@/lib/data/admin";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";

const coneOptions = ["Cone 06", "Cone 6", "Cone 10"];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; tab?: string; with?: string }>;
}) {
  const viewer = await requireViewer();
  const rank = (viewer.profile.points ?? 0) > 0
    ? await getUserPointsRank(viewer.profile.id)
    : 0;
  const query = await searchParams;
  const saved = formatSearchQuery(query.saved);
  const error = formatSearchQuery(query.error);
  const activeTab = query.tab === "chats" ? "chats" : "profile";
  const activeWith = formatSearchQuery(query.with);

  return (
    <div className="space-y-8">
      {saved ? (
        <FormBanner variant="success">Profile preferences saved.</FormBanner>
      ) : null}

      {error ? (
        <FormBanner variant="error">{decodeURIComponent(error)}</FormBanner>
      ) : null}

      {/* ── Tabs ── */}
      <nav className="flex items-center gap-1 border-b border-border">
        <Link
          href="/profile"
          className={`border-b-2 px-4 py-2 text-[11px] uppercase tracking-[0.16em] ${
            activeTab === "profile"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Profile
        </Link>
        <Link
          href="/profile?tab=chats"
          className={`border-b-2 px-4 py-2 text-[11px] uppercase tracking-[0.16em] ${
            activeTab === "chats"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Chats
        </Link>
      </nav>

      {activeTab === "chats" ? (
        <ChatsTab viewerUserId={viewer.profile.id} activeOtherId={activeWith || undefined} viewerIsAdmin={viewer.profile.isAdmin === true} />
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
              </div>

              <label className="flex items-start gap-3 border border-border bg-panel px-4 py-4 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="restrictToPreferredExamples"
                  defaultChecked={Boolean(viewer.profile.restrictToPreferredExamples)}
                  className="mt-1 h-4 w-4 rounded border-border accent-[#2d1c16]"
                />
                <span className="leading-6">
                  Only show glazes that have example images matching my preferred cone.
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
              If you choose a preferred cone, the library will try to show that
              image first whenever the vendor provides it. On individual glaze pages, the matching
              firing references will be shown first as well.
            </p>
            <p className="text-sm leading-6 text-muted">
              Turning on the restriction option makes the main library view narrower: it only keeps
              glazes that already have a matching example image for your preferred cone.
            </p>
            <div className="border border-border bg-panel p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Current defaults</p>
              <div className="mt-3 space-y-2 text-sm text-muted">
                <p>Cone: {viewer.profile.preferredCone ?? "Any cone"}</p>
                <p>
                  Restrict to matching examples:{" "}
                  {viewer.profile.restrictToPreferredExamples ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {(viewer.profile.points ?? 0) > 0 ? (
              <div className="border border-border bg-panel p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Contribution points</p>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    {(viewer.profile.points ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-muted">pts</span>
                </div>
                {rank > 0 ? (
                  <p className="mt-1 text-sm text-muted">#{rank} globally</p>
                ) : null}
              </div>
            ) : null}

            {viewer.profile.contributionsDisabled ? (
              <div className="border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  Your contribution access has been disabled after repeated policy violations. Contact support if you believe this is an error.
                </p>
              </div>
            ) : null}
          </Panel>
        </div>
      )}
    </div>
  );
}
