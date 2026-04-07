import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { demoProfiles } from "@/lib/demo-data";
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile, Viewer } from "@/lib/types";

type Row = Record<string, unknown>;

const demoViewer: Viewer = {
  mode: "demo",
  profile: demoProfiles[0],
};

const publicGuestViewer: Viewer = {
  mode: "live",
  profile: {
    id: "public-guest-viewer",
    displayName: "Guest Potter",
    isAnonymous: true,
    isAdmin: false,
  },
};

async function getSupabase() {
  if (!getSupabaseEnv()) {
    return null;
  }

  return createSupabaseServerClient();
}

function mapProfile(row: Row, fallback?: Partial<UserProfile>): UserProfile {
  return {
    id: String(row.id ?? fallback?.id ?? ""),
    email: (row.email as string | null) ?? fallback?.email ?? null,
    displayName:
      (row.display_name as string | null) ??
      fallback?.displayName ??
      fallback?.email?.split("@")[0] ??
      "Glaze member",
    avatarUrl: (row.avatar_url as string | null) ?? fallback?.avatarUrl ?? null,
    studioName: (row.studio_name as string | null) ?? fallback?.studioName ?? null,
    location: (row.location as string | null) ?? fallback?.location ?? null,
    isAdmin: Boolean(row.is_admin ?? fallback?.isAdmin),
    isAnonymous: Boolean(row.is_anonymous ?? fallback?.isAnonymous),
    preferredCone: (row.preferred_cone as string | null) ?? fallback?.preferredCone ?? null,
    preferredAtmosphere:
      (row.preferred_atmosphere as string | null) ?? fallback?.preferredAtmosphere ?? null,
    restrictToPreferredExamples: Boolean(
      row.restrict_to_preferred_examples ?? fallback?.restrictToPreferredExamples,
    ),
    points: typeof row.points === "number" ? row.points : 0,
    contributionStrikes: typeof row.contribution_strikes === "number" ? row.contribution_strikes : 0,
    contributionsDisabled: Boolean(row.contributions_disabled ?? false),
  };
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await getSupabase();

  if (!supabase) {
    return demoViewer;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return {
    mode: "live",
    profile: mapProfile((profileRow ?? {}) as Row, {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata.display_name ?? user.email?.split("@")[0] ?? "Glaze member",
      isAnonymous: Boolean((user as { is_anonymous?: boolean }).is_anonymous),
    }),
  };
});

export function getPublicGuestViewer(): Viewer {
  return publicGuestViewer;
}

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer) {
    let signInUrl = "/auth/sign-in";

    try {
      const headerList = await headers();
      const pathname = headerList.get("x-next-pathname") ?? headerList.get("x-invoke-path");

      if (pathname && pathname !== "/" && pathname !== "/auth/sign-in") {
        signInUrl = `/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`;
      }
    } catch {
      /* headers unavailable outside request context */
    }

    redirect(signInUrl);
  }

  return viewer;
}

export async function getAdminUsers(): Promise<
  { id: string; displayName: string }[]
> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("is_admin", true)
    .order("display_name", { ascending: true });
  type Row = Record<string, unknown>;
  return (data ?? []).map((r) => ({
    id: String((r as Row).id),
    displayName: String((r as Row).display_name ?? "Admin"),
  }));
}

export async function lookupUserIdByDisplayName(
  name: string,
): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("display_name", name.trim())
    .limit(1)
    .maybeSingle();
  return data ? String((data as Record<string, unknown>).id) : null;
}
