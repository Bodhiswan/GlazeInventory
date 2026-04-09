import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export function GlazeSignUpCta({ glazeName }: { glazeName: string }) {
  return (
    <Panel className="space-y-4 border-accent-1/20 bg-accent-1/5">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">
          Free member features
        </p>
        <h2 className="display-font mt-2 text-2xl tracking-tight">
          Track {glazeName} in your inventory
        </h2>
      </div>
      <p className="text-sm leading-6 text-muted">
        Sign up to add this glaze to your shelf, leave studio notes, favourite
        glazes, and see which combinations you can fire with what you already
        own.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/auth/sign-up" className={buttonVariants({ size: "sm" })}>
          Create free account
        </Link>
        <Link
          href="/auth/sign-in"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Sign in
        </Link>
      </div>
    </Panel>
  );
}
