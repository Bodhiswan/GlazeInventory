import type { Metadata } from "next";

import { AuthEntryPage } from "@/components/auth-entry-page";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; passwordReset?: string; redirectTo?: string }>;
}) {
  return <AuthEntryPage searchParams={searchParams} />;
}
