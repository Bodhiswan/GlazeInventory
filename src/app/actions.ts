"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAllCatalogGlazes, getCatalogGlazeById } from "@/lib/catalog";
import { getCatalogGlazes } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { setGlazeInventoryStateAction } from "@/app/actions/inventory";
import {
  buildAnonymizedCombinationAuthorName,
  canPublishExternalExampleIntake,
  getApprovedMatchedGlazeIds,
  resolveGlazeInput,
} from "@/lib/external-example-intakes";
import { createPairKey, parsePairKey } from "@/lib/combinations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatGlazeLabel } from "@/lib/utils";
import { awardPoints } from "@/lib/points";

const glazeTagVoteSchema = z.object({
  glazeId: z.string().uuid(),
  tagSlug: z.string().min(2).max(80),
  returnTo: z.string().min(1).max(200).optional(),
});

const glazeCommentSchema = z.object({
  glazeId: z.string().uuid(),
  body: z.string().min(2).max(1000),
  returnTo: z.string().min(1).max(200).optional(),
});

const glazeFavouriteSchema = z.object({
  glazeId: z.string().uuid(),
  returnTo: z.string().min(1).max(200).optional(),
});

const glazeDescriptionEditorSchema = z.object({
  glazeId: z.string().uuid(),
  editorialSummary: z.string().max(600).optional(),
  editorialSurface: z.string().max(280).optional(),
  editorialApplication: z.string().max(500).optional(),
  editorialFiring: z.string().max(280).optional(),
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

export async function toggleOwnedGlazeAction(input: { glazeId: string; owned: boolean }) {
  const result = await setGlazeInventoryStateAction({
    glazeId: input.glazeId,
    status: input.owned ? "owned" : "none",
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    owned: result.status === "owned",
  };
}

export async function publishUserCombinationAction(formData: FormData) {
  const { viewer, supabase } = await requireContributingMember("/publish");

  // --- Parse layer glaze IDs (up to 4) ---
  const layerGlazeIds: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const glazeId = formData.get(`layer${i}GlazeId`)?.toString()?.trim();
    if (glazeId) layerGlazeIds.push(glazeId);
  }

  if (layerGlazeIds.length < 2) {
    redirect("/publish?error=Add%20at%20least%20two%20glaze%20layers%20before%20publishing");
  }

  // Validate glaze IDs: catalog glazes use static JSON IDs, custom glazes use DB IDs.
  // The layer table FK was dropped (see migration 20260407120000) because the DB assigns
  // different UUIDs to catalog glazes than the static JSON IDs used as identifiers.
  const allCatalogGlazes = getAllCatalogGlazes();
  const catalogGlazeMap = new Map(allCatalogGlazes.map((g) => [g.id, g]));

  const customGlazeIds = layerGlazeIds.filter((id) => !catalogGlazeMap.has(id));
  const customGlazeLabelMap = new Map<string, string>();

  if (customGlazeIds.length > 0) {
    const { data: dbCustomGlazes } = await supabase
      .from("glazes")
      .select("id, name, brand, source_type, created_by_user_id")
      .in("id", customGlazeIds);
    const dbCustomMap = new Map((dbCustomGlazes ?? []).map((g) => [g.id as string, g]));
    for (const glazeId of customGlazeIds) {
      const dbGlaze = dbCustomMap.get(glazeId);
      if (!dbGlaze || dbGlaze.source_type !== "nonCommercial" || dbGlaze.created_by_user_id !== viewer.profile.id) {
        redirect("/publish?error=One%20or%20more%20selected%20glazes%20could%20not%20be%20found");
      }
      customGlazeLabelMap.set(
        glazeId,
        [dbGlaze.brand, dbGlaze.name].filter(Boolean).join(" ") || String(dbGlaze.name),
      );
    }
  }

  // --- Cone ---
  const coneValue = formData.get("coneValue")?.toString() ?? "";
  const validConeValues = new Set(["Cone 06", "Cone 6", "Cone 10"]);
  if (!validConeValues.has(coneValue)) {
    redirect("/publish?error=Choose%20Cone%2006,%20Cone%206,%20or%20Cone%2010%20before%20publishing");
  }

  // --- Post-firing image (required) ---
  const postFiringFile = formData.get("postFiringImage");
  if (!(postFiringFile instanceof File) || !postFiringFile.size) {
    redirect("/publish?error=Upload%20a%20post-firing%20image");
  }
  if (!postFiringFile.type.startsWith("image/")) {
    redirect("/publish?error=Only%20image%20uploads%20are%20supported");
  }
  if (postFiringFile.size > 5 * 1024 * 1024) {
    redirect("/publish?error=Images%20must%20be%20under%205MB");
  }

  // --- Pre-firing image (optional) ---
  const preFiringFile = formData.get("preFiringImage");
  const hasPreFiringImage =
    preFiringFile instanceof File && preFiringFile.size > 0;
  if (hasPreFiringImage) {
    if (!preFiringFile.type.startsWith("image/")) {
      redirect("/publish?error=Only%20image%20uploads%20are%20supported");
    }
    if (preFiringFile.size > 5 * 1024 * 1024) {
      redirect("/publish?error=Images%20must%20be%20under%205MB");
    }
  }

  // --- Upload post-firing image ---
  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9.-]/g, "-");
  const postFiringPath = `${viewer.profile.id}/${crypto.randomUUID()}-${sanitize(postFiringFile.name)}`;
  const postFiringBuffer = new Uint8Array(await postFiringFile.arrayBuffer());

  const { error: postUpErr } = await supabase.storage
    .from("user-combination-images")
    .upload(postFiringPath, postFiringBuffer, {
      contentType: postFiringFile.type,
      upsert: false,
    });

  if (postUpErr) {
    redirect(`/publish?error=${encodeURIComponent(postUpErr.message)}`);
  }

  const { data: postFiringPublic } = supabase.storage
    .from("user-combination-images")
    .getPublicUrl(postFiringPath);

  // --- Upload pre-firing image (if provided) ---
  let preFiringPublicUrl: string | null = null;

  if (hasPreFiringImage) {
    const preFiringPath = `${viewer.profile.id}/${crypto.randomUUID()}-${sanitize(preFiringFile.name)}`;
    const preFiringBuffer = new Uint8Array(await preFiringFile.arrayBuffer());

    const { error: preUpErr } = await supabase.storage
      .from("user-combination-images")
      .upload(preFiringPath, preFiringBuffer, {
        contentType: preFiringFile.type,
        upsert: false,
      });

    if (preUpErr) {
      redirect(`/publish?error=${encodeURIComponent(preUpErr.message)}`);
    }

    const { data: preFiringPublic } = supabase.storage
      .from("user-combination-images")
      .getPublicUrl(preFiringPath);
    preFiringPublicUrl = preFiringPublic.publicUrl;
  }

  // --- Build title from glaze labels ---
  const glazeLabels = layerGlazeIds.map((gid) => {
    const catalogGlaze = catalogGlazeMap.get(gid);
    if (catalogGlaze) return formatGlazeLabel(catalogGlaze);
    return customGlazeLabelMap.get(gid) ?? "Glaze";
  });
  const title =
    glazeLabels.length === 2
      ? `${glazeLabels[0]} over ${glazeLabels[1]}`
      : glazeLabels.join(" / ");

  // --- Insert example row ---
  const { data: exampleRow, error: insertErr } = await supabase
    .from("user_combination_examples")
    .insert({
      author_user_id: viewer.profile.id,
      title,
      post_firing_image_path: postFiringPublic.publicUrl,
      pre_firing_image_path: preFiringPublicUrl,
      cone: coneValue,
      atmosphere: normalizeOptional(formData.get("atmosphere")) ?? "oxidation",
      glazing_process: normalizeOptional(formData.get("glazingProcess")),
      notes: normalizeOptional(formData.get("notes")),
      kiln_notes: normalizeOptional(formData.get("kilnNotes")),
      visibility: "members",
      status: "published",
    })
    .select("id")
    .single();

  if (insertErr || !exampleRow) {
    redirect(`/publish?error=${encodeURIComponent(insertErr?.message ?? "Could not save example")}`);
  }

  // --- Insert layers ---
  const layerRows = layerGlazeIds.map((glazeId, index) => ({
    example_id: exampleRow.id,
    glaze_id: glazeId,
    layer_order: index + 1,
  }));

  const { error: layerErr } = await supabase
    .from("user_combination_example_layers")
    .insert(layerRows);

  if (layerErr) {
    // Clean up the parent row if layers fail
    await supabase.from("user_combination_examples").delete().eq("id", exampleRow.id);
    redirect(`/publish?error=${encodeURIComponent(layerErr.message)}`);
  }

  // Track combination publish event (fire and forget)
  void supabase.from("analytics_events").insert({
    event_type: "combination_publish",
    user_id: viewer.profile.id,
    glaze_id: null,
    metadata: { example_id: exampleRow.id, title, layer_count: layerGlazeIds.length, cone: coneValue },
  });

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "combination_shared",
    5,
    exampleRow.id,
    "combination",
  );

  revalidateWorkspace();
  redirect("/combinations?view=mine&published=1");
}

export async function deleteUserCombinationAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/combinations");
  const exampleId = formData.get("exampleId")?.toString();

  if (!exampleId) {
    redirect("/combinations?error=Missing%20example%20id");
  }

  // Verify ownership (RLS enforces this too, but be explicit)
  const { data: example } = await supabase
    .from("user_combination_examples")
    .select("id, author_user_id, post_firing_image_path, pre_firing_image_path")
    .eq("id", exampleId)
    .single();

  if (!example) {
    redirect("/combinations?error=Example%20not%20found");
  }

  if (example.author_user_id !== viewer.profile.id && !viewer.profile.isAdmin) {
    redirect("/combinations?error=You%20can%20only%20archive%20your%20own%20examples");
  }

  // Archive instead of delete — admins can still view archived items
  await supabase
    .from("user_combination_examples")
    .update({ status: "hidden" })
    .eq("id", exampleId);

  revalidateWorkspace();
  redirect("/combinations?view=mine");
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

export async function toggleGlazeTagVoteAction(formData: FormData) {
  const { viewer, supabase } = await requireContributingMember("/glazes");
  const parsed = glazeTagVoteSchema.safeParse({
    glazeId: formData.get("glazeId"),
    tagSlug: formData.get("tagSlug")?.toString().trim(),
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/community" : "/community";

  if (!parsed.success) {
    redirect(returnTo);
  }

  const { data: glaze } = await supabase
    .from("glazes")
    .select("id,source_type")
    .eq("id", parsed.data.glazeId)
    .maybeSingle();

  if (!glaze || glaze.source_type !== "commercial") {
    redirect(returnTo);
  }

  const { data: tag } = await supabase
    .from("glaze_tags")
    .select("id")
    .eq("slug", parsed.data.tagSlug)
    .maybeSingle();

  if (!tag) {
    redirect(returnTo);
  }

  const { data: existingVote } = await supabase
    .from("glaze_tag_votes")
    .select("id")
    .eq("glaze_id", parsed.data.glazeId)
    .eq("tag_id", tag.id)
    .eq("user_id", viewer.profile.id)
    .maybeSingle();

  if (existingVote) {
    await supabase.from("glaze_tag_votes").delete().eq("id", existingVote.id);
  } else {
    await supabase.from("glaze_tag_votes").insert({
      glaze_id: parsed.data.glazeId,
      tag_id: tag.id,
      user_id: viewer.profile.id,
    });

    void awardPoints(
      viewer.profile.id,
      viewer.profile.isAdmin ?? false,
      "tag_voted",
      0.1,
      undefined,
      "tag_vote",
    );
  }

  revalidateWorkspace();
  revalidatePath(returnTo);
  redirect(returnTo);
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

export async function toggleFavouriteInlineAction(
  targetType: "glaze" | "combination",
  targetId: string,
): Promise<{ favourited: boolean; error?: string }> {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");

  const { data: existing } = await supabase
    .from("user_favourites")
    .select("id")
    .eq("user_id", viewer.profile.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase.from("user_favourites").delete().eq("id", existing.id);
    if (error) return { favourited: true, error: error.message };
    revalidateWorkspace();
    return { favourited: false };
  } else {
    const { error } = await supabase.from("user_favourites").insert({
      user_id: viewer.profile.id,
      target_type: targetType,
      target_id: targetId,
    });
    if (error) return { favourited: false, error: error.message };
    revalidateWorkspace();
    return { favourited: true };
  }
}

export async function toggleGlazeFavouriteAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const parsed = glazeFavouriteSchema.safeParse({
    glazeId: formData.get("glazeId"),
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/glazes" : "/glazes";

  if (!parsed.success) {
    redirect(returnTo);
  }

  const { data: existing } = await supabase
    .from("user_favourites")
    .select("id")
    .eq("user_id", viewer.profile.id)
    .eq("target_type", "glaze")
    .eq("target_id", parsed.data.glazeId)
    .limit(1)
    .single();

  if (existing) {
    await supabase.from("user_favourites").delete().eq("id", existing.id);
  } else {
    await supabase.from("user_favourites").insert({
      user_id: viewer.profile.id,
      target_type: "glaze",
      target_id: parsed.data.glazeId,
    });
  }

  revalidateWorkspace();
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateGlazeDescriptionAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const parsed = glazeDescriptionEditorSchema.safeParse({
    glazeId: formData.get("glazeId"),
    editorialSummary: normalizeOptional(formData.get("editorialSummary")) ?? undefined,
    editorialSurface: normalizeOptional(formData.get("editorialSurface")) ?? undefined,
    editorialApplication: normalizeOptional(formData.get("editorialApplication")) ?? undefined,
    editorialFiring: normalizeOptional(formData.get("editorialFiring")) ?? undefined,
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/glazes" : "/glazes";

  if (!viewer.profile.isAdmin) {
    redirect(`${returnTo}?error=Only%20admins%20can%20edit%20catalog%20descriptions`);
  }

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Check the description fields";
    redirect(`${returnTo}?error=${encodeURIComponent(issue)}`);
  }

  const hasEditorialContent = Boolean(
    parsed.data.editorialSummary ||
      parsed.data.editorialSurface ||
      parsed.data.editorialApplication ||
      parsed.data.editorialFiring,
  );

  const { error } = await supabase
    .from("glazes")
    .update({
      editorial_summary: parsed.data.editorialSummary ?? null,
      editorial_surface: parsed.data.editorialSurface ?? null,
      editorial_application: parsed.data.editorialApplication ?? null,
      editorial_firing: parsed.data.editorialFiring ?? null,
      editorial_reviewed_at: hasEditorialContent ? new Date().toISOString() : null,
      editorial_reviewed_by_user_id: hasEditorialContent ? viewer.profile.id : null,
    })
    .eq("id", parsed.data.glazeId);

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(`/glazes/${parsed.data.glazeId}`);
  revalidatePath("/glazes");
  redirect(`${returnTo}?saved=description`);
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

/** Return lightweight catalog glaze data for the label scanner. */
export async function getCatalogGlazesForScannerAction() {
  return getAllCatalogGlazes().map((g) => ({
    id: g.id,
    brand: g.brand ?? null,
    code: g.code ?? null,
    name: g.name,
    line: g.line ?? null,
    imageUrl: g.imageUrl ?? null,
  }));
}

/** Use Gemini Vision to read a glaze label from a photo. */
export async function recognizeGlazeLabelAction(input: {
  imageBase64: string;
  mimeType: string;
}): Promise<{
  success: boolean;
  brand: string | null;
  code: string | null;
  name: string | null;
  line: string | null;
  rawText: string | null;
  error: string | null;
}> {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, brand: null, code: null, name: null, line: null, rawText: null, error: "Vision API not configured." };
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.imageBase64,
          },
        },
        {
          text: `You are looking at a photo of a ceramic glaze bottle or label. Extract the following information and return ONLY valid JSON with no markdown formatting:

{
  "brand": "the manufacturer (e.g. Mayco, AMACO, Coyote, Spectrum, Duncan, Speedball)",
  "code": "the product code (e.g. CG-718, SW-116, LG-10, HF-26)",
  "name": "the color/glaze name (e.g. Blue Caprice, Sea Salt)",
  "line": "the product line (e.g. Jungle Gems, Stoneware, Elements, Sahara)"
}

If you cannot determine a field, set it to null. Focus on reading the product code — it's the most important identifier. Look for patterns like 2-3 letters followed by a dash and numbers.`,
        },
      ],
    });

    const text = response.text?.trim() ?? "";

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonStr = fenced[1].trim();

    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      brand: parsed.brand ?? null,
      code: parsed.code ?? null,
      name: parsed.name ?? null,
      line: parsed.line ?? null,
      rawText: text,
      error: null,
    };
  } catch (e) {
    return {
      success: false,
      brand: null,
      code: null,
      name: null,
      line: null,
      rawText: null,
      error: e instanceof Error ? e.message : "Failed to read label.",
    };
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function trackBuyClickAction(formData: FormData): Promise<void> {
  const glazeId = formData.get("glazeId") as string | null;
  const storeId = formData.get("storeId") as string | null;
  const storeName = formData.get("storeName") as string | null;
  const url = formData.get("url") as string | null;

  if (!url) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) { redirect(url); }
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("analytics_events").insert({
    event_type: "buy_click",
    user_id: user?.id ?? null,
    glaze_id: glazeId || null,
    metadata: { store_id: storeId, store_name: storeName, url },
  });

  redirect(url);
}

// ─── Admin moderation ─────────────────────────────────────────────────────────

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
