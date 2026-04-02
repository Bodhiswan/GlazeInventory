import Link from "next/link";

import { beginAccountCreationAction, signUpWithPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { SetupCallout } from "@/components/setup-callout";
import { getViewer } from "@/lib/data";
import { getSupabaseEnv } from "@/lib/env";
import { formatSearchQuery } from "@/lib/utils";

export async function AuthSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await getViewer();
  const params = await searchParams;
  const error = formatSearchQuery(params.error);

  if (viewer) {
    if (viewer.profile.isAnonymous) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-[920px] items-center px-6 py-12">
          <Panel className="w-full space-y-6">
            <p className="text-sm uppercase tracking-[0.24em] text-muted">Guest session active</p>
            <h1 className="display-font text-4xl tracking-tight">Leave guest mode to create an account.</h1>
            <p className="max-w-xl text-sm leading-6 text-muted">
              Guest browsing is still signed in. We&apos;ll clear that temporary session first, then
              take you straight into the verified account form.
            </p>
            <div className="flex flex-wrap gap-3">
              <form action={beginAccountCreationAction}>
                <button type="submit" className={buttonVariants({})}>
                  Continue to sign up
                </button>
              </form>
              <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
                Back to dashboard
              </Link>
            </div>
          </Panel>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[920px] items-center px-6 py-12">
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[920px] items-center px-6 py-12">
      <div className="grid w-full gap-6">
        {!getSupabaseEnv() ? <SetupCallout /> : null}

        <Panel className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted">Create account</p>
              <h1 className="display-font mt-2 text-4xl tracking-tight">Start with a verified email.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                Set your username, email, and password. Supabase will send a verification email before the account becomes active.
              </p>

              {error ? (
                <div className="mt-5 border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
                  {decodeURIComponent(error)}
                </div>
              ) : null}

              <form action={signUpWithPasswordAction} className="mt-6 grid gap-4">
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
                    required
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
                  <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost" })}>
                    Back to sign in
                  </Link>
                </div>
              </form>
            </div>

            <div className="border border-border bg-panel p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">After signup</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Verify, then work normally.</h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                Once you confirm your email, you can sign in with your email and password, save glazes to inventory, comment on glaze pages, and keep your profile preferences synced.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
