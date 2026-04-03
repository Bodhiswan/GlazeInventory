import type { Metadata } from "next";

import { AuthSignUpPage } from "@/components/auth-sign-up-page";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  return <AuthSignUpPage searchParams={searchParams} />;
}
