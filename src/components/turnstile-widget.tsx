"use client";

import Script from "next/script";

export function TurnstileWidget({
  inputName = "turnstileToken",
}: {
  inputName?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-response-field-name={inputName}
        data-theme="light"
      />
    </>
  );
}
