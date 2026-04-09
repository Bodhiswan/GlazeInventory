import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const highlights = [
  {
    label: "Public glaze library",
    description:
      "Browse thousands of ceramic glazes from major brands with firing images, finish notes, and searchable surface traits.",
  },
  {
    label: "Real combination examples",
    description:
      "Explore kiln-tested glaze combinations and jump straight into the pairings that look promising for your next test tile.",
  },
  {
    label: "Free account when you're ready",
    description:
      "Create an account to save your shelf, track favourites, keep private notes, and see which combinations you can actually make.",
  },
];

const welcomeLinks = [
  {
    href: "/glazes",
    eyebrow: "Start with color",
    title: "Browse the glaze catalog",
    description:
      "Search by brand, cone, finish, and color family without needing an account first.",
  },
  {
    href: "/combinations",
    eyebrow: "Start with layering",
    title: "Explore combinations",
    description:
      "See public example pages and community-tested pairings before you commit to your next firing.",
  },
  {
    href: "/auth/sign-up",
    eyebrow: "Make it yours",
    title: "Create a free account",
    description:
      "Save your inventory, track favourites, and unlock your own dashboard when you want the personalized tools.",
  },
];

const combinationExamples = [
  { top: "SW-173 Birch", base: "SW-152 Slate", cone: "Cone 6" },
  { top: "PC-25 Textured Turquoise", base: "PC-36 Ironstone", cone: "Cone 5" },
  { top: "FN-219 Lustre Green", base: "FN-018 Bright Jade", cone: "Cone 06" },
];

export function HomeLandingPage({
  viewer,
}: {
  viewer: { profile: { id: string } } | null;
}) {
  const primaryHref = viewer ? "/dashboard" : "/auth/sign-up";
  const primaryLabel = viewer ? "Open dashboard" : "Create free account";

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-12">
        <header className="flex flex-col items-start gap-4 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Glaze Library</p>
            <p className="display-font text-2xl tracking-tight">glazeinventory.com</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link href="/glazes" className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto" })}>
              Browse glazes
            </Link>
            <Link href="/combinations" className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto" })}>
              Explore combinations
            </Link>
            <Link href={primaryHref} className={buttonVariants({ className: "w-full sm:w-auto" })}>
              {primaryLabel}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-start gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.85fr)]">
          <div className="max-w-[640px]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Welcome to the public glaze library
            </p>
            <h1 className="display-font mt-5 text-[clamp(2.8rem,5.5vw,5rem)] leading-[0.92] tracking-[-0.04em]">
              Browse first. Save your shelf when you are ready.
            </h1>
            <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-muted">
              You can now use the site as a public reference library. Explore glazes, check
              out combination pages, and only create an account if you want inventory tracking,
              favourites, and your own personalized workspace.
            </p>

            <div className="mt-5 inline-flex border border-border bg-panel px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted">
              No login needed to browse the public library
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/glazes" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
                Browse glazes
              </Link>
              <Link href="/combinations" className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
                Explore combinations
              </Link>
              {!viewer ? (
                <Link href="/auth/sign-up" className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full sm:w-auto" })}>
                  Create free account
                </Link>
              ) : null}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="border border-border bg-panel px-4 py-4">
                <p className="display-font text-3xl tracking-tight">1000s</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
                  Glazes to browse
                </p>
              </div>
              <div className="border border-border bg-panel px-4 py-4">
                <p className="display-font text-3xl tracking-tight">1000s</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
                  Combination results
                </p>
              </div>
              <div className="border border-border bg-panel px-4 py-4">
                <p className="display-font text-3xl tracking-tight">Free</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
                  Public browsing
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-0 border-t border-border">
              {highlights.map((feature) => (
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

          <div className="space-y-5">
            <div className="border border-border bg-panel p-4 sm:p-5">
              <div className="border-b border-border pb-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Start here</p>
                <h2 className="display-font mt-2 text-2xl tracking-tight">
                  Pick the path that matches how you work.
                </h2>
                <p className="mt-2 text-sm text-muted">
                  The homepage no longer needs to funnel people into sign-in first. Let them
                  browse, then invite them to save their own shelf.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {welcomeLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block border border-border px-4 py-4 transition-colors hover:bg-background"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      {item.eyebrow}
                    </p>
                    <p className="display-font mt-2 text-xl tracking-tight">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border border-border p-4 sm:p-5">
              <div className="border-b border-border pb-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Combination preview</p>
                <h2 className="display-font mt-2 text-2xl tracking-tight">
                  Find your next test tile.
                </h2>
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
              </div>

              <p className="mt-4 text-sm leading-6 text-muted">
                Browse freely, and create an account later if you want saved inventory, private notes, and personalized combination matching.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
