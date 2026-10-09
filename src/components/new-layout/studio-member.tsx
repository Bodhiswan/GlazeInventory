"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, Suspense, useContext, useMemo, type ReactNode } from "react";

import { studioVisitorGateAction } from "@/app/actions/studios";
import { SubmitButton } from "./account-client";
import { CombosView } from "./combos-view";
import type { MemberContext } from "./details";
import { GlazesView } from "./glazes-view";
import { PanelHost } from "./panel";
import { useNL } from "./provider";
import { Footer } from "./shell";

const MemberCtx = createContext<MemberContext | null>(null);

function StudioHeader({ slug, name, isOwner, showNav }: { slug: string; name: string; isOwner: boolean; showNav: boolean }) {
  const pathname = usePathname();
  const library = `/studio/${slug}/library`;
  const combos = `/studio/${slug}/combinations`;
  return (
    <header className="nl-topbar nl-studio-top">
      <div className="nl-topbar-in">
        <div className="nl-studio-id"><span className="nl-eyebrow">Studio library</span><b>{name}</b></div>
        {showNav ? (
          <nav className="nl-snav" aria-label="Studio">
            <Link href={library} aria-current={pathname === library || pathname === `/studio/${slug}` ? "page" : undefined}>Glazes</Link>
            <Link href={combos} aria-current={pathname === combos ? "page" : undefined}>Combos</Link>
          </nav>
        ) : null}
        <span className="nl-spacer" />
        {isOwner
          ? <Link className="nl-btn small quiet" href="/profile?tab=studio" title="You're previewing what studio members see">Exit member view</Link>
          : <Link className="nl-btn small quiet" href={`/studio/${slug}/join`}>Create account</Link>}
      </div>
    </header>
  );
}

/** Wraps member pages: studio header, shared-glaze context and the member detail panel. */
export function StudioMember({ slug, name, glazeIds, isOwner, children }: {
  slug: string; name: string; glazeIds: string[]; isOwner: boolean; children: ReactNode;
}) {
  const { catalog } = useNL();
  const member = useMemo<MemberContext>(() => {
    const ids = new Set(glazeIds);
    // Same rule as the classic studio page: combos whose layers are all shared.
    const comboIds = new Set((catalog?.combos ?? []).filter((combo) => combo.layers.every((layer) => ids.has(layer.g))).map((combo) => combo.id));
    return { slug, glazeIds: ids, comboIds };
  }, [catalog, glazeIds, slug]);
  return (
    <MemberCtx.Provider value={member}>
      <StudioHeader slug={slug} name={name} isOwner={isOwner} showNav />
      <main id="main-content" className="nl-main" tabIndex={-1}>{children}</main>
      <Footer />
      <Suspense fallback={null}><PanelHost member={member} /></Suspense>
    </MemberCtx.Provider>
  );
}

function useMember() {
  const member = useContext(MemberCtx);
  if (!member) throw new Error("Studio member pages need <StudioMember>");
  return member;
}

export function MemberGlazes() {
  const member = useMember();
  return <GlazesView initialGlazes={[]} member={member} />;
}

export function MemberCombos() {
  const member = useMember();
  return <CombosView potterCombos={[]} member={member} />;
}

function JoinPrompt() {
  return (
    <div className="nl-join">
      <p><b>Track your own glazes.</b> <span className="nl-muted">Members can browse without an account. A free account lets you keep a shelf, post firing results and find combos you can make.</span></p>
      <Link className="nl-btn" href="/auth/sign-up">Create a free account</Link>
    </div>
  );
}
export { JoinPrompt };

function GateError() {
  const error = useSearchParams().get("error");
  return error ? <p className="nl-error" role="alert">{error === "Wrong passcode" ? "That passcode doesn't match. Check it with your studio." : error}</p> : null;
}

/** First name and passcode, then the visitor gets a session cookie for this studio. */
export function StudioGate({ slug, name }: { slug: string; name: string }) {
  return (
    <>
      <StudioHeader slug={slug} name={name} isOwner={false} showNav={false} />
      <main id="main-content" className="nl-main" tabIndex={-1}>
        <div className="nl-gate">
          <div>
            <div className="nl-eyebrow">Studio library</div>
            <h1>{name}</h1>
            <p className="nl-muted">Enter your first name and the studio&apos;s 4-digit passcode to see the shared glaze library.</p>
          </div>
          <form action={studioVisitorGateAction}>
            <input type="hidden" name="slug" value={slug} />
            <div className="nl-field"><label htmlFor="gate-name">First name</label>
              <input id="gate-name" name="name" className="nl-input" required maxLength={80} autoComplete="given-name" /></div>
            <div className="nl-field"><label htmlFor="gate-code">Studio passcode</label>
              <input id="gate-code" name="passcode" className="nl-input code-input" required inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" placeholder="••••" /></div>
            <span className="nl-fact" style={{ justifySelf: "start" }}>Cone 6 glazes only</span>
            <Suspense fallback={null}><GateError /></Suspense>
            <SubmitButton pendingText="Checking…" className="nl-btn primary">Enter studio library</SubmitButton>
          </form>
          <p className="nl-note">No passcode? Ask your studio.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
