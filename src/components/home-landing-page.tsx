import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/data";

const benefitRows = [
  "Search glazes by colour, finish, code, and cone.",
  "Mark what you own and keep your stock list current.",
  "Open glaze pages to compare firing images before testing.",
];

const exampleRows = [
  { code: "SW-151", name: "Olive Float", colour: "Green", cone: "6 / 10" },
  { code: "SW-172", name: "Macadamia", colour: "Cream", cone: "6" },
  { code: "FN-17", name: "Purple", colour: "Blue / purple", cone: "06" },
];

export async function HomeLandingPage() {
  const viewer = await getViewer();

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-12">
        <header className="flex flex-col items-start gap-4 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Glaze Inventory</p>
            <p className="display-font text-2xl tracking-tight">glazeinventory.com</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            {viewer ? (
              <Link href="/dashboard" className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto" })}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto" })}>
                  Sign in
                </Link>
                <Link href="/auth/sign-up" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)]">
          <div className="max-w-[600px]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Manage what is on your shelf</p>
            <h1 className="display-font mt-5 text-[clamp(2.8rem,5.5vw,5rem)] leading-[0.92] tracking-[-0.04em]">
              Keep your glaze inventory searchable and easy to manage.
            </h1>
            <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-muted">
              Search the catalog, mark the glazes you own, and keep track of what is full, half
              used, or empty without juggling notes and spreadsheets.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {viewer ? (
                <>
                  <Link href="/inventory" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
                    Open inventory
                  </Link>
                  <Link href="/glazes" className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
                    Open library
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/sign-up" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
                    Create account
                  </Link>
                  <Link href="/auth/sign-in" className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
                    Sign in
                  </Link>
                  <Link href="/auth/sign-in#guest" className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full sm:w-auto" })}>
                    Browse as guest
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 space-y-0 border-t border-border">
              {benefitRows.map((benefit) => (
                <div
                  key={benefit}
                  className="border-b border-border py-3.5 text-sm text-foreground/75"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border p-4 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Catalog preview</p>
                <h2 className="display-font mt-2 text-2xl tracking-tight">Find the right glaze faster.</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em]">
                <span className="border border-border px-3 py-1.5">Blue</span>
                <span className="border border-border px-3 py-1.5">Glossy</span>
                <span className="border border-border px-3 py-1.5">Cone 6</span>
              </div>
            </div>

            <div className="mt-4 overflow-hidden border border-border">
              <div className="hidden grid-cols-[90px_minmax(0,1.2fr)_1fr_90px] gap-3 border-b border-border px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-muted sm:grid">
                <span>Code</span>
                <span>Name</span>
                <span>Colour</span>
                <span>Cone</span>
              </div>
              <div className="sm:hidden">
                {exampleRows.map((row, index) => (
                  <div
                    key={row.code}
                    className={index < exampleRows.length - 1 ? "border-b border-border px-4 py-3.5" : "px-4 py-3.5"}
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      {row.code} · {row.cone}
                    </p>
                    <p className="mt-1 font-medium">{row.name}</p>
                    <p className="mt-1 text-sm text-muted">{row.colour}</p>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block">
                {exampleRows.map((row, index) => (
                  <div
                    key={row.code}
                    className={`grid grid-cols-[90px_minmax(0,1.2fr)_1fr_90px] gap-3 px-4 py-3.5 text-sm ${
                      index < exampleRows.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <span className="font-medium">{row.code}</span>
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted">{row.colour}</span>
                    <span>{row.cone}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              Search across Mayco, AMACO, and Coyote, then build an inventory that stays useful as your shelf changes.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
