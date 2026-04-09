import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function PublicWorkspaceShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:px-6">
        <header className="sticky top-0 z-30 -mx-3 border-b border-border bg-background/95 px-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="display-font border border-border bg-panel px-3 py-2 text-lg leading-none tracking-tight sm:text-xl"
              >
                <span className="sm:hidden">G.I.</span>
                <span className="hidden sm:inline">Glaze Inventory</span>
              </Link>
              <span className="shrink-0 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px] sm:tracking-[0.16em]">
                Public combinations
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/combinations" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Combinations
              </Link>
              <Link href="/guides/glazing-pottery" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Guides
              </Link>
              <Link href="/auth/sign-in" className={buttonVariants({ size: "sm" })}>
                Sign in
              </Link>
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
