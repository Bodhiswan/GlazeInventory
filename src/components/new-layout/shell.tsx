"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { PanelHost } from "./panel";
import { useNL } from "./provider";
import { Icon } from "./ui";

const NAV = [
  { href: "/glazes", label: "Glazes", icon: "glaze" as const },
  { href: "/combinations", label: "Combos", icon: "combos" as const },
  { href: "/inventory", label: "My shelf", icon: "shelf" as const },
];

export function ClassicSwitchLink() {
  const pathname = usePathname();
  return (
    <a href={`/layout-switch?to=classic&next=${encodeURIComponent(pathname)}`}>Use the classic site</a>
  );
}

export function Footer() {
  return (
    <footer className="nl-footer">
      <div className="nl-footer-in">
        <span>Glaze Inventory · Cone 6</span>
        <Link href="/guides/glazing-pottery">Glazing guides</Link>
        <Link href="/glazes/request">Request a glaze</Link>
        <span className="nl-spacer" />
        <ClassicSwitchLink />
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, owned } = useNL();
  const viewer = state.viewer;
  return (
    <>
      <header className="nl-topbar">
        <div className="nl-topbar-in">
          <Link className="nl-brand" href="/glazes"><b>Glaze Inventory</b><span className="nl-cone-tag" title="Everything here fires to cone 6 (midfire)">Cone 6</span></Link>
          <nav className="nl-nav" aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.href === "/inventory" && viewer ? <span className="nl-count">{owned.size}</span> : null}
              </Link>
            ))}
          </nav>
          <span className="nl-spacer" />
          <Link className="nl-btn primary" href="/contribute" aria-label="Add a firing result">
            <Icon name="plus" /><span className="nl-add-label">Add result</span>
          </Link>
          {viewer ? (
            <Link className="nl-account" href="/profile" aria-current={pathname === "/profile" ? "page" : undefined}>
              <Icon name="user" /><span className="nl-account-name">{viewer.name}</span>
              {state.unreadMessages ? <span className="nl-dot-badge" aria-label={`${state.unreadMessages} unread messages`}>{state.unreadMessages}</span> : null}
            </Link>
          ) : (
            <Link className="nl-btn quiet" href={`/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`}>Sign in</Link>
          )}
        </div>
      </header>
      <main id="main-content" className="nl-main" tabIndex={-1}>{children}</main>
      <Footer />
      <Suspense fallback={null}><PanelHost /></Suspense>
    </>
  );
}
