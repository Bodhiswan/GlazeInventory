"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCatalogGlazes } from "@/lib/data/inventory";
import { getCatalogGlazeById } from "@/lib/catalog";
import { requireViewer } from "@/lib/data/users";
import {
  buildAnonymizedCombinationAuthorName,
  canPublishExternalExampleIntake,
  getApprovedMatchedGlazeIds,
  resolveGlazeInput,
} from "@/lib/external-example-intakes";
import { createPairKey, parsePairKey } from "@/lib/combinations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeOptional, revalidateWorkspace, requireMemberSupabase, requireAdminSupabase } from "./_shared";

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

export async function adminArchiveCombinationAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const exampleId = formData.get("exampleId") as string | null;
  const action = formData.get("action") as string | null; // "archive" | "restore"
  if (!exampleId || !action) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from("user_combination_examples")
    .update({ status: action === "archive" ? "hidden" : "published" })
    .eq("id", exampleId);

  revalidatePath("/admin/analytics");
  revalidatePath("/combinations");
}

export async function adminEditCombinationAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const exampleId = formData.get("exampleId") as string | null;
  if (!exampleId) return;

  const title = (formData.get("title") as string | null)?.trim() || null;
  const cone = (formData.get("cone") as string | null)?.trim() || null;
  const atmosphere = (formData.get("atmosphere") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const status = (formData.get("status") as string | null)?.trim() || null;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const update: Record<string, unknown> = {};
  if (title !== null) update.title = title;
  if (cone !== null) update.cone = cone;
  if (atmosphere !== null) update.atmosphere = atmosphere;
  if (notes !== null) update.notes = notes;
  if (status !== null) update.status = status;

  if (Object.keys(update).length > 0) {
    await admin.from("user_combination_examples").update(update).eq("id", exampleId);
  }

  revalidatePath("/admin/analytics/moderation");
  revalidatePath("/admin/analytics");
  revalidatePath("/combinations");
}

export async function adminGetCombinationPreviewAction(id: string): Promise<{
  id: string;
  title: string;
  authorName: string;
  authorUserId: string;
  postFiringImageUrl: string;
  preFiringImageUrl: string | null;
  cone: string;
  atmosphere: string | null;
  glazingProcess: string | null;
  notes: string | null;
  kilnNotes: string | null;
  status: string;
  createdAt: string;
  layers: Array<{ id: string; glazeId: string; glazeName: string | null; glazeBrand: string | null; layerOrder: number }>;
} | null> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) return null;

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  type Row = Record<string, unknown>;
  const { data: row } = await admin
    .from("user_combination_examples")
    .select("*, user_combination_example_layers(*), profiles!author_user_id(display_name)")
    .eq("id", id)
    .single();

  if (!row) return null;
  const r = row as Row;
  const rawLayers = ((r.user_combination_example_layers ?? []) as Row[])
    .sort((a, b) => Number(a.layer_order) - Number(b.layer_order));

  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    authorName: r.profiles ? String((r.profiles as Row).display_name ?? "Unknown") : "Unknown",
    authorUserId: String(r.author_user_id),
    postFiringImageUrl: String(r.post_firing_image_path ?? ""),
    preFiringImageUrl: r.pre_firing_image_path ? String(r.pre_firing_image_path) : null,
    cone: String(r.cone ?? ""),
    atmosphere: r.atmosphere ? String(r.atmosphere) : null,
    glazingProcess: r.glazing_process ? String(r.glazing_process) : null,
    notes: r.notes ? String(r.notes) : null,
    kilnNotes: r.kiln_notes ? String(r.kiln_notes) : null,
    status: String(r.status ?? ""),
    createdAt: String(r.created_at),
    layers: rawLayers.map((layer) => {
      const glazeId = String(layer.glaze_id);
      const glaze = getCatalogGlazeById(glazeId);
      return {
        id: String(layer.id),
        glazeId,
        glazeName: glaze?.name ?? null,
        glazeBrand: glaze?.brand ?? null,
        layerOrder: Number(layer.layer_order),
      };
    }),
  };
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
