const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification if Turnstile is not configured
  if (!secret) return true;

  if (!token || !token.trim()) return false;

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    const data = (await response.json()) as { success: boolean };
    return data.success === true;
  } catch {
    // If verification service is down, fail open to avoid locking out users
    console.error("[Turnstile] Verification request failed");
    return true;
  }
}
