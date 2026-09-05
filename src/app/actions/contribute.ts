"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isResultCone } from "@/lib/result-cones";
import { getAllCatalogGlazes } from "@/lib/catalog";
import {
  getContributionImageBucket,
  isOwnedContributionImagePath,
  MAX_CONTRIBUTION_IMAGE_BYTES,
  MAX_CONTRIBUTION_IMAGE_COUNT,
} from "@/lib/contribution-images";
import { awardPoints } from "@/lib/points";
import { formatGlazeLabel } from "@/lib/utils";

import {
  normalizeOptional,
  requireContributingMember,
  requireMemberSupabase,
  revalidateWorkspace,
} from "./_shared";

/* ----------------------------------------------------------------------------
 * Tutorial completion
 * ------------------------------------------------------------------------- */

export async function completeContributionTutorialAction(): Promise<void> {
  const { viewer, supabase } = await requireMemberSupabase();

  await supabase
    .from("profiles")
    .update({ contribution_tutorial_completed_at: new Date().toISOString() })
    .eq("id", viewer.profile.id);

  revalidateWorkspace();
  revalidatePath("/contribute", "page");
  revalidatePath("/contribute/welcome", "page");
  revalidatePath("/", "layout");
  redirect("/contribute");
}

/* ----------------------------------------------------------------------------
 * Unified contribution dispatcher
 * -------------------------------------------------------------------------
 * Two submission shapes:
 *
 *   1. Firing photo on a single existing glaze   → 2 points
 *   2. Combination of 2–4 existing glazes         → 5 points
 * ------------------------------------------------------------------------- */

type SubmitResult = { error: string } | { success: true; redirectTo: string; pointsAwarded: number };

interface UploadedImage {
  publicUrl: string;
  storagePath: string;
}

async function verifyUploadedImages(
  supabase: Awaited<ReturnType<typeof requireMemberSupabase>>["supabase"],
  bucket: string,
  userId: string,
  paths: string[],
): Promise<{ uploaded: UploadedImage[] } | { error: string }> {
  for (const path of paths) {
    if (!isOwnedContributionImagePath(path, userId)) {
      return { error: "One of the uploaded photos is invalid. Please choose it again." };
    }

    const { data: info, error } = await supabase.storage.from(bucket).info(path);
    if (error || !info) {
      return { error: "One of the uploaded photos could not be verified. Please try again." };
    }
    if (info.size && info.size > MAX_CONTRIBUTION_IMAGE_BYTES) {
      return { error: "Each image must be under 8 MB." };
    }
    if (info.contentType && !info.contentType.startsWith("image/")) {
      return { error: "Only image uploads are supported." };
    }
  }

  const uploaded = paths.map((path) => {
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return { publicUrl: pub.publicUrl, storagePath: path };
  });
  return { uploaded };
}

export async function submitContributionAction(formData: FormData): Promise<SubmitResult> {
  const { viewer, supabase } = await requireContributingMember("/contribute");

  /* ── Parse common fields ─────────────────────────────────────────────── */
  const uploadedImagePaths = formData
    .getAll("uploadedImagePaths")
    .map((value) => value.toString().trim())
    .filter(Boolean);

  if (uploadedImagePaths.length === 0) return { error: "Add at least one photo." };
  if (uploadedImagePaths.length > MAX_CONTRIBUTION_IMAGE_COUNT) {
    return { error: "You can upload up to 5 photos." };
  }

  const coneValue = formData.get("coneValue")?.toString().trim() ?? "";
  if (!isResultCone(coneValue)) return { error: "Choose Cone 6 or Cone 10 for your fired result." };

  const atmosphere = normalizeOptional(formData.get("atmosphere"));
  const label = normalizeOptional(formData.get("label"));

  const existingGlazeIds = (formData.getAll("glazeIds") as string[])
    .map((id) => id?.trim())
    .filter(Boolean);

  if (existingGlazeIds.length === 0) {
    return { error: "Pick at least one glaze." };
  }
  if (existingGlazeIds.length > 4) {
    return { error: "A combination can have at most 4 layers." };
  }

  const isCombination = existingGlazeIds.length >= 2;
  const bucket = getContributionImageBucket(existingGlazeIds.length);

  const upload = await verifyUploadedImages(
    supabase,
    bucket,
    viewer.profile.id,
    uploadedImagePaths,
  );
  if ("error" in upload) return upload;
  const uploadedUrls = upload.uploaded.map((u) => u.publicUrl);

  /* ── Combination shape ───────────────────────────────────────────────── */
  if (isCombination) {
    const allCatalog = getAllCatalogGlazes();
    const catalogMap = new Map(allCatalog.map((g) => [g.id, g]));
    const labels: string[] = [];
    for (const id of existingGlazeIds) {
      if (catalogMap.has(id)) {
        labels.push(formatGlazeLabel(catalogMap.get(id)!));
      } else {
        const { data } = await supabase
          .from("glazes")
          .select("name, brand")
          .eq("id", id)
          .maybeSingle();
        labels.push(data ? `${data.brand ?? ""} ${data.name ?? "Glaze"}`.trim() : "Glaze");
      }
    }
    const title = labels.length === 2 ? `${labels[0]} over ${labels[1]}` : labels.join(" / ");

    const { data: exampleRow, error: exampleErr } = await supabase
      .from("user_combination_examples")
      .insert({
        author_user_id: viewer.profile.id,
        title,
        image_paths: uploadedUrls,
        cone: coneValue,
        atmosphere: atmosphere ?? "oxidation",
        glazing_process: normalizeOptional(formData.get("glazingProcess")),
        notes: normalizeOptional(formData.get("notes")),
        kiln_notes: normalizeOptional(formData.get("kilnNotes")),
        clay_body: normalizeOptional(formData.get("clayBody")),
        visibility: "members",
        status: "published",
      })
      .select("id")
      .single();

    if (exampleErr || !exampleRow) {
      return { error: exampleErr?.message ?? "Could not save combination." };
    }

    const layerRows = existingGlazeIds.map((glazeId, index) => ({
      example_id: exampleRow.id,
      glaze_id: glazeId,
      layer_order: index + 1,
    }));

    const { error: layerErr } = await supabase
      .from("user_combination_example_layers")
      .insert(layerRows);

    if (layerErr) {
      await supabase.from("user_combination_examples").delete().eq("id", exampleRow.id);
      return { error: layerErr.message };
    }

    void supabase.from("analytics_events").insert({
      event_type: "combination_publish",
      user_id: viewer.profile.id,
      glaze_id: null,
      metadata: {
        example_id: exampleRow.id,
        title,
        layer_count: existingGlazeIds.length,
        cone: coneValue,
      },
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
    return {
      success: true,
      redirectTo: `/combinations?view=mine&published=1&result=${exampleRow.id}`,
      pointsAwarded: 5,
    };
  }

  /* ── Single existing glaze: firing photo(s) ────────────────────────── */
  const rows = upload.uploaded.map((img) => ({
    glaze_id: existingGlazeIds[0],
    combination_id: null,
    combination_type: null,
    image_url: img.publicUrl,
    storage_path: img.storagePath,
    label,
    cone: coneValue,
    atmosphere,
    uploader_user_id: viewer.profile.id,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("community_firing_images")
    .insert(rows)
    .select("id");

  if (insertErr) return { error: insertErr.message };

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "firing_photo_uploaded",
    2,
    inserted?.[0]?.id,
    "community_image",
  );

  revalidateWorkspace();
  return { success: true, redirectTo: `/glazes/${encodeURIComponent(existingGlazeIds[0])}`, pointsAwarded: 2 };
}
