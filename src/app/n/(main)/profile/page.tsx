/* eslint-disable @next/next/no-img-element -- the QR image comes from an external generator, as on the classic site */
import type { Metadata } from "next";
import Link from "next/link";

import { ChatsTab } from "@/app/(app)/profile/chats-tab";
import { signOutAction, updatePasswordAction } from "@/app/actions/auth";
import { updateProfilePreferencesAction } from "@/app/actions/profile";
import { createOrUpdateStudioAction, deleteStudioAction } from "@/app/actions/studios";
import { ConfirmDelete, CopyLink, SharedGlazes, SubmitButton } from "@/components/new-layout/account-client";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { getOwnerInventoryShareList, getStudioForOwner } from "@/lib/data/studios";
import { requireViewer } from "@/lib/data/users";
import { STUDIO_FIRING_LABELS } from "@/lib/studio-firing";
import { formatGlazeLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

type Tab = "profile" | "chats" | "studio";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string; with?: string; saved?: string; error?: string }> }) {
  const viewer = await requireViewer();
  const query = await searchParams;
  const tab: Tab = query.tab === "chats" ? "chats" : query.tab === "studio" ? "studio" : "profile";
  const tabs: [Tab, string][] = [["profile", "Profile"], ["chats", "Messages"], ["studio", "Studio mode"]];

  return (
    <div className="nl-account-grid">
      <div className="nl-page-head"><div><h1>Account</h1><p>Your details, messages and studio page.</p></div></div>
      <nav className="nl-seg nl-tabs" aria-label="Account sections">
        {tabs.map(([key, text]) => (
          <Link key={key} href={key === "profile" ? "/profile" : `/profile?tab=${key}`} className="nl-btn quiet small" aria-current={tab === key ? "page" : undefined}
            style={tab === key ? { background: "var(--nl-surface)", color: "var(--nl-ink)" } : undefined}>{text}</Link>
        ))}
      </nav>
      {query.saved ? <p className="nl-banner" role="status">{tab === "studio" ? "Studio settings saved." : "Saved."}</p> : null}
      {query.error ? <p className="nl-banner warn" role="alert">{query.error}</p> : null}

      {tab === "chats" ? (
        <SectionErrorBoundary>
          <ChatsTab viewerUserId={viewer.profile.id} activeOtherId={query.with || undefined} viewerIsAdmin={viewer.profile.isAdmin === true} />
        </SectionErrorBoundary>
      ) : tab === "studio" ? (
        <SectionErrorBoundary>
          <StudioSettings ownerId={viewer.profile.id} defaultName={viewer.profile.studioName ?? ""} />
        </SectionErrorBoundary>
      ) : (
        <>
          <form action={updateProfilePreferencesAction} className="nl-box">
            <h2>Profile</h2>
            <div className="nl-field"><label htmlFor="displayName">Display name</label>
              <input id="displayName" name="displayName" className="nl-input" defaultValue={viewer.profile.displayName} required minLength={2} maxLength={40} /></div>
            <div className="nl-field"><label htmlFor="location">Location <span className="nl-muted">(optional)</span></label>
              <input id="location" name="location" className="nl-input" defaultValue={viewer.profile.location ?? ""} maxLength={80} /></div>
            {/* Classic-site preferences aren't shown here; send them back unchanged so saving doesn't clear them. */}
            <input type="hidden" name="preferredCone" value={viewer.profile.preferredCone ?? ""} />
            <input type="hidden" name="preferredAtmosphere" value={viewer.profile.preferredAtmosphere ?? ""} />
            {viewer.profile.restrictToPreferredExamples ? <input type="hidden" name="restrictToPreferredExamples" value="on" /> : null}
            <div className="nl-actions"><SubmitButton pendingText="Saving…" className="nl-btn primary">Save profile</SubmitButton></div>
          </form>

          <form action={updatePasswordAction} className="nl-box">
            <h2>Change password</h2>
            <div className="nl-field"><label htmlFor="password">New password</label>
              <input id="password" name="password" type="password" className="nl-input" autoComplete="new-password" required minLength={8} maxLength={72} /></div>
            <div className="nl-field"><label htmlFor="confirmPassword">Confirm new password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" className="nl-input" autoComplete="new-password" required minLength={8} maxLength={72} /></div>
            <p className="nl-note">You&apos;ll be asked to sign in again with the new password.</p>
            <div className="nl-actions"><SubmitButton pendingText="Saving…">Change password</SubmitButton></div>
          </form>

          <div className="nl-box">
            <h2>Sign out</h2>
            <p className="nl-note">Signed in as {viewer.profile.email ?? viewer.profile.displayName}.</p>
            <form action={signOutAction}><SubmitButton pendingText="Signing out…">Sign out</SubmitButton></form>
          </div>
        </>
      )}
    </div>
  );
}

async function StudioSettings({ ownerId, defaultName }: { ownerId: string; defaultName: string }) {
  const [studio, inventory] = await Promise.all([getStudioForOwner(ownerId), getOwnerInventoryShareList(ownerId)]);
  const rows = inventory.map((row) => ({ inventoryId: row.inventoryId, name: row.glaze.name, label: formatGlazeLabel(row.glaze), shared: row.shared }));

  if (!studio) {
    return (
      <form action={createOrUpdateStudioAction} className="nl-box">
        <h2>Share your glazes with your studio</h2>
        <p className="nl-desc nl-muted">Members open a link, enter a 4-digit passcode, and see the Cone 6 glazes you share plus every vendor combo they can make with them. Your notes and wishlist stay private.</p>
        <div className="nl-field"><label htmlFor="studioName">Studio name</label>
          <input id="studioName" name="studioName" className="nl-input" required maxLength={80} defaultValue={defaultName} placeholder="e.g. Muddy Hands Ceramics" />
          <span className="nl-note">Your link is made from the name: 3–16 letters or numbers.</span></div>
        <div className="nl-field"><label htmlFor="passcode">4-digit passcode</label>
          <input id="passcode" name="passcode" className="nl-input" required inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="1234" style={{ maxWidth: 160 }} /></div>
        <input type="hidden" name="firingRange" value="midfire" />
        <div className="nl-actions"><SubmitButton pendingText="Creating…" className="nl-btn primary">Create studio page</SubmitButton></div>
        <p className="nl-note">After creating it, choose which glazes on your shelf to share.</p>
      </form>
    );
  }

  const url = `glazeinventory.com/studio/${studio.slug}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(`https://${url}`)}`;
  return (
    <>
      <div className="nl-box">
        <div className="nl-box-head"><div><div className="nl-eyebrow">Your studio page</div><h2>{studio.displayName}</h2></div>
          <Link className="nl-btn primary" href={`/studio/${studio.slug}`}>Open member view</Link></div>
        <span className="lab">Link for members</span>
        <CopyLink url={url} />
        <div className="nl-qr"><img src={qr} alt={`QR code for https://${url}`} width={180} height={180} />
          <span className="nl-note">Print this for the studio table so members can scan instead of typing. <a href={qr} download={`${studio.slug}-studio-qr.png`}>Download</a></span></div>
      </div>

      <div className="nl-box">
        <span className="lab">Passcode</span>
        <div className="nl-passcode" aria-label={`Passcode ${studio.passcode.split("").join(" ")}`}>{studio.passcode || "————"}</div>
        <form action={createOrUpdateStudioAction} className="nl-inline-form">
          <label className="nl-sr" htmlFor="newPasscode">New passcode</label>
          <input id="newPasscode" name="passcode" className="nl-input" required inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="New 4-digit passcode" />
          <SubmitButton pendingText="Saving…">Change</SubmitButton>
        </form>
        <p className="nl-note">Members using the old passcode will need the new one.</p>
      </div>

      <div className="nl-box">
        <div className="nl-box-head"><span className="lab">Shared glazes</span><span className="nl-note">Only glazes you own can be shared.</span></div>
        {rows.length ? <SharedGlazes rows={rows} /> : <p className="nl-note">Your shelf is empty. Add glazes you own, then share them here.</p>}
      </div>

      {studio.firingRange !== "midfire" ? (
        <form action={createOrUpdateStudioAction} className="nl-box">
          <span className="lab">Firing range</span>
          <p className="nl-note">Your studio page is set to {STUDIO_FIRING_LABELS[studio.firingRange].toLowerCase()}, so members see the classic studio page with its cone switcher.</p>
          <select name="firingRange" className="nl-select" defaultValue={studio.firingRange} aria-label="Firing range">
            <option value="midfire">Midfire only (cone 6)</option>
            <option value="lowfire">Earthenware only (cone 06)</option>
            <option value="both">Both cone 06 and cone 6</option>
          </select>
          <div className="nl-actions"><SubmitButton pendingText="Saving…">Update firing range</SubmitButton></div>
        </form>
      ) : null}

      <form action={createOrUpdateStudioAction} className="nl-box">
        <span className="lab">Studio name</span>
        <div className="nl-inline-form">
          <label className="nl-sr" htmlFor="rename">Studio name</label>
          <input id="rename" name="studioName" className="nl-input" required maxLength={80} defaultValue={studio.displayName} disabled={studio.renameCount >= 3} />
          <SubmitButton pendingText="Saving…">Rename</SubmitButton>
        </div>
        <p className="nl-note">Renaming changes the link and QR code. Renames used: {studio.renameCount} of 3.</p>
      </form>

      <div className="nl-box"><ConfirmDelete action={deleteStudioAction} studioName={studio.displayName} /></div>
    </>
  );
}
