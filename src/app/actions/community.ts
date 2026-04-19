"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { requireViewer } from "@/lib/data/users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/points";
import { normalizeOptional, revalidateWorkspace, requireMemberSupabase, requireContributingMember } from "./_shared";

export async function reportPostAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/community");
  const postId = formData.get("postId")?.toString();
  const reason = normalizeOptional(formData.get("reason"));
  const pairKey = formData.get("pairKey")?.toString() ?? "";

  if (!postId || !reason) {
    redirect(`/community?error=Add%20a%20reason%20when%20reporting%20a%20post`);
  }

  const { error } = await supabase.from("reports").insert({
    post_id: postId,
    reported_by_user_id: viewer.profile.id,
    reason,
    status: "open",
  });

  if (!error) {
    await supabase
      .from("combination_posts")
      .update({ status: "reported" })
      .eq("id", postId)
      .eq("status", "published");
  }

  revalidateWorkspace();
  redirect(pairKey ? `/combinations/${pairKey}?reported=1` : "/community?reported=1");
}

export async function addGlazeCommentInlineAction(
  glazeId: string,
  body: string,
): Promise<{ error?: string; authorName?: string }> {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  if (viewer.profile.contributionsDisabled && !viewer.profile.isAdmin) {
    return { error: "Your contribution access has been disabled" };
  }
  const trimmed = body.trim();
  if (trimmed.length < 2) return { error: "Comment must be at least 2 characters." };
  if (trimmed.length > 1000) return { error: "Comment must be under 1000 characters." };

  const { error } = await supabase.from("glaze_comments").insert({
    glaze_id: glazeId,
    author_user_id: viewer.profile.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "comment_left",
    0.1,
    undefined,
    "comment",
  );

  revalidateWorkspace();
  return { authorName: viewer.profile.displayName };
}

export async function addCombinationCommentInlineAction(
  exampleId: string,
  body: string,
): Promise<{ error?: string; authorName?: string }> {
  const { viewer, supabase } = await requireMemberSupabase("/combinations");
  if (viewer.profile.contributionsDisabled && !viewer.profile.isAdmin) {
    return { error: "Your contribution access has been disabled" };
  }
  const trimmed = body.trim();
  if (trimmed.length < 2) return { error: "Comment must be at least 2 characters." };
  if (trimmed.length > 1000) return { error: "Comment must be under 1000 characters." };

  const { error } = await supabase.from("combination_comments").insert({
    example_id: exampleId,
    author_user_id: viewer.profile.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "comment_left",
    0.1,
    undefined,
    "comment",
  );

  revalidateWorkspace();
  return { authorName: viewer.profile.displayName };
}

const glazeCommentSchema = z.object({
  glazeId: z.string().uuid(),
  body: z.string().min(2).max(1000),
  returnTo: z.string().min(1).max(200).optional(),
});

export async function addGlazeCommentAction(formData: FormData) {
  const { viewer, supabase } = await requireContributingMember("/glazes");
  const parsed = glazeCommentSchema.safeParse({
    glazeId: formData.get("glazeId"),
    body: formData.get("body")?.toString().trim(),
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/glazes" : "/glazes";

  if (!parsed.success) {
    redirect(`${returnTo}?error=Write%20a%20short%20comment%20before%20posting`);
  }

  const { error } = await supabase.from("glaze_comments").insert({
    glaze_id: parsed.data.glazeId,
    author_user_id: viewer.profile.id,
    body: parsed.data.body,
  });

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "comment_left",
    0.1,
    undefined,
    "comment",
  );

  revalidateWorkspace();
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function sendDirectMessageAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  const recipientUserId = (formData.get("recipientUserId") as string | null)?.trim();
  const recipientName = (formData.get("recipientName") as string | null)?.trim();
  const body = (formData.get("body") as string | null)?.trim();
  if (!body || body.length > 4000) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  let targetUserId = recipientUserId || null;
  if (!targetUserId && recipientName) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .ilike("display_name", recipientName)
      .limit(1)
      .maybeSingle();
    targetUserId = data ? String((data as Record<string, unknown>).id) : null;
  }
  if (!targetUserId || targetUserId === viewer.profile.id) return;

  // Non-admins may only message admins.
  if (!viewer.profile.isAdmin) {
    const { data: recipientProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", targetUserId)
      .maybeSingle();
    if (!recipientProfile || !(recipientProfile as Record<string, unknown>).is_admin) {
      return;
    }
  }

  await admin.from("direct_messages").insert({
    sender_user_id: viewer.profile.id,
    recipient_user_id: targetUserId,
    body,
  });

  revalidatePath("/profile");
}

export async function markAllDirectMessagesReadAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  const fromUserId = (formData.get("fromUserId") as string | null)?.trim() || null;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  let query = admin
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", viewer.profile.id)
    .is("read_at", null);
  if (fromUserId) query = query.eq("sender_user_id", fromUserId);
  await query;

  revalidatePath("/profile");
}

export async function markDirectMessageReadAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  const messageId = (formData.get("messageId") as string | null)?.trim();
  if (!messageId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("recipient_user_id", viewer.profile.id)
    .is("read_at", null);

  revalidatePath("/profile");
}
