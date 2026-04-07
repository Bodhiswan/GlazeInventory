import Link from "next/link";

import { signUpWithPasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { FormBanner } from "@/components/ui/form-banner";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { SetupCallout } from "@/components/setup-callout";
import { getViewer } from "@/lib/data/users";
import { getSupabaseEnv } from "@/lib/env";
import { formatSearchQuery } from "@/lib/utils";

export async function AuthSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const viewer = await getViewer();
  const params = await searchParams;
  const error = formatSearchQuery(params.error);
  const redirectTo = formatSearchQuery(params.redirectTo);

  if (viewer) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[480px] items-center px-6 py-12">
        <Panel className="w-full space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-muted">Already signed in</p>
          <h1 className="display-font text-4xl tracking-tight">Your workspace is ready.</h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Your session is active, so you can head straight into the library.
          </p>
          <Link href="/dashboard" className={buttonVariants({})}>
            Go to dashboard
          </Link>
        </Panel>
      </main>
    );
  }

  const signInHref = redirectTo
    ? `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/auth/sign-in";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] items-center px-6 py-12">
      <div className="grid w-full gap-6">
        {!getSupabaseEnv() ? <SetupCallout /> : null}

        <Panel className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">Create account</p>
            <h1 className="display-font mt-2 text-4xl tracking-tight">Start with a verified email.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Set your username, email, and password. You&apos;ll verify your email before the account becomes active.
            </p>
          </div>

          {error ? (
            <FormBanner variant="error">{decodeURIComponent(error)}</FormBanner>
          ) : null}

          <form action={signUpWithPasswordAction} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Username
              <Input
                name="displayName"
                type="text"
                placeholder="Studio name or username"
                autoCapitalize="words"
                autoComplete="nickname"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Email
              <Input
                name="email"
                type="email"
                placeholder="you@studio.com"
                autoCapitalize="none"
                autoComplete="email"
                spellCheck={false}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <Input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Confirm password
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <SubmitButton pendingText="Creating account…" className="w-full">
              Create account
            </SubmitButton>
          </form>

          <div className="border-t border-border pt-5">
            <Link href={signInHref} className={buttonVariants({ variant: "ghost", className: "w-full" })}>
              Already have an account? Sign in
            </Link>
          </div>
        </Panel>
      </div>
    </main>
  );
}

