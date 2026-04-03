import Link from "next/link";

import {
  continueAsGuestAction,
  signInWithGoogleAction,
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
              Check your email for the verification link, then come back and sign in with your password.
            </FormBanner>
          ) : null}
          {passwordReset ? (
            <FormBanner variant="success">
              Your password has been updated. Sign in with your new password.
            </FormBanner>
          ) : null}

          {/* Google OAuth */}
          <form action={signInWithGoogleAction}>
            {redirectTo ? <input type="hidden" name="returnTo" value={redirectTo} /> : null}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-panel"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-[0.16em] text-muted">or sign in with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
