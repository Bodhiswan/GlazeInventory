import Link from "next/link";

import { AppShellNav } from "@/components/app-shell-nav";
import { ChangelogBanner } from "@/components/changelog-banner";
import { getUnreadDirectMessageCount } from "@/lib/data/community";
import type { Viewer } from "@/lib/types";

export async function AppShell({
  viewer,
  children,
}: Readonly<{
  viewer: Viewer;
  children: React.ReactNode;
}>) {
  const unreadMessages = await getUnreadDirectMessageCount(viewer.profile.id);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:px-6">
        <header className="sticky top-0 z-30 -mx-3 border-b border-border bg-background/95 px-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-0 py-3 sm:py-4">
            <Link
              href="/dashboard"
              className="display-font justify-self-start border border-border bg-panel px-3 py-2 text-lg leading-none tracking-tight sm:text-xl"
            >
              <span className="sm:hidden">G.I.</span>
              <span className="hidden sm:inline">Glaze Inventory</span>
            </Link>

            <div className="flex min-w-0 justify-center sm:justify-start">
              <AppShellNav isAdmin={viewer.profile.isAdmin === true} />
            </div>

            <div className="flex min-w-0 items-center justify-end gap-1.5 sm:pl-3">
              {viewer.mode === "demo" ? (
                <span className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted">
                  Preview data
                </span>
              ) : null}

              {unreadMessages > 0 ? (
                <Link
                  href="/profile?tab=chats"
                  className="inline-flex shrink-0 items-center gap-1.5 border border-red-400 bg-red-50 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-red-700"
                  title={`${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`}
                >
                  <span className="tabular-nums">{unreadMessages}</span>
                  <span>msg</span>
                </Link>
              ) : null}

              {viewer.mode === "live" ? (
                <>
                  <span className="hidden shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted tabular-nums sm:inline-block">
                    {viewer.profile.points ?? 0} pts
                  </span>
                  <Link
                    href="/profile"
                    className="hidden shrink-0 items-center border border-border bg-panel/40 px-3 py-2 text-[10px] uppercase tracking-[0.14em] hover:bg-panel/60 sm:inline-flex"
                  >
                    <span className="max-w-[120px] truncate">{viewer.profile.displayName}</span>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main id="main-content" className="min-w-0 pb-6">
          <ChangelogBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
