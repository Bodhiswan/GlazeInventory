import Link from "next/link";

import { PublicWorkspaceNav } from "@/components/public-workspace-nav";

export function PublicWorkspaceShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:px-6">
        <header className="sticky top-0 z-30 -mx-3 border-b border-border bg-background/95 px-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
          <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="display-font shrink-0 border border-border bg-panel px-3 py-2 text-lg leading-none tracking-tight sm:text-xl"
              >
                <span className="sm:hidden">G.I.</span>
                <span className="hidden sm:inline">Glaze Inventory</span>
              </Link>
              <span className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px] sm:tracking-[0.16em]">
                Public library
              </span>
            </div>

            <PublicWorkspaceNav />
          </div>
        </header>

        <main id="main-content" className="min-w-0 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
