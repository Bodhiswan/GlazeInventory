"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  MessageCircle,
  Package,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { buttonVariants } from "@/components/ui/button";

/** Mayco Crystalites glaze tiles — visually striking crystal line that
 *  makes for a much more eye-catching welcome strip than uniform matte tiles. */
const TILE_POOL = [
  "cg-707", "cg-750", "cg-779", "cg-962", "cg-970",
  "cg-980", "cg-985", "cg-986", "cg-991", "cg-993",
  "cg-994", "cg-1000", "cg-1001", "cg-1005",
].map((code) => ({ code, src: `/vendor-images/mayco-crystalites/${code}.jpg` }));

export function DashboardWelcome({ displayName }: { displayName: string }) {
  const [tourOpen, setTourOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const firstName = displayName.split(" ")[0];

  return (
    <>
      <Panel className="relative overflow-hidden p-0">
        {/* Hero strip of real glaze tiles with edge fade */}
        <div className="relative h-28 overflow-hidden sm:h-36">
          <div className="absolute inset-0 flex gap-1.5 px-1.5 py-1.5">
            {TILE_POOL.slice(0, 14).map((tile, i) => (
              <div
                key={tile.code}
                className="relative aspect-square h-full flex-shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5"
                style={{ opacity: 0.92 - (i % 4) * 0.08 }}
              >
                <Image
                  src={tile.src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 140px, 110px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {/* fade mask right edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-panel to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-panel to-transparent"
          />
          {/* subtle bottom fade into the panel body */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-panel to-transparent"
          />
        </div>

        <div className="space-y-5 px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Welcome{hydrated ? ", " : ""}
              {hydrated ? firstName : ""}
            </p>
            <h1 className="display-font text-3xl tracking-tight sm:text-4xl">
              Your glaze shelf, searchable and shared.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Glaze Inventory is built on{" "}
              <strong className="text-foreground">friendliness, warmth, and sharing</strong> —
              a place where potters track what&apos;s on their shelf, swap firing photos, and
              help each other discover new combinations. Take two minutes to see how it all
              fits together.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className={`${buttonVariants({ size: "lg" })} group relative gap-2 pl-5 pr-6`}
            >
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              <span>Take the 2-minute tour</span>
            </button>
            <Link href="/glazes" className={buttonVariants({ variant: "ghost", size: "lg" })}>
              Open library
            </Link>
            <Link
              href="/inventory"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              View inventory
            </Link>
          </div>
        </div>
      </Panel>

      <TutorialModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}

/* ───────────────────────── Tutorial Modal ───────────────────────── */

type TourStep = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  hook: string;
  body: string;
  bullets: string[];
  cta: { href: string; label: string };
  visual: "library" | "inventory" | "combinations" | "contribute" | "community";
};

const TUTORIAL_STEPS: TourStep[] = [
  {
    icon: BookOpen,
    eyebrow: "Step 1 · Discover",
    title: "Browse thousands of real glazes",
    hook: "Mayco, AMACO, Coyote, Duncan, Spectrum, Speedball, Seattle Pottery Supply — all in one place.",
    body: "Filter by brand, family, colour, finish, or cone. Every glaze has real firing photos from potters like you — not just a marketing swatch.",
    bullets: [
      "5,000+ commercial glazes with firing photos",
      "Smart search across code, name, and keyword",
      "Save favourites with one tap",
    ],
    cta: { href: "/glazes", label: "Open the library" },
    visual: "library",
  },
  {
    icon: Package,
    eyebrow: "Step 2 · Organise",
    title: "Know exactly what's on your shelf",
    hook: "Owned, wishlist, empty — never buy a duplicate or run out mid-project again.",
    body: "Track fill levels, group glazes into folders for projects and studio days, and see at a glance what you can actually fire tonight.",
    bullets: [
      "Mark as Owned, Wishlist, or Empty",
      "Folders for projects and studio days",
      "Restock reminders when jars run low",
    ],
    cta: { href: "/inventory", label: "Set up your inventory" },
    visual: "inventory",
  },
  {
    icon: Layers,
    eyebrow: "Step 3 · Explore",
    title: "See real combinations, not just swatches",
    hook: "Base + rim, dipping, layering — with photos of how the glazes actually interact.",
    body: "Open any combination to see exactly which glazes were layered, in what order, and on what clay body. Filter to only combinations you can make with what you already own.",
    bullets: [
      "Thousands of tested combinations",
      "&apos;Can I make this?&apos; filter based on your shelf",
      "Firing photos from the community",
    ],
    cta: { href: "/combinations", label: "Explore combinations" },
    visual: "combinations",
  },
  {
    icon: Upload,
    eyebrow: "Step 4 · Contribute",
    title: "Share your firings. Earn points.",
    hook: "Every photo, glaze, and combination you share helps the whole community.",
    body: "Add a glaze that&apos;s missing. Publish a combination that worked. Upload a firing photo. Every contribution earns points and shows up on the weekly leaderboard.",
    bullets: [
      "+2 points for firing photos",
      "+5 points for combinations",
      "+10 points for new glaze entries",
    ],
    cta: { href: "/contribute", label: "Make your first contribution" },
    visual: "contribute",
  },
  {
    icon: MessageCircle,
    eyebrow: "Step 5 · Connect",
    title: "You&apos;re not glazing alone",
    hook: "Message admins, browse community firings, and see who&apos;s been helping this week.",
    body: "Glaze Inventory is a small, friendly community. If something&apos;s missing or broken, just send a message — a real person will read it.",
    bullets: [
      "Direct messaging with admins",
      "Community firing photo feed",
      "Weekly &apos;People to thank&apos; leaderboard",
    ],
    cta: { href: "/community", label: "Visit the community" },
    visual: "community",
  },
];

function TutorialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  const goNext = useCallback(
    () => setStep((s) => Math.min(s + 1, TUTORIAL_STEPS.length - 1)),
    [],
  );
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setStep((s) => Math.min(s + 1, TUTORIAL_STEPS.length - 1));
      if (event.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    }
    document.addEventListener("keydown", onKey);
    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site tour"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden border border-border bg-panel shadow-2xl sm:max-h-[90vh] sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour"
          className="absolute right-3 top-3 z-20 rounded-full bg-white/80 p-1.5 text-muted backdrop-blur transition-colors hover:bg-white hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Visual side */}
        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-gradient-to-br from-foreground/[0.04] via-foreground/[0.02] to-transparent sm:min-h-0 sm:w-1/2">
          <StepVisual variant={current.visual} stepKey={step} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel/40 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-panel/20"
          />
        </div>

        {/* Text side */}
        <div className="flex flex-1 flex-col justify-between gap-5 p-6 sm:w-1/2 sm:p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-white">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {current.eyebrow}
              </p>
            </div>

            <h2 className="display-font text-2xl leading-tight tracking-tight sm:text-3xl">
              <Decoded text={current.title} />
            </h2>

            <p className="text-sm font-medium leading-6 text-foreground/90 sm:text-base">
              <Decoded text={current.hook} />
            </p>

            <p className="text-sm leading-6 text-muted">
              <Decoded text={current.body} />
            </p>

            <ul className="space-y-1.5 pt-1">
              {current.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-2 text-sm leading-5 text-foreground/80"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground/40"
                  />
                  <span>
                    <Decoded text={bullet} />
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={current.cta.href}
              onClick={onClose}
              className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-1 gap-2`}
            >
              {current.cta.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setStep(index)}
                    aria-label={`Go to step ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === step ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                {step + 1} / {TUTORIAL_STEPS.length}
              </p>
            </div>
            <div className="flex gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className={`${buttonVariants({ variant: "ghost", size: "sm" })} gap-1.5`}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Skip
                </button>
              )}
              {isLast ? (
                <button
                  type="button"
                  onClick={onClose}
                  className={`${buttonVariants({ size: "sm" })} gap-1.5`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Let&apos;s go
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className={`${buttonVariants({ size: "sm" })} gap-1.5`}
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Renders apostrophe/ampersand HTML-escaped text as a convenience so bullet
 * copy can contain apostrophes without tripping the JSX parser. */
function Decoded({ text }: { text: string }) {
  return <>{text.replace(/&apos;/g, "’").replace(/&amp;/g, "&")}</>;
}

/* ───────────────────────── Step visuals ───────────────────────── */

function StepVisual({ variant, stepKey }: { variant: TourStep["visual"]; stepKey: number }) {
  // Remount on step change so CSS animations replay.
  return (
    <div
      key={stepKey}
      className="relative flex h-full w-full items-center justify-center p-6 sm:p-8"
      style={{ animation: "tour-fade-in 420ms ease-out" }}
    >
      <style>{`
        @keyframes tour-fade-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes tour-tile-rise {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {variant === "library" ? <VisualLibrary /> : null}
      {variant === "inventory" ? <VisualInventory /> : null}
      {variant === "combinations" ? <VisualCombinations /> : null}
      {variant === "contribute" ? <VisualContribute /> : null}
      {variant === "community" ? <VisualCommunity /> : null}
    </div>
  );
}

function Tile({
  src,
  delay = 0,
  className = "",
}: {
  src: string;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden border border-foreground/10 bg-foreground/5 shadow-sm ${className}`}
      style={{
        animation: `tour-tile-rise 520ms ease-out both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <Image src={src} alt="" fill sizes="160px" className="object-cover" />
    </div>
  );
}

/**
 * Framed screenshot — renders a real UI screenshot as if it were on a small
 * device screen, with a subtle border, rounded corners and a drop shadow.
 * The background gradient behind it makes it read as "a product shot"
 * rather than a full-bleed image.
 */
function Screenshot({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div
      className="relative w-full max-w-[260px] overflow-hidden rounded-[14px] border border-foreground/15 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35),0_8px_20px_-12px_rgba(0,0,0,0.25)]"
      style={{ animation: `tour-tile-rise 560ms ease-out both` }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="260px"
        className="h-auto w-full"
        priority
      />
    </div>
  );
}

function VisualLibrary() {
  return (
    <Screenshot
      src="/tour/library.png"
      alt="Filtered glaze library showing Mayco and AMACO coral glazes"
      width={643}
      height={657}
    />
  );
}

function VisualInventory() {
  return (
    <div className="relative">
      <Screenshot
        src="/tour/inventory.png"
        alt="Searching for a glaze to add to your inventory"
        width={644}
        height={764}
      />
      {/* Accent badges so the screenshot doesn't feel static */}
      <div
        className="absolute -right-3 top-10 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-md"
        style={{ animation: `tour-tile-rise 560ms ease-out both`, animationDelay: "260ms" }}
      >
        Owned
      </div>
      <div
        className="absolute -left-3 top-24 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-md"
        style={{ animation: `tour-tile-rise 560ms ease-out both`, animationDelay: "380ms" }}
      >
        Wishlist
      </div>
    </div>
  );
}

function VisualCombinations() {
  return (
    <Screenshot
      src="/tour/combinations.png"
      alt="Searching for 'honey flux' in the combinations browser with dual search boxes"
      width={647}
      height={765}
    />
  );
}

function VisualContribute() {
  return (
    <div className="relative">
      <Screenshot
        src="/tour/contribute.png"
        alt="The contribute form with a 4-layer combination of AMACO glazes"
        width={657}
        height={936}
      />
      {/* Floating point badges on top of the screenshot */}
      <div
        className="absolute -right-3 -top-3 flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
        style={{ animation: `tour-tile-rise 560ms ease-out both`, animationDelay: "260ms" }}
      >
        <Sparkles className="h-3 w-3" />
        +5 pts
      </div>
      <div
        className="absolute -left-3 top-16 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-md"
        style={{ animation: `tour-tile-rise 560ms ease-out both`, animationDelay: "380ms" }}
      >
        +2 pts
      </div>
      <div
        className="absolute -bottom-2 -right-2 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-md"
        style={{ animation: `tour-tile-rise 560ms ease-out both`, animationDelay: "500ms" }}
      >
        +10 pts
      </div>
    </div>
  );
}

function VisualCommunity() {
  const tiles = [TILE_POOL[1], TILE_POOL[5], TILE_POOL[9], TILE_POOL[12]];
  const initials = ["M", "J", "A", "S"];
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <div className="grid w-full grid-cols-2 gap-2">
        {tiles.map((t, i) => (
          <Tile key={t.code} src={t.src} delay={i * 70} className="aspect-square w-full" />
        ))}
      </div>
      <div
        className="flex items-center gap-2"
        style={{ animation: `tour-fade-in 520ms ease-out both`, animationDelay: "360ms" }}
      >
        {initials.map((initial, i) => (
          <span
            key={initial}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-panel bg-foreground/80 text-[10px] font-semibold text-white shadow-sm"
            style={{ marginLeft: i === 0 ? 0 : "-10px", zIndex: 10 - i }}
          >
            {initial}
          </span>
        ))}
        <span className="ml-1 text-[10px] uppercase tracking-[0.14em] text-muted">
          + 240 potters
        </span>
      </div>
    </div>
  );
}
