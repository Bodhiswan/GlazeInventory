import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeLandingPage } from "@/components/home-landing-page";
import { getViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ceramic Glaze Catalog, Combinations & Inventory",
  description:
    "Browse thousands of ceramic glazes from Mayco, AMACO, Coyote, Duncan, and Spectrum. See firing images, glaze combinations, and community test results.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    next?: string;
    error?: string;
    error_description?: string;
    error_code?: string;
  }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  const code = formatSearchQuery(params.code);
  const next = formatSearchQuery(params.next);
  const authError = formatSearchQuery(params.error_description) ?? formatSearchQuery(params.error);
  const errorCode = formatSearchQuery(params.error_code);

  if (code) {
    const callbackParams = new URLSearchParams({ code });

    if (next) {
      callbackParams.set("next", next);
    } else {
      callbackParams.set("next", "/dashboard");
    }

    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  if (authError) {
    const message =
      errorCode === "otp_expired"
        ? "That password reset link has expired. Request a new one and try again."
        : authError;

    redirect(`/auth/forgot-password?error=${encodeURIComponent(message)}`);
  }

  if (viewer) {
    redirect("/dashboard");
  }

  return <HomeLandingPage />;
}
