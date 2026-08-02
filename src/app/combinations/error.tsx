"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function CombinationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the FULL error to production logs
    console.error("[COMBINATIONS_ERROR_BOUNDARY]", error.message, error.stack);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-6 py-12">
      <Panel className="w-full text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">
          Something went wrong
        </p>
        <h1 className="display-font mt-2 text-4xl tracking-tight">
          Combinations hit a snag.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          We couldn&apos;t load the combinations right now. Try again, or return to the combinations page.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={reset} className={buttonVariants({})}>
            Try again
          </button>
          <Link href="/combinations" className={buttonVariants({ variant: "ghost" })}>
            Back to combinations
          </Link>
        </div>
      </Panel>
    </main>
  );
}
