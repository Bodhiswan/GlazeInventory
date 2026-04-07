"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCatalogGlazes } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import {
  buildAnonymizedCombinationAuthorName,
  canPublishExternalExampleIntake,
  getApprovedMatchedGlazeIds,
  resolveGlazeInput,
} from "@/lib/external-example-intakes";
import { createPairKey, parsePairKey } from "@/lib/combinations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { awardPoints } from "@/lib/points";

const glazeCommentSchema = z.object({
  glazeId: z.string().uuid(),
  body: z.string().min(2).max(1000),
  returnTo: z.string().min(1).max(200).optional(),
});

const profilePreferencesSchema = z.object({
  displayName: z.string().min(2).max(40),
  studioName: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  preferredCone: z.string().max(40).optional(),
  preferredAtmosphere: z.string().max(40).optional(),
  restrictToPreferredExamples: z.boolean().optional(),
});

const externalExampleMatchSchema = z.object({
  mentionId: z.string().uuid(),
  intakeId: z.string().uuid(),
  matchInput: z.string().max(160).optional(),
  approved: z.boolean().optional(),
});

const externalExampleReviewNotesSchema = z.object({
  intakeId: z.string().uuid(),
  reviewNotes: z.string().max(2000).optional(),
});

const externalExampleStatusSchema = z.object({
  intakeId: z.string().uuid(),
  reviewStatus: z.enum(["queued", "approved", "rejected", "duplicate"]),
  duplicateOfIntakeId: z.string().uuid().optional(),
});

const externalExamplePublishSchema = z.object({
  intakeId: z.string().uuid(),
});

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}

function revalidateWorkspace() {
  [
    "/dashboard",
    "/inventory",
    "/glazes",
    "/inventory/new",
    "/glazes/new",
    "/combinations",
    "/community",
    "/publish",
    "/admin/moderation",
    "/admin/intake",
  ].forEach(
    (path) => revalidatePath(path),
  );
}

async function requireLiveSupabase() {
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

async function requireMemberSupabase(returnTo = "/auth/sign-in") {
  return requireLiveSupabase();
}

async function requireContributingMember(returnTo = "/contribute") {
  const context = await requireMemberSupabase(returnTo);
  if (context.viewer.profile.contributionsDisabled) {
    redirect(
      `${returnTo}?error=${encodeURIComponent(
        "Your contribution access has been disabled after repeated policy violations",
      )}`,
    );
  }
  return context;
}

async function requireAdminSupabase(returnTo = "/dashboard") {
  const context = await requireMemberSupabase(returnTo);

  if (!context.viewer.profile.isAdmin) {
    redirect(`${returnTo}?error=Studio%20admin%20access%20is%20required`);
  }

  return context;
}

function buildExternalExampleReturnPath(intakeId: string, suffix?: string) {
  const basePath = `/admin/intake/${intakeId}`;
  return suffix ? `${basePath}?${suffix}` : basePath;
}

function buildExternalExampleFiringSummary(parserOutput: unknown) {
  if (!parserOutput || typeof parserOutput !== "object") {
    return null;
  }

  const row = parserOutput as Record<string, unknown>;
  const parts = [row.extractedCone, row.extractedAtmosphere, row.extractedClayBody]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length ? parts.join(" · ") : null;
}

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

export async function moderatePostAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/dashboard");

  if (!viewer.profile.isAdmin) {
    redirect("/dashboard");
  }

  const postId = formData.get("postId")?.toString();
  const status = formData.get("status")?.toString() === "published" ? "published" : "hidden";

  if (!postId) {
    redirect("/admin/moderation?error=Missing%20post%20id");
  }

  await supabase.from("combination_posts").update({ status }).eq("id", postId);
  await supabase.from("reports").update({ status: "resolved" }).eq("post_id", postId);

  revalidateWorkspace();
  redirect("/admin/moderation?saved=1");
}

export async function updateExternalExampleGlazeMatchAction(formData: FormData) {
  const { viewer, supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExampleMatchSchema.safeParse({
    mentionId: formData.get("mentionId")?.toString(),
    intakeId: formData.get("intakeId")?.toString(),
    matchInput: normalizeOptional(formData.get("matchInput")) ?? undefined,
    approved: formData.get("approved") === "on",
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Check%20the%20glaze%20match%20before%20saving`);
  }

  const glazes = await getCatalogGlazes(viewer.profile.id);
  const matchedGlaze = parsed.data.matchInput
    ? resolveGlazeInput(glazes, parsed.data.matchInput)
    : null;
  const shouldApprove = Boolean(parsed.data.approved && matchedGlaze);

  const { error } = await supabase
    .from("external_example_glaze_mentions")
    .update({
      matched_glaze_id: matchedGlaze?.id ?? null,
      is_approved: shouldApprove,
      approved_by_user_id: shouldApprove ? viewer.profile.id : null,
      approved_at: shouldApprove ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.mentionId)
    .eq("intake_id", parsed.data.intakeId);

  if (error) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?saved=match`);
}

export async function updateExternalExampleReviewNotesAction(formData: FormData) {
  const { supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExampleReviewNotesSchema.safeParse({
    intakeId: formData.get("intakeId")?.toString(),
    reviewNotes: normalizeOptional(formData.get("reviewNotes")) ?? undefined,
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Check%20the%20review%20notes%20before%20saving`);
  }

  const { error } = await supabase
    .from("external_example_intakes")
    .update({
      review_notes: parsed.data.reviewNotes ?? null,
    })
    .eq("id", parsed.data.intakeId);

  if (error) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?saved=notes`);
}

export async function setExternalExampleIntakeStatusAction(formData: FormData) {
  const { supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExampleStatusSchema.safeParse({
    intakeId: formData.get("intakeId")?.toString(),
    reviewStatus: formData.get("reviewStatus")?.toString(),
    duplicateOfIntakeId: normalizeOptional(formData.get("duplicateOfIntakeId")) ?? undefined,
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Choose%20a%20valid%20review%20status`);
  }

  const { error } = await supabase
    .from("external_example_intakes")
    .update({
      review_status: parsed.data.reviewStatus,
      duplicate_of_intake_id:
        parsed.data.reviewStatus === "duplicate" ? parsed.data.duplicateOfIntakeId ?? null : null,
    })
    .eq("id", parsed.data.intakeId);

  if (error) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?saved=status`);
}

export async function publishExternalExampleIntakeAction(formData: FormData) {
  const { viewer, supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExamplePublishSchema.safeParse({
    intakeId: formData.get("intakeId")?.toString(),
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Missing%20intake%20record`);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    redirect(`${fallbackPath}?error=Supabase%20service%20role%20is%20required%20for%20publishing`);
  }

  const { data: intake, error: intakeError } = await supabase
    .from("external_example_intakes")
    .select("*, external_example_assets(*), external_example_glaze_mentions(*)")
    .eq("id", parsed.data.intakeId)
    .maybeSingle();

  if (intakeError || !intake) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(intakeError?.message ?? "Intake not found")}`);
  }

  const reviewStatus = String(intake.review_status ?? "queued");

  if (reviewStatus === "duplicate" || reviewStatus === "rejected" || reviewStatus === "published") {
    redirect(`${fallbackPath}?error=This%20intake%20cannot%20be%20published%20from%20its%20current%20status`);
  }

  const mentionSummaries = ((intake.external_example_glaze_mentions ?? []) as Array<Record<string, unknown>>).map((mention) => ({
    matchedGlazeId: (mention.matched_glaze_id as string | null) ?? null,
    isApproved: Boolean(mention.is_approved),
  }));
  const approvedMentionGlazeIds = getApprovedMatchedGlazeIds(mentionSummaries);

  if (
    !canPublishExternalExampleIntake(reviewStatus, mentionSummaries)
  ) {
    redirect(`${fallbackPath}?error=Exactly%20two%20approved%20glaze%20matches%20are%20required%20to%20publish`);
  }

  const primaryAsset = ((intake.external_example_assets ?? []) as Array<Record<string, unknown>>)
    .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))[0];

  if (!primaryAsset?.storage_path) {
    redirect(`${fallbackPath}?error=This%20intake%20does%20not%20have%20an%20archived%20image%20to%20publish`);
  }

  const { data: assetBlob, error: assetError } = await admin.storage
    .from("external-example-imports")
    .download(String(primaryAsset.storage_path));

  if (assetError || !assetBlob) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(assetError?.message ?? "Could not download archived image")}`);
  }

  const pairKey = createPairKey(approvedMentionGlazeIds[0]!, approvedMentionGlazeIds[1]!);
  const orderedGlazeIds = parsePairKey(pairKey);
  const uploadedPath = `${viewer.profile.id}/external-intakes/${crypto.randomUUID()}-${String(primaryAsset.storage_path).split("/").pop()}`;

  const uploadBuffer = new Uint8Array(await assetBlob.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("glaze-posts")
    .upload(uploadedPath, uploadBuffer, {
      contentType: assetBlob.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: publicData } = admin.storage.from("glaze-posts").getPublicUrl(uploadedPath);
  const { data: pairRecord, error: pairError } = await supabase
    .from("combination_pairs")
    .upsert(
      {
        glaze_a_id: orderedGlazeIds?.[0],
        glaze_b_id: orderedGlazeIds?.[1],
        pair_key: pairKey,
      },
      { onConflict: "pair_key" },
    )
    .select("id")
    .single();

  if (pairError || !pairRecord) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(pairError?.message ?? "Could not create combination pair")}`);
  }

  const { data: postRecord, error: postError } = await supabase
    .from("combination_posts")
    .insert({
      author_user_id: viewer.profile.id,
      display_author_name: buildAnonymizedCombinationAuthorName(String(intake.source_platform ?? "facebook")),
      combination_pair_id: pairRecord.id,
      image_path: publicData.publicUrl,
      caption: (intake.raw_caption as string | null) ?? null,
      application_notes: (intake.review_notes as string | null) ?? null,
      firing_notes: buildExternalExampleFiringSummary(intake.parser_output),
      visibility: "members",
      status: "published",
    })
    .select("id")
    .single();

  if (postError || !postRecord) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(postError?.message ?? "Could not publish archive post")}`);
  }

  const { error: updateError } = await supabase
    .from("external_example_intakes")
    .update({
      review_status: "published",
      published_post_id: postRecord.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.intakeId);

  if (updateError) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(updateError.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  revalidatePath(`/combinations/${pairKey}`);
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?published=1`);
}

export async function addGlazeCommentInlineAction(
  glazeId: string,
  body: string,
): Promise<{ error?: string; authorName?: string }> {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  if (viewer.profile.contributionsDisabled) {
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
  if (viewer.profile.contributionsDisabled) {
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

export async function updateProfilePreferencesAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/profile");
  const parsed = profilePreferencesSchema.safeParse({
    displayName: formData.get("displayName")?.toString().trim(),
    studioName: normalizeOptional(formData.get("studioName")) ?? undefined,
    location: normalizeOptional(formData.get("location")) ?? undefined,
    preferredCone: normalizeOptional(formData.get("preferredCone")) ?? undefined,
    preferredAtmosphere: normalizeOptional(formData.get("preferredAtmosphere")) ?? undefined,
    restrictToPreferredExamples: formData.get("restrictToPreferredExamples") === "on",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Check your profile details";
    redirect(`/profile?error=${encodeURIComponent(issue)}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      studio_name: parsed.data.studioName ?? null,
      location: parsed.data.location ?? null,
      preferred_cone: parsed.data.preferredCone ?? null,
      preferred_atmosphere: parsed.data.preferredAtmosphere ?? null,
      restrict_to_preferred_examples: Boolean(parsed.data.restrictToPreferredExamples),
    })
    .eq("id", viewer.profile.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath("/profile");
  redirect("/profile?saved=1");
}

// ─── Admin moderation ─────────────────────────────────────────────────────────

// ── Moderation queue: approve / reject / delete ─────────────────────────────

type ModTarget = "combination" | "glaze" | "firingImage";

function targetTable(target: ModTarget): string {
  switch (target) {
    case "combination": return "user_combination_examples";
    case "glaze": return "glazes";
    case "firingImage": return "community_firing_images";
  }
}

function targetAuthorColumn(target: ModTarget): string {
  switch (target) {
    case "combination": return "author_user_id";
    case "glaze": return "created_by_user_id";
    case "firingImage": return "uploader_user_id";
  }
}

export async function adminApproveSubmissionAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const target = formData.get("target") as ModTarget | null;
  const id = formData.get("id") as string | null;
  if (!target || !id) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from(targetTable(target))
    .update({ moderation_state: "approved" })
    .eq("id", id);

  revalidatePath("/admin/analytics/moderation");
  revalidatePath("/admin/analytics");
  revalidatePath("/combinations");
}

export async function adminRejectSubmissionAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const target = formData.get("target") as ModTarget | null;
  const id = formData.get("id") as string | null;
  if (!target || !id) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from(targetTable(target))
    .update({ moderation_state: "rejected" })
    .eq("id", id);

  // Auto-flag as false contribution on reject (voids points, +1 strike)
  const { data: row } = await admin
    .from(targetTable(target))
    .select(targetAuthorColumn(target))
    .eq("id", id)
    .single();
  const authorUserId = (row as Record<string, unknown> | null)?.[
    targetAuthorColumn(target)
  ];
  if (authorUserId) {
    await adminFlagFalseContributionAction({
      referenceId: id,
      authorUserId: String(authorUserId),
    });
  }

  revalidatePath("/admin/analytics/moderation");
  revalidatePath("/admin/analytics");
  revalidatePath("/combinations");
}

export async function adminReopenSubmissionAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const target = formData.get("target") as ModTarget | null;
  const id = formData.get("id") as string | null;
  if (!target || !id) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from(targetTable(target))
    .update({ moderation_state: "pending" })
    .eq("id", id);

  revalidatePath("/admin/analytics/moderation");
  revalidatePath("/admin/analytics");
  revalidatePath("/combinations");
}

export async function adminPermanentDeleteSubmissionAction(
  formData: FormData,
): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const target = formData.get("target") as ModTarget | null;
  const id = formData.get("id") as string | null;
  if (!target || !id) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  // Only allow permanent delete of rejected items
  const { data: row } = await admin
    .from(targetTable(target))
    .select("moderation_state")
    .eq("id", id)
    .single();
  if ((row as Record<string, unknown> | null)?.moderation_state !== "rejected") return;

  await admin.from(targetTable(target)).delete().eq("id", id);

  revalidatePath("/admin/analytics/moderation");
  revalidatePath("/admin/analytics");
}

export async function adminDeleteCustomGlazeAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const glazeId = formData.get("glazeId") as string | null;
  if (!glazeId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  // Safety check — only delete custom glazes
  const { data: glaze } = await admin
    .from("glazes")
    .select("source_type")
    .eq("id", glazeId)
    .single();

  if (!glaze || (glaze as Record<string, unknown>).source_type !== "nonCommercial") return;

  await admin.from("glazes").delete().eq("id", glazeId);

  revalidatePath("/admin/analytics");
}

export async function adminEditCustomGlazeAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const glazeId = formData.get("glazeId") as string | null;
  if (!glazeId) return;

  const name = (formData.get("name") as string | null)?.trim() || null;
  const brand = (formData.get("brand") as string | null)?.trim() || null;
  const code = (formData.get("code") as string | null)?.trim() || null;
  const colorNotes = (formData.get("colorNotes") as string | null)?.trim() || null;
  const finishNotes = (formData.get("finishNotes") as string | null)?.trim() || null;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  // Safety: only edit non-commercial glazes
  const { data: glaze } = await admin
    .from("glazes")
    .select("source_type")
    .eq("id", glazeId)
    .single();
  if (!glaze || (glaze as Record<string, unknown>).source_type !== "nonCommercial") return;

  const update: Record<string, unknown> = {};
  if (name !== null) update.name = name;
  if (brand !== null) update.brand = brand;
  if (code !== null) update.code = code;
  if (colorNotes !== null) update.color_notes = colorNotes;
  if (finishNotes !== null) update.finish_notes = finishNotes;

  if (Object.keys(update).length > 0) {
    await admin.from("glazes").update(update).eq("id", glazeId);
  }

  revalidatePath("/admin/analytics/moderation");
  revalidatePath("/admin/analytics");
}

export async function adminEditCommunityFiringImageAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const imageId = formData.get("imageId") as string | null;
  if (!imageId) return;

  const label = (formData.get("label") as string | null)?.trim() || null;
  const cone = (formData.get("cone") as string | null)?.trim() || null;
  const atmosphere = (formData.get("atmosphere") as string | null)?.trim() || null;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const update: Record<string, unknown> = {};
  if (label !== null) update.label = label;
  if (cone !== null) update.cone = cone;
  if (atmosphere !== null) update.atmosphere = atmosphere;

  if (Object.keys(update).length > 0) {
    await admin.from("community_firing_images").update(update).eq("id", imageId);
  }

  revalidatePath("/admin/analytics/moderation");
}

export async function adminDeleteCommunityFiringImageAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const imageId = formData.get("imageId") as string | null;
  if (!imageId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin.from("community_firing_images").delete().eq("id", imageId);

  revalidatePath("/admin/analytics/moderation");
}

export async function adminFlagFalseContributionAction(input: {
  referenceId: string;
  authorUserId: string;
}): Promise<{ error?: string; success?: true }> {
  await requireAdminSupabase();

  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Admin client unavailable" };

  if (!input.authorUserId) {
    return { error: "No author user ID provided" };
  }

  // 1. Find un-voided ledger rows for this reference
  const { data: rows } = await admin
    .from("points_ledger")
    .select("id, points")
    .eq("reference_id", input.referenceId)
    .eq("voided", false);

  const pointsToDeduct = (rows ?? []).reduce((sum, r) => sum + Number(r.points), 0);

  // 2. Void those rows
  if (rows && rows.length > 0) {
    await admin
      .from("points_ledger")
      .update({ voided: true })
      .eq("reference_id", input.referenceId)
      .eq("voided", false);
  }

  // 3. Load current profile state
  const { data: profile } = await admin
    .from("profiles")
    .select("points, contribution_strikes")
    .eq("id", input.authorUserId)
    .single();

  const newPoints = Math.max(0, (profile?.points ?? 0) - pointsToDeduct);
  const newStrikes = (profile?.contribution_strikes ?? 0) + 1;
  const shouldDisable = newStrikes >= 3;

  // 4. Apply strike + points deduction
  await admin
    .from("profiles")
    .update({
      points: newPoints,
      contribution_strikes: newStrikes,
      ...(shouldDisable ? { contributions_disabled: true } : {}),
    })
    .eq("id", input.authorUserId);

  revalidatePath("/admin/analytics");
  return { success: true };
}

export async function uploadCommunityFiringImageAction(formData: FormData): Promise<{ error: string } | { success: true }> {
  const { viewer, supabase } = await requireContributingMember("/contribute/firing-image");

  const imageFile = formData.get("image");
  if (!(imageFile instanceof File) || imageFile.size === 0) return { error: "No image provided" };
  if (imageFile.size > 8 * 1024 * 1024) return { error: "Image must be under 8 MB" };

  const glazeId = (formData.get("glazeId") as string | null) || null;
  const combinationId = (formData.get("combinationId") as string | null) || null;
  const combinationType = (formData.get("combinationType") as string | null) || null;
  const label = (formData.get("label") as string | null)?.trim() || null;
  const cone = (formData.get("cone") as string | null)?.trim() || null;
  const atmosphere = (formData.get("atmosphere") as string | null)?.trim() || null;

  if (!glazeId && !combinationId) return { error: "Select a glaze or combination first" };

  const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9.-]/g, "-");
  const storagePath = `${viewer.profile.id}/${crypto.randomUUID()}-${sanitize(imageFile.name)}`;
  const buffer = new Uint8Array(await imageFile.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from("community-firing-images")
    .upload(storagePath, buffer, { contentType: imageFile.type, upsert: false });

  if (uploadErr) return { error: uploadErr.message };

  const { data: publicData } = supabase.storage.from("community-firing-images").getPublicUrl(storagePath);

  const { data: insertedImage, error: insertErr } = await supabase.from("community_firing_images").insert({
    glaze_id: glazeId || null,
    combination_id: combinationId || null,
    combination_type: combinationId ? combinationType : null,
    image_url: publicData.publicUrl,
    storage_path: storagePath,
    label,
    cone,
    atmosphere,
    uploader_user_id: viewer.profile.id,
  }).select("id").single();

  if (insertErr) return { error: insertErr.message };

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "firing_photo_uploaded",
    2,
    insertedImage?.id,
    "community_image",
  );

  return { success: true };
}

// ── Direct messages ────────────────────────────────────────────────────────

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
