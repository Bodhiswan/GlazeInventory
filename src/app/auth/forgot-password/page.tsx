import type { Metadata } from "next";
import Link from "next/link";

import { sendPasswordResetAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { formatSearchQuery } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const error = formatSearchQuery(params.error);
  const sent = formatSearchQuery(params.sent);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[680px] items-center px-6 py-12">
      <Panel className="w-full space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted">Password recovery</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight">Reset your password.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Enter the email address on your account and we&apos;ll send you a password reset link.
          </p>
        </div>

        {error ? (
          <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {sent ? (
          <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
            Check your email for the reset link. Open it in the same browser and we&apos;ll take you to the new password screen.
          </div>
        ) : null}

        <form action={sendPasswordResetAction} className="grid gap-4">
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
          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingText="Sending reset link…">Send reset link</SubmitButton>
            <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost" })}>
              Back to sign in
            </Link>
          </div>
        </form>
      </Panel>
    </main>
  );
}
