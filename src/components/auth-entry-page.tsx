import Link from "next/link";

import {
  beginAccountCreationAction,
  continueAsGuestAction,
  signInWithPasswordAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { SetupCallout } from "@/components/setup-callout";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { getViewer } from "@/lib/data";
import { getSupabaseEnv } from "@/lib/env";
import { formatSearchQuery } from "@/lib/utils";

export async function AuthEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; passwordReset?: string }>;
}) {
  const viewer = await getViewer();
  const params = await searchParams;
  const error = formatSearchQuery(params.error);
  const registered = formatSearchQuery(params.registered);
  const passwordReset = formatSearchQuery(params.passwordReset);

  if (viewer) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[920px] items-center px-4 py-8 sm:px-6 sm:py-12">
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[920px] items-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid w-full gap-6">
        {!getSupabaseEnv() ? <SetupCallout /> : null}

        <Panel className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">Verified account access</p>
            <h1 className="display-font mt-2 text-4xl tracking-tight">Sign in or create an account.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Use your email and password to sign in. New accounts are created with a username,
              password, and email verification before the session becomes active.
            </p>
          </div>

          {error ? (
            <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
              {decodeURIComponent(error)}
            </div>
          ) : null}
          {registered ? (
            <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
              Check your email for the verification link, then come back and sign in with your password.
            </div>
          ) : null}
          {passwordReset ? (
            <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
              Your password has been updated. Sign in with your new password.
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-border bg-panel p-5">
              <div id="sign-in" />
              <div className="mb-5">
                <p className="text-sm uppercase tracking-[0.2em] text-muted">Sign in</p>
                <h2 className="display-font mt-2 text-3xl tracking-tight">Welcome back.</h2>
              </div>

              <form action={signInWithPasswordAction} className="grid gap-4">
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
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <SubmitButton pendingText="Signing in…" className="w-full sm:w-auto">
                    Sign in
                  </SubmitButton>
                  <button
                    id="guest"
                    formAction={continueAsGuestAction}
                    formNoValidate
                    className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto" })}
                  >
                    Continue as guest
                  </button>
                </div>
              </form>
              <p className="mt-4 text-sm leading-6 text-muted">
                Guest mode lets you browse the glaze catalog only. Inventory tools and comments stay locked until you use a verified account.
              </p>
            </div>

            <div className="border border-border bg-panel p-5">
              <div id="create-account" />
              <p className="text-sm uppercase tracking-[0.2em] text-muted">New here?</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Create a verified account.</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Use a username, email, and password to create your account. You&apos;ll verify your email before you start managing inventory.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <form action={beginAccountCreationAction}>
                  <button type="submit" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                    Go to sign up
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
