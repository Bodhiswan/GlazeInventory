import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/data/users";

const features = [
  {
    label: "Glaze Library",
    description: "Browse 1,300+ glazes from Mayco, AMACO, Coyote, Duncan, Spectrum, and Speedball with firing images, community ratings, and surface tags.",
  },
  {
    label: "Combination Explorer",
    description: "Search 4,600+ manufacturer-tested glaze combinations with photos. Filter by cone and see which ones you can make with glazes you already own.",
  },
  {
    label: "Shelf Tracker",
    description: "Mark what you own, track fill levels, organise into folders, and always know what needs restocking.",
  },
  {
    label: "Possible Combos",
    description: "Instantly see every tested combination you can fire right now based on the glazes on your shelf.",
  },
];

const combinationExamples = [
  { top: "SW-173 Birch", base: "SW-152 Slate", cone: "Cone 6" },
  { top: "SW-131 Ironstone", base: "SW-144 Eggnog", cone: "Cone 10" },
  { top: "PC-25 Textured Turquoise", base: "PC-36 Ironstone", cone: "Cone 5" },
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">For potters and ceramicists</p>
            <h1 className="display-font mt-5 text-[clamp(2.8rem,5.5vw,5rem)] leading-[0.92] tracking-[-0.04em]">
              Your glaze shelf, searchable and organised.
            </h1>
            <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-muted">
              Search 1,300+ commercial glazes, explore 4,600+ tested combinations with photos,
              and track what you own so you always know what to reach for next.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {viewer ? (
                <>
                  <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
                    Open dashboard
                  </Link>
                  <Link href="/combinations" className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
                    Browse combinations
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/sign-up" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
                    Create free account
                  </Link>
                  <Link href="/auth/sign-in" className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 space-y-0 border-t border-border">
              {features.map((feature) => (
                <div
                  key={feature.label}
                  className="border-b border-border py-3.5"
                >
                  <p className="text-sm font-semibold text-foreground">{feature.label}</p>
                  <p className="mt-1 text-sm text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border p-4 sm:p-5">
            <div className="border-b border-border pb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Combination preview</p>
              <h2 className="display-font mt-2 text-2xl tracking-tight">Find your next test tile.</h2>
              <p className="mt-2 text-sm text-muted">
                Every combination includes the photo, layer order, and application notes from the manufacturer.
              </p>
            </div>

            <div className="mt-4 overflow-hidden border border-border">
              <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-3 border-b border-border px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-muted sm:grid">
                <span>Top</span>
                <span>Base</span>
                <span>Cone</span>
              </div>
              <div className="sm:hidden">
                {combinationExamples.map((row, index) => (
                  <div
                    key={`${row.top}-${row.base}`}
                    className={index < combinationExamples.length - 1 ? "border-b border-border px-4 py-3.5" : "px-4 py-3.5"}
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{row.cone}</p>
                    <p className="mt-1 font-medium">{row.top}</p>
                    <p className="mt-0.5 text-sm text-muted">over {row.base}</p>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block">
                {combinationExamples.map((row, index) => (
                  <div
                    key={`${row.top}-${row.base}`}
                    className={`grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-3 px-4 py-3.5 text-sm ${
                      index < combinationExamples.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <span className="font-medium">{row.top}</span>
                    <span className="font-medium">{row.base}</span>
                    <span className="text-muted">{row.cone}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em]">
              <span className="border border-border px-3 py-1.5">Mayco</span>
              <span className="border border-border px-3 py-1.5">AMACO</span>
              <span className="border border-border px-3 py-1.5">Coyote</span>
              <span className="border border-border px-3 py-1.5">Duncan</span>
              <span className="border border-border px-3 py-1.5">Spectrum</span>
              <span className="border border-border px-3 py-1.5">Speedball</span>
              <span className="border border-border px-3 py-1.5">Cone 5 / 6 / 10</span>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              Free to use. Create an account to save your inventory, rate glazes, and see which combinations you can fire with what you already own.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
