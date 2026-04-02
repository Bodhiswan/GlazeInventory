"use client";

import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-6 py-12">
      <Panel className="w-full text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">
          Something went wrong
        </p>
        <h1 className="display-font mt-2 text-4xl tracking-tight">
          This page hit a snag.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          An unexpected error occurred while loading this page. You can try
          again, or head back to your dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={reset} className={buttonVariants({})}>
            Try again
          </button>
          <a href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
            Back to dashboard
          </a>
        </div>
      </Panel>
    </main>
  );
}
