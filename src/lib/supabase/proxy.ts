import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/env";

/**
 * Refreshes the Supabase session. When `rewriteTo` is set, the request is served
 * from that internal route (the Cone 6 layout) while keeping the public URL.
 */
export async function updateSession(request: NextRequest, rewriteTo?: URL) {
  const env = getSupabaseEnv();
  const continueRequest = () => {
    const headers = new Headers(request.headers);
    headers.set("x-next-pathname", request.nextUrl.pathname);
    headers.set("x-next-return-to", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return rewriteTo
      ? NextResponse.rewrite(rewriteTo, { request: { headers } })
      : NextResponse.next({ request: { headers } });
  };

  if (!env) {
    return continueRequest();
  }

  let response = continueRequest();

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = continueRequest();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
