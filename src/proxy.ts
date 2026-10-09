import { NextResponse, type NextRequest } from "next/server";

import { LAYOUT_COOKIE, layoutModeFromCookie, routeForLayout } from "@/lib/layout-mode";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const mode = layoutModeFromCookie(request.cookies.get(LAYOUT_COOKIE)?.value);
  const route = routeForLayout(request.nextUrl.pathname, mode);

  if (route?.type === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = route.pathname;
    if (route.search !== undefined) url.search = route.search;
    return NextResponse.redirect(url);
  }

  if (route?.type === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = route.pathname;
    return updateSession(request, url);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
