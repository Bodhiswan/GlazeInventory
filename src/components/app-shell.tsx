import Link from "next/link";

import { beginAccountCreationAction } from "@/app/actions";
import { AppShellNav } from "@/components/app-shell-nav";
import { buttonVariants } from "@/components/ui/button";
import type { Viewer } from "@/lib/types";

export function AppShell({
  viewer,
  children,
}: Readonly<{
  viewer: Viewer;
  children: React.ReactNode;
}>) {
  const accountAction = viewer.profile.isAnonymous ? (
    <form action={beginAccountCreationAction} className="shrink-0">
      <button
        type="submit"
        className={buttonVariants({ size: "sm", className: "shrink-0" })}
      >
        Create account
      </button>
    </form>
  ) : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:px-6">
        <header className="sticky top-0 z-30 -mx-3 border-b border-border bg-background/95 px-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 py-3 sm:grid-cols-[auto_1fr_auto] sm:gap-3 sm:py-4">
            <Link
              href="/dashboard"
              className="display-font justify-self-start border border-border bg-panel px-3 py-2 text-lg leading-none tracking-tight sm:text-xl"
            >
              <span className="sm:hidden">G.I.</span>
              <span className="hidden sm:inline">Glaze Inventory</span>
            </Link>

            <div className="flex min-w-0 justify-center">
              <AppShellNav
                isAdmin={Boolean(viewer.profile.isAdmin)}
                isGuest={Boolean(viewer.profile.isAnonymous)}
              />
            </div>

            <div className="col-span-2 flex min-w-0 items-center justify-end gap-2 sm:col-span-1">
              {viewer.mode === "demo" ? (
                <span className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted">
                  Preview data
                </span>
              ) : null}

              {viewer.profile.isAnonymous ? (
                <span className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px] sm:tracking-[0.16em]">
                  Guest
                </span>
              ) : (
                <Link
                  href="/profile"
                  className="max-w-[9rem] truncate border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:bg-panel hover:text-foreground sm:max-w-[13rem] sm:text-[11px] sm:tracking-[0.16em]"
                >
                  {viewer.profile.displayName}
                </Link>
              )}

              {accountAction}
            </div>
          </div>
        </header>

        <main id="main-content" className="min-w-0 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
