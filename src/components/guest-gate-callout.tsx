import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function GuestGateCallout({
  feature,
  redirectTo,
  className,
}: {
  feature: string;
  redirectTo?: string;
  className?: string;
}) {
  const signUpHref = redirectTo
    ? `/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/auth/sign-up";
  const signInHref = redirectTo
    ? `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/auth/sign-in";

  return (
    <div className={className ?? "border border-border bg-panel px-4 py-4 space-y-3"}>
      <p className="text-sm text-muted">
        {feature}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href={signUpHref} className={buttonVariants({ size: "sm" })}>
          Create account
        </Link>
        <Link href={signInHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
