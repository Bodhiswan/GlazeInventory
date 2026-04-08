"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { buttonVariants } from "@/components/ui/button";

const WELCOME_KEY = "glaze-library-welcome-dismissed-v1";

export function DashboardWelcome({ displayName }: { displayName: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      if (localStorage.getItem(WELCOME_KEY)) setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  if (hydrated && dismissed) {
    return <TutorialModal open={tourOpen} onClose={() => setTourOpen(false)} />;
  }

  return (
    <>
      <Panel className="relative space-y-5">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss welcome"
          className="absolute right-3 top-3 text-muted transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2 pr-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Welcome</p>
          <h1 className="display-font text-3xl tracking-tight sm:text-4xl">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Glaze Inventory is built on <strong className="text-foreground">friendliness, warmth, and
            sharing</strong> — a place where potters track what is on their shelf, swap firing photos, and
            help each other discover new glaze combinations. Take a quick tour to see how it all fits
            together.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTourOpen(true)}
            className={buttonVariants({})}
          >
            Take the tour
          </button>
          <Link href="/glazes" className={buttonVariants({ variant: "ghost" })}>
            Open library
          </Link>
          <Link href="/inventory" className={buttonVariants({ variant: "ghost" })}>
            View inventory
          </Link>
        </div>
      </Panel>

      <TutorialModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}

const TUTORIAL_STEPS = [
  {
    title: "Browse the library",
    body: "The Library has thousands of commercial glazes from Mayco, AMACO, Coyote, Duncan, Spectrum, Speedball, Seattle Pottery Supply, and more. Filter by brand, family, color, finish, and cone to find what you need.",
  },
  {
    title: "Track your inventory",
    body: "Mark glazes as Owned, on your Wishlist, or Empty so you always know what is on your shelf. Group them into folders for projects and studio days.",
  },
  {
    title: "Explore combinations",
    body: "See real firing examples that potters have shared — base + rim, dipping, layering. Open any combination to see exactly which glazes were used and how.",
  },
  {
    title: "Contribute and earn points",
    body: "Add a glaze that's missing, share a combination, upload a firing photo, or leave a comment. Every contribution earns points and helps the community.",
  },
  {
    title: "Connect with the community",
    body: "Browse community firing photos, send a direct message to the admins, and check the 'People to thank' leaderboard to see who has helped build the library this week.",
  },
];

function TutorialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site tour"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg border border-border bg-panel p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour"
          className="absolute right-3 top-3 text-muted transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
          Step {step + 1} of {TUTORIAL_STEPS.length}
        </p>
        <h2 className="display-font mt-2 text-2xl tracking-tight">{current.title}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/80">{current.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {TUTORIAL_STEPS.map((_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={`h-1.5 w-5 ${index === step ? "bg-foreground" : "bg-foreground/20"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Back
              </button>
            ) : null}
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className={buttonVariants({ size: "sm" })}
              >
                Got it
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className={buttonVariants({ size: "sm" })}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
