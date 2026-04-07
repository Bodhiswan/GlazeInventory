"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/env";
import { revalidateWorkspace, requireLiveSupabase } from "./_shared";

const magicLinkSchema = z.object({
  email: z.email(),
});

const passwordSignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

const passwordSignUpSchema = z
  .object({
    displayName: z.string().min(2).max(40),
    email: z.email(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const passwordResetRequestSchema = z.object({
  email: z.email(),
});

const passwordResetSchema = z
  .object({
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate") && lower.includes("limit") || lower.includes("too many") || lower.includes("exceeded")) {
    return "Too many attempts — please wait a minute and try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Check your inbox for a confirmation email before signing in.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  return message;
}

export async function sendMagicLinkAction(formData: FormData) {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email")?.toString().trim(),
  });

  if (!parsed.success) {
    redirect("/auth/sign-in?error=Enter%20a%20valid%20email");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }

  redirect("/auth/sign-in?sent=1");
}

export async function signInWithPasswordAction(formData: FormData) {
  const returnTo = formData.get("returnTo")?.toString().trim() || null;
  const safeReturnTo = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";

  const parsed = passwordSignInSchema.safeParse({
    email: formData.get("email")?.toString().trim(),
    password: formData.get("password")?.toString(),
  });

  if (!parsed.success) {
    const errorUrl = returnTo
      ? `/auth/sign-in?error=Enter%20your%20email%20and%20password&redirectTo=${encodeURIComponent(returnTo)}`
      : "/auth/sign-in?error=Enter%20your%20email%20and%20password";
    redirect(errorUrl);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const msg = friendlyAuthError(error.message);
    const errorUrl = returnTo
      ? `/auth/sign-in?error=${encodeURIComponent(msg)}&redirectTo=${encodeURIComponent(returnTo)}`
      : `/auth/sign-in?error=${encodeURIComponent(msg)}`;
    redirect(errorUrl);
  }

  redirect(safeReturnTo);
}

export async function signUpWithPasswordAction(formData: FormData) {
  const parsed = passwordSignUpSchema.safeParse({
    displayName: formData.get("displayName")?.toString().trim(),
    email: formData.get("email")?.toString().trim(),
    password: formData.get("password")?.toString(),
    confirmPassword: formData.get("confirmPassword")?.toString(),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Check your account details";
    redirect(`/auth/sign-in?error=${encodeURIComponent(firstIssue)}`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }

  redirect("/auth/sign-in?registered=1");
}

export async function signOutAction() {
  const cookieStore = await (await import("next/headers")).cookies();
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }

  // Explicitly clear all Supabase auth cookies in case signOut didn't propagate
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }

  redirect("/");
}

export async function sendPasswordResetAction(formData: FormData) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email")?.toString().trim(),
  });

  if (!parsed.success) {
    redirect("/auth/forgot-password?error=Enter%20a%20valid%20email");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/forgot-password?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
  });

  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }

  redirect("/auth/forgot-password?sent=1");
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = passwordResetSchema.safeParse({
    password: formData.get("password")?.toString(),
    confirmPassword: formData.get("confirmPassword")?.toString(),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Check your new password";
    redirect(`/auth/reset-password?error=${encodeURIComponent(issue)}`);
  }

  const { supabase } = await requireLiveSupabase();

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  redirect("/auth/sign-in?passwordReset=1");
}
