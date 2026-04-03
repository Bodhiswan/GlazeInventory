import Link from "next/link";

import {
  continueAsGuestAction,
  signInWithPasswordAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { SetupCallout } from "@/components/setup-callout";
import { FormBanner } from "@/components/ui/form-banner";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { getViewer } from "@/lib/data";
import { getSupabaseEnv } from "@/lib/env";
import { formatSearchQuery } from "@/lib/utils";

export async function AuthEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; passwordReset?: string; redirectTo?: string }>;
}) {
  const viewer = await getViewer();
  const params = await searchParams;
  const error = formatSearchQuery(params.error);
  const registered = formatSearchQuery(params.registered);
  const passwordReset = formatSearchQuery(params.passwordReset);
  const redirectTo = formatSearchQuery(params.redirectTo);

  if (viewer) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[480px] items-center px-4 py-8 sm:px-6 sm:py-12">
        <Panel className="w-full space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-muted">Already signed in</p>
          <h1 className="display-font text-4xl tracking-tight">Your workspace is ready.</h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            {viewer.mode === "demo"
              ? "Supabase is not configured yet, so you are looking at the preview dataset."
              : "Your session is active, so you can head straight into the library."}
          </p>
          <Link href="/dashboard" className={buttonVariants({})}>
            Go to dashboard
          </Link>
        </Panel>
      </main>
    );
  }

  const signUpHref = redirectTo
    ? `/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/auth/sign-up";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] items-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid w-full gap-6">
        {!getSupabaseEnv() ? <SetupCallout /> : null}

        <Panel className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">Welcome</p>
            <h1 className="display-font mt-2 text-4xl tracking-tight">Sign in to Glaze Inventory.</h1>
          </div>

          {error ? (
            <FormBanner variant="error">{decodeURIComponent(error)}</FormBanner>
          ) : null}
          {registered ? (
            <FormBanner variant="success">
              We sent a confirmation email from Glaze Inventory. Check your inbox (and spam folder) for a
              message with a verification link. Click the link to activate your account, then come back
              here and sign in with your password.
            </FormBanner>
          ) : null}
          {passwordReset ? (
            <FormBanner variant="success">
              Your password has been updated. Sign in with your new password.
            </FormBanner>
          ) : null}

          <form action={signInWithPasswordAction} className="grid gap-4">
            {redirectTo ? <input type="hidden" name="returnTo" value={redirectTo} /> : null}
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
                autoComplete="current-password"
                required
              />
            </label>
            <div className="-mt-1">
              <Link href="/auth/forgot-password" className="text-sm text-muted underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            </div>
            <SubmitButton pendingText="Signing in…" className="w-full">
              Sign in
            </SubmitButton>
          </form>

          <div className="border-t border-border pt-5 space-y-3">
            <Link href={signUpHref} className={buttonVariants({ variant: "ghost", className: "w-full" })}>
              Create a new account
            </Link>
            <form action={continueAsGuestAction}>
              {redirectTo ? <input type="hidden" name="returnTo" value={redirectTo} /> : null}
              <button
                type="submit"
                className={buttonVariants({ variant: "ghost", className: "w-full" })}
              >
                Continue as guest
              </button>
            </form>
            <p className="text-center text-xs leading-5 text-muted">
              Guest mode lets you browse the catalog. Inventory, comments, and ratings require a verified account.
            </p>
          </div>
        </Panel>
      </div>
    </main>
  );
}

