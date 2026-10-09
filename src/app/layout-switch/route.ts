import { NextResponse, type NextRequest } from "next/server";

import { LAYOUT_COOKIE } from "@/lib/layout-mode";

/** Footer links: `/layout-switch?to=classic&next=/glazes`, or `?to=new` to come back. */
export function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") === "classic" ? "classic" : "new";
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  // Same-site paths only, never "//host" or absolute URLs.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const response = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.set(LAYOUT_COOKIE, to, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}
