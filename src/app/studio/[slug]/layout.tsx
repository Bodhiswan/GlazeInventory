import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { getStudioBySlug } from "@/lib/data/studios";
import { getViewer } from "@/lib/data/users";
import { isVisitorCookieValid, visitorCookieName, visitorScopeCookieName } from "@/lib/studio-auth";
import { StudioGate } from "./_gate";
import { StudioScopeSwitcher } from "./_scope-switcher";

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();

  const viewer = await getViewer();
  const isOwner = viewer?.profile.id === studio.ownerUserId;

  const cookieStore = await cookies();
  const cookie = cookieStore.get(visitorCookieName(studio.slug))?.value;
  const passed = isOwner || isVisitorCookieValid(studio.id, cookie);

  if (!passed) {
    return (
      <div className="min-h-screen bg-background">
        <StudioGate
          slug={studio.slug}
          displayName={studio.displayName}
          firingRange={studio.firingRange}
        />
      </div>
    );
  }

  const scopeRaw = cookieStore.get(visitorScopeCookieName(studio.slug))?.value;
  const currentScope: "lowfire" | "midfire" =
    scopeRaw === "lowfire" || scopeRaw === "midfire"
      ? scopeRaw
      : studio.firingRange === "midfire"
        ? "midfire"
        : "lowfire";

  const tabs = [
    { href: `/studio/${studio.slug}/library`, label: "Library" },
    { href: `/studio/${studio.slug}/combinations`, label: "Combinations" },
    { href: `/studio/${studio.slug}/join`, label: "Create account" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:px-6">
        <header className="sticky top-0 z-30 -mx-3 border-b border-border bg-background/95 px-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="display-font border border-border bg-panel px-3 py-2 text-lg leading-none tracking-tight sm:text-xl"
              >
                G.I.
              </Link>
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Studio library</p>
                <p className="display-font text-lg tracking-tight">{studio.displayName}</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-1">
              {studio.firingRange === "both" ? (
                <StudioScopeSwitcher slug={studio.slug} current={currentScope} />
              ) : null}
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="border border-border px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted hover:text-foreground"
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="min-w-0 pb-10">{children}</main>
      </div>
    </div>
  );
}
