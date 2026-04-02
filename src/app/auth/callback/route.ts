import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (authError) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(authError)}`, request.url),
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? { error: null };

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }
  }

  const safeNext = next && next.startsWith("/") ? next : "/dashboard";

  return NextResponse.redirect(new URL(safeNext, request.url));
}
