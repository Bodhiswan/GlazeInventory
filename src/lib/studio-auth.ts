import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPasscode(passcode: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(passcode, salt, 32);
  return `s1$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPasscode(passcode: string, stored: string): boolean {
  if (!stored.startsWith("s1$")) return false;
  const [, saltHex, hashHex] = stored.split("$");
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(passcode, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function visitorCookieName(slug: string) {
  return `studio_visit_${slug}`;
}

export function visitorCookieValue(studioId: string): string {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_JWT_SECRET ??
    "studio-visit-fallback";
  return createHash("sha256").update(`${studioId}:${secret}`).digest("hex");
}

export function isVisitorCookieValid(studioId: string, cookieValue: string | undefined) {
  if (!cookieValue) return false;
  return cookieValue === visitorCookieValue(studioId);
}

export function visitorScopeCookieName(slug: string) {
  return `studio_scope_${slug}`;
}
