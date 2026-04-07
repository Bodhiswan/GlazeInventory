import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { updatePasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { getViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await getViewer();

  if (!viewer || viewer.mode === "demo") {
    redirect("/auth/sign-in?error=Open%20your%20password%20reset%20email%20to%20set%20a%20new%20password");
  }

  const params = await searchParams;
  const error = formatSearchQuery(params.error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[680px] items-center px-6 py-12">
      <Panel className="w-full space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted">Choose a new password</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight">Set your new password.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Pick a new password for your account, then sign in normally with your email and password.
          </p>
        </div>

        {error ? (
          <FormBanner variant="error">{decodeURIComponent(error)}</FormBanner>
        ) : null}

        <form action={updatePasswordAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            New password
            <Input
              name="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Confirm new password
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              required
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingText="Saving password…">Save new password</SubmitButton>
            <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost" })}>
              Back to sign in
            </Link>
          </div>
        </form>
      </Panel>
    </main>
  );
}
