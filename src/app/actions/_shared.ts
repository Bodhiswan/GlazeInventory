import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}

export function revalidateWorkspace() {
  [
    "/dashboard",
    "/inventory",
    "/glazes",
    "/inventory/new",
    "/combinations",
    "/community",
    "/contribute",
    "/admin/moderation",
    "/admin/intake",
  ].forEach(
    (path) => revalidatePath(path),
  );
}

export async function requireLiveSupabase() {
  const viewer = await requireViewer();

  if (viewer.mode === "demo") {
    redirect("/dashboard?demo=readonly");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  return { viewer, supabase };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireMemberSupabase(_returnTo = "/auth/sign-in") {
  return requireLiveSupabase();
}

export async function requireContributingMember(returnTo = "/contribute") {
  const context = await requireMemberSupabase();
  if (context.viewer.profile.contributionsDisabled && !context.viewer.profile.isAdmin) {
    redirect(
      `${returnTo}?error=${encodeURIComponent(
        "Your contribution access has been disabled after repeated policy violations",
      )}`,
    );
  }
  return context;
}

export async function requireAdminSupabase(returnTo = "/dashboard") {
  const context = await requireMemberSupabase();

  if (!context.viewer.profile.isAdmin) {
    redirect(`${returnTo}?error=Studio%20admin%20access%20is%20required`);
  }

  return context;
}
