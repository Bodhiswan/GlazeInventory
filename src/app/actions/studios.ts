"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";

import { requireMemberSupabase } from "./_shared";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStudioBySlug, getStudioForOwner } from "@/lib/data/studios";
import {
  hashPasscode,
  verifyPasscode,
  visitorCookieName,
  visitorCookieValue,
  visitorScopeCookieName,
} from "@/lib/studio-auth";

// ─── Slug rules ─────────────────────────────────────────────────────────────
const RESERVED_SLUGS = new Set([
  "admin","api","auth","studio","studios","new","app","www","root","help",
  "about","contact","privacy","terms","tos","login","logout","signup","register",
  "dashboard","profile","inventory","glazes","combinations","community",
  "publish","contribute","billing","support","static","public","_next",
  // big brand names
  "amaco","mayco","coyote","spectrum","laguna","duncan","speedball",
  "glazy","northcote","seattle","sps","clayking","gleco","standardceramic",
]);

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Studio name must be at least 3 characters")
  .max(16, "Studio name must be 16 characters or fewer")
  .regex(/^[a-z0-9][a-z0-9-]{1,15}$/, "Use lowercase letters, numbers, and dashes only");

const passcodeSchema = z.string().regex(/^\d{4}$/, "Passcode must be 4 digits");

import { slugifyStudioName } from "@/lib/studio-slug";

// ─── Owner: create / rename / set passcode ─────────────────────────────────
const firingRangeSchema = z.enum(["lowfire", "midfire", "both"]);
const upsertSchema = z.object({
  studioName: z.string().trim().min(1, "Studio name is required").max(80).optional(),
  passcode: passcodeSchema.optional(),
  firingRange: firingRangeSchema.optional(),
});

function isRedirect(err: unknown): boolean {
  return Boolean(
    err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT"),
  );
}

export async function createOrUpdateStudioAction(formData: FormData) {
  try {
    const { viewer, supabase } = await requireMemberSupabase("/profile");

    const existing = await getStudioForOwner(viewer.profile.id);

    const parsed = upsertSchema.safeParse({
      studioName: formData.get("studioName")?.toString() || undefined,
      passcode: formData.get("passcode")?.toString() || undefined,
      firingRange: formData.get("firingRange")?.toString() || undefined,
    });
  if (!parsed.success) {
    redirect(`/profile?tab=studio&error=${encodeURIComponent(parsed.error.issues[0]!.message)}`);
  }

  // Use studio name from form (creation) or fall back to existing display name.
  const studioName = parsed.data.studioName ?? existing?.displayName ?? "";
  if (!studioName) {
    redirect(
      `/profile?tab=studio&error=${encodeURIComponent(
        "Enter a studio name",
      )}`,
    );
  }
  const slugCandidate = slugifyStudioName(studioName);
  const slugCheck = slugSchema.safeParse(slugCandidate);
  if (!slugCheck.success) {
    redirect(
      `/profile?tab=studio&error=${encodeURIComponent(
        "Your studio name needs to be 3–16 characters of letters, numbers, or spaces",
      )}`,
    );
  }
  const slug = slugCheck.data;

  if (RESERVED_SLUGS.has(slug)) {
    redirect(
      `/profile?tab=studio&error=${encodeURIComponent("That name is reserved — pick another")}`,
    );
  }

  // Check slug availability
  const conflict = await getStudioBySlug(slug);

  if (conflict && (!existing || conflict.id !== existing.id)) {
    redirect(
      `/profile?tab=studio&error=${encodeURIComponent("That studio name is already taken")}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  if (!existing) {
    if (!parsed.data.passcode) {
      redirect(
        `/profile?tab=studio&error=${encodeURIComponent("Set a 4-digit passcode for visitors")}`,
      );
    }
    if (!parsed.data.firingRange) {
      redirect(
        `/profile?tab=studio&error=${encodeURIComponent(
          "Pick which firing range your studio uses (cone 06, cone 6, or both)",
        )}`,
      );
    }
    // Save studio name to profile so it persists there too.
    await sb
      .from("profiles")
      .update({ studio_name: studioName })
      .eq("id", viewer.profile.id);

    const { error } = await sb
      .from("studios")
      .insert({
        owner_user_id: viewer.profile.id,
        slug,
        display_name: studioName,
        passcode: parsed.data.passcode!,
        passcode_hash: hashPasscode(parsed.data.passcode!),
        firing_range: parsed.data.firingRange!,
      });
    if (error) {
      redirect(`/profile?tab=studio&error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      display_name: studioName,
    };
    let renaming = false;
    if (slug !== existing.slug) {
      if (existing.renameCount >= 3) {
        redirect(
          `/profile?tab=studio&error=${encodeURIComponent(
            "You've used all 3 renames — message support to change it",
          )}`,
        );
      }
      renaming = true;
      updates.slug = slug;
      updates.rename_count = existing.renameCount + 1;
    }
    if (parsed.data.passcode) {
      updates.passcode = parsed.data.passcode;
      updates.passcode_hash = hashPasscode(parsed.data.passcode);
    }
    if (parsed.data.firingRange) {
      updates.firing_range = parsed.data.firingRange;
    }
    if (renaming) {
      await sb
        .from("studio_slug_history")
        .insert({ studio_id: existing.id, slug: existing.slug });
    }
    const { error } = await sb.from("studios").update(updates).eq("id", existing.id);
    if (error) {
      redirect(`/profile?tab=studio&error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/profile");
  revalidatePath(`/studio/${slug}`);
  redirect(`/profile?tab=studio&saved=1`);
  } catch (err) {
    if (isRedirect(err)) throw err;
    const message = err instanceof Error ? err.message : "Could not save studio settings";
    redirect(`/profile?tab=studio&error=${encodeURIComponent(message)}`);
  }
}

export async function deleteStudioAction() {
  const { viewer, supabase } = await requireMemberSupabase("/profile");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  await sb.from("studios").delete().eq("owner_user_id", viewer.profile.id);
  revalidatePath("/profile");
  redirect(`/profile?tab=studio&saved=1`);
}

// ─── Owner: toggle which inventory items are shared with the studio page ──
export async function setStudioSharedItemsAction(formData: FormData) {
  let redirectTarget = "/profile?tab=studio&saved=1";
  try {
    const { viewer, supabase } = await requireMemberSupabase("/profile");
    const sharedIds = new Set(formData.getAll("shared").map((v) => String(v)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: ownedRows, error: selectErr } = await sb
      .from("inventory_items")
      .select("id")
      .eq("user_id", viewer.profile.id)
      .eq("status", "owned");
    if (selectErr) throw selectErr;
    const ownedIds = ((ownedRows ?? []) as { id: string }[]).map((r) => r.id);

    const toShare = ownedIds.filter((id) => sharedIds.has(id));
    const toUnshare = ownedIds.filter((id) => !sharedIds.has(id));

    if (toShare.length) {
      const { error } = await sb
        .from("inventory_items")
        .update({ shared_with_studio: true })
        .in("id", toShare);
      if (error) throw error;
    }
    if (toUnshare.length) {
      const { error } = await sb
        .from("inventory_items")
        .update({ shared_with_studio: false })
        .in("id", toUnshare);
      if (error) throw error;
    }

    const studio = await getStudioForOwner(viewer.profile.id);
    if (studio) revalidatePath(`/studio/${studio.slug}`);
    revalidatePath("/profile");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save shared glazes";
    redirectTarget = `/profile?tab=studio&error=${encodeURIComponent(message)}`;
  }
  redirect(redirectTarget);
}

// ─── Visitor: passcode gate ────────────────────────────────────────────────
const visitorSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, "Enter your first name").max(80),
  passcode: passcodeSchema,
  scope: z.enum(["lowfire", "midfire"]).optional(),
});

export async function studioVisitorGateAction(formData: FormData) {
  const slugRaw = formData.get("slug")?.toString() ?? "";
  const parsed = visitorSchema.safeParse({
    slug: slugRaw,
    name: formData.get("name")?.toString() ?? "",
    passcode: formData.get("passcode")?.toString() ?? "",
    scope: formData.get("scope")?.toString() || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/studio/${slugRaw}?error=${encodeURIComponent(parsed.error.issues[0]!.message)}`,
    );
  }

  const studio = await getStudioBySlug(parsed.data.slug);
  if (!studio) {
    redirect(`/studio/${parsed.data.slug}?error=${encodeURIComponent("Studio not found")}`);
  }
  if (!verifyPasscode(parsed.data.passcode, studio.passcodeHash)) {
    redirect(`/studio/${parsed.data.slug}?error=${encodeURIComponent("Wrong passcode")}`);
  }

  // Log the visit using the service role (anon visitors can't write directly).
  const admin = createSupabaseAdminClient();
  if (admin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("studio_visitor_logs").insert({
      studio_id: studio.id,
      visitor_name: parsed.data.name,
      visitor_contact: "",
    });
  }

  // Determine the per-session firing scope.
  // - Studios fixed to lowfire/midfire always use that scope.
  // - "Both" studios require the visitor to choose at sign-in.
  let scope: "lowfire" | "midfire" | null = null;
  if (studio.firingRange === "lowfire" || studio.firingRange === "midfire") {
    scope = studio.firingRange;
  } else {
    if (!parsed.data.scope) {
      redirect(
        `/studio/${parsed.data.slug}?error=${encodeURIComponent(
          "Pick whether you're painting earthenware or midfire today",
        )}`,
      );
    }
    scope = parsed.data.scope!;
  }

  const cookieStore = await cookies();
  // Session cookies (no maxAge / expires) — closing the browser ends the visit.
  cookieStore.set(visitorCookieName(studio.slug), visitorCookieValue(studio.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/studio/${studio.slug}`,
  });
  cookieStore.set(visitorScopeCookieName(studio.slug), scope, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/studio/${studio.slug}`,
  });

  redirect(`/studio/${studio.slug}/library`);
}

const scopeSwitchSchema = z.object({
  slug: slugSchema,
  scope: z.enum(["lowfire", "midfire"]),
});

export async function setStudioScopeAction(formData: FormData) {
  const parsed = scopeSwitchSchema.safeParse({
    slug: formData.get("slug")?.toString() ?? "",
    scope: formData.get("scope")?.toString() ?? "",
  });
  if (!parsed.success) return;
  const cookieStore = await cookies();
  cookieStore.set(visitorScopeCookieName(parsed.data.slug), parsed.data.scope, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/studio/${parsed.data.slug}`,
  });
  revalidatePath(`/studio/${parsed.data.slug}`, "layout");
}
