"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAllCatalogGlazes } from "@/lib/catalog";
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

const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9.-]/g, "-");

type SubmitResult = { error: string } | { success: true; redirectTo: string; pointsAwarded: number };

interface UploadedImage {
  publicUrl: string;
  storagePath: string;
}

async function uploadImages(
  supabase: Awaited<ReturnType<typeof requireMemberSupabase>>["supabase"],
  bucket: string,
  userId: string,
  files: File[],
): Promise<{ uploaded: UploadedImage[] } | { error: string }> {
  const uploaded: UploadedImage[] = [];
  for (const file of files) {
    const path = `${userId}/${crypto.randomUUID()}-${sanitize(file.name)}`;
    const buffer = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (upErr) return { error: upErr.message };
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    uploaded.push({ publicUrl: pub.publicUrl, storagePath: path });
  }
  return { uploaded };
}

export async function submitContributionAction(formData: FormData): Promise<SubmitResult> {
  const { viewer, supabase } = await requireContributingMember("/contribute");

  /* ── Parse common fields ─────────────────────────────────────────────── */
  const imageFiles = (formData.getAll("images") as unknown[])
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (imageFiles.length === 0) return { error: "Add at least one photo." };
  if (imageFiles.length > 5) return { error: "You can upload up to 5 photos." };
  for (const file of imageFiles) {
    if (!file.type.startsWith("image/")) return { error: "Only image uploads are supported." };
    if (file.size > 8 * 1024 * 1024) return { error: "Each image must be under 8 MB." };
  }

  const coneValue = formData.get("coneValue")?.toString().trim() ?? "";
  if (!coneValue) return { error: "Pick a cone before submitting." };

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
  const bucket = isCombination ? "user-combination-images" : "community-firing-images";

  const upload = await uploadImages(supabase, bucket, viewer.profile.id, imageFiles);
  if ("error" in upload) return upload;
  const uploadedUrls = upload.uploaded.map((u) => u.publicUrl);

  /* ── Combination shape ───────────────────────────────────────────────── */
  if (isCombination) {
    const validCones = new Set(["Cone 06", "Cone 6", "Cone 10"]);
    if (!validCones.has(coneValue)) {
      return { error: "Combinations require Cone 06, Cone 6, or Cone 10." };
    }

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
      redirectTo: "/combinations?view=mine&published=1",
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
  return { success: true, redirectTo: "/contribute?submitted=photo", pointsAwarded: 2 };
}
