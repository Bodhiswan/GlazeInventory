"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAllCatalogGlazes } from "@/lib/catalog";
import { CUSTOM_GLAZE_ATMOSPHERE_VALUES, CUSTOM_GLAZE_CONE_VALUES } from "@/lib/glaze-constants";
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
  revalidatePath("/contribute");
  revalidatePath("/contribute/welcome");
  redirect("/contribute");
}

/* ----------------------------------------------------------------------------
 * Unified contribution dispatcher
 * -------------------------------------------------------------------------
 * One action handles all four submission shapes:
 *
 *   1. Firing photo on an existing glaze     → 2 points
 *   2. Firing photo on an existing combo     → 2 points
 *   3. Combination of 2-4 existing glazes    → 5 points
 *   4. New glaze (alone)                     → 10 points
 *   5. New glaze used inside a combination   → 15 points
 *
 * Cases 4 & 5 create a glaze record first; if the combination insert fails
 * we delete the just-created glaze to avoid orphaning it.
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

  const addingNewGlaze = formData.get("addNewGlaze")?.toString() === "1";

  // A new glaze and existing glazes can't be submitted together.
  if (addingNewGlaze && existingGlazeIds.length > 0) {
    return { error: "Add a new glaze on its own — pick existing glazes separately." };
  }

  /* ── Validate the new-glaze fields if "add new" was checked ──────────── */
  let newGlazeData: {
    name: string;
    brand: string | null;
    code: string | null;
    colors: string | null;
    finishes: string | null;
    notes: string | null;
  } | null = null;

  if (addingNewGlaze) {
    const name = formData.get("newGlazeName")?.toString().trim() ?? "";
    if (name.length < 2) return { error: "Give the new glaze a name (at least 2 characters)." };
    const brand = normalizeOptional(formData.get("newGlazeBrand"));
    const code = normalizeOptional(formData.get("newGlazeCode"));
    const colors = normalizeOptional(formData.get("newGlazeColors"));
    const finishes = normalizeOptional(formData.get("newGlazeFinishes"));
    const notes = normalizeOptional(formData.get("newGlazeNotes"));

    if (!brand) return { error: "New glazes need a brand or maker." };
    if (!code) return { error: "New glazes need a product code." };
    if (!colors) return { error: "Pick at least one colour for the new glaze." };
    if (!finishes) return { error: "Pick at least one finish for the new glaze." };
    if (!notes) return { error: "Add a short note about the new glaze." };

    // Catalog dupe check — match on (brand + name) OR (brand + normalized code).
    // Code normalization strips spaces/dashes/punctuation so "MC123", "MC-123",
    // and "mc 123" all collide.
    const normCode = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const nameNorm = name.toLowerCase();
    const brandNorm = brand.toLowerCase();
    const codeNorm = normCode(code);
    const dupe = getAllCatalogGlazes().find((g) => {
      const gBrand = g.brand?.toLowerCase() ?? "";
      if (gBrand !== brandNorm) return false;
      if (g.name.toLowerCase() === nameNorm) return true;
      if (codeNorm && normCode(g.code) === codeNorm) return true;
      return false;
    });
    if (dupe) {
      return {
        error: `${dupe.brand ?? ""} ${dupe.code ?? ""} ${dupe.name} already exists in the catalog — search for it instead of adding a duplicate.`.trim(),
      };
    }

    newGlazeData = { name, brand, code, colors, finishes, notes };
  }

  /* ── Need *something* to attach this contribution to ─────────────────── */
  if (existingGlazeIds.length === 0 && !newGlazeData) {
    return { error: "Pick at least one glaze, or tick \"add a new glaze\"." };
  }

  /* ── Upload images to the right bucket based on shape ────────────────── */
  // Combination shape if 2+ total glazes (existing + new)
  const totalGlazeCount = existingGlazeIds.length + (newGlazeData ? 1 : 0);
  const isCombination = totalGlazeCount >= 2;
  const bucket = newGlazeData
    ? "custom-glaze-images"
    : isCombination
      ? "user-combination-images"
      : "community-firing-images";

  const upload = await uploadImages(supabase, bucket, viewer.profile.id, imageFiles);
  if ("error" in upload) return upload;
  const uploadedUrls = upload.uploaded.map((u) => u.publicUrl);

  /* ── Create the new glaze (if any) BEFORE the combination ────────────── */
  let createdGlazeId: string | null = null;
  let createdGlazeLabel = "";

  if (newGlazeData) {
    if (!CUSTOM_GLAZE_CONE_VALUES.includes(coneValue as (typeof CUSTOM_GLAZE_CONE_VALUES)[number])) {
      return { error: "Choose a supported cone for the new glaze." };
    }

    const { data: glazeRow, error: glazeErr } = await supabase
      .from("glazes")
      .insert({
        source_type: "nonCommercial",
        name: newGlazeData.name,
        brand: newGlazeData.brand,
        code: newGlazeData.code,
        cone: coneValue,
        atmosphere:
          atmosphere && CUSTOM_GLAZE_ATMOSPHERE_VALUES.includes(
            atmosphere as (typeof CUSTOM_GLAZE_ATMOSPHERE_VALUES)[number],
          )
            ? atmosphere
            : null,
        color_notes: newGlazeData.colors,
        finish_notes: [newGlazeData.finishes, newGlazeData.notes].filter(Boolean).join(". "),
        created_by_user_id: viewer.profile.id,
        image_url: uploadedUrls[0] ?? null,
      })
      .select("id")
      .single();

    if (glazeErr || !glazeRow) {
      return { error: glazeErr?.message ?? "Could not create the new glaze." };
    }

    createdGlazeId = glazeRow.id as string;
    createdGlazeLabel = `${newGlazeData.brand} ${newGlazeData.name}`;

    // Attach all uploaded images to the glaze record
    for (let i = 0; i < uploadedUrls.length; i++) {
      await supabase.from("glaze_firing_images").insert({
        glaze_id: createdGlazeId,
        label: "Photo",
        image_url: uploadedUrls[i],
        sort_order: i,
      });
    }

    // Add to inventory as owned
    await supabase.from("inventory_items").insert({
      user_id: viewer.profile.id,
      glaze_id: createdGlazeId,
      status: "owned",
    });

    void supabase.from("analytics_events").insert({
      event_type: "glaze_create",
      user_id: viewer.profile.id,
      glaze_id: null,
      metadata: { glaze_id: createdGlazeId, name: newGlazeData.name, brand: newGlazeData.brand },
    });
  }

  /* ── Build the layer list (combination case) ─────────────────────────── */
  if (isCombination) {
    const validCones = new Set(["Cone 06", "Cone 6", "Cone 10"]);
    if (!validCones.has(coneValue)) {
      // Roll back the just-created glaze if any
      if (createdGlazeId) {
        await supabase.from("glazes").delete().eq("id", createdGlazeId);
      }
      return { error: "Combinations require Cone 06, Cone 6, or Cone 10." };
    }

    const layerIds: string[] = [...existingGlazeIds];
    if (createdGlazeId) layerIds.push(createdGlazeId);

    if (layerIds.length > 4) {
      if (createdGlazeId) await supabase.from("glazes").delete().eq("id", createdGlazeId);
      return { error: "A combination can have at most 4 layers." };
    }

    // Build a label for the title
    const allCatalog = getAllCatalogGlazes();
    const catalogMap = new Map(allCatalog.map((g) => [g.id, g]));
    const labels: string[] = [];
    for (const id of layerIds) {
      if (id === createdGlazeId) {
        labels.push(createdGlazeLabel);
      } else if (catalogMap.has(id)) {
        labels.push(formatGlazeLabel(catalogMap.get(id)!));
      } else {
        // Custom glaze owned by viewer
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
        visibility: "members",
        status: "published",
      })
      .select("id")
      .single();

    if (exampleErr || !exampleRow) {
      // Roll back the new glaze if we just created one
      if (createdGlazeId) await supabase.from("glazes").delete().eq("id", createdGlazeId);
      return { error: exampleErr?.message ?? "Could not save combination." };
    }

    const layerRows = layerIds.map((glazeId, index) => ({
      example_id: exampleRow.id,
      glaze_id: glazeId,
      layer_order: index + 1,
    }));

    const { error: layerErr } = await supabase
      .from("user_combination_example_layers")
      .insert(layerRows);

    if (layerErr) {
      await supabase.from("user_combination_examples").delete().eq("id", exampleRow.id);
      if (createdGlazeId) await supabase.from("glazes").delete().eq("id", createdGlazeId);
      return { error: layerErr.message };
    }

    void supabase.from("analytics_events").insert({
      event_type: "combination_publish",
      user_id: viewer.profile.id,
      glaze_id: null,
      metadata: {
        example_id: exampleRow.id,
        title,
        layer_count: layerIds.length,
        cone: coneValue,
        included_new_glaze: !!createdGlazeId,
      },
    });

    // Points
    let totalPoints = 5; // combination
    void awardPoints(
      viewer.profile.id,
      viewer.profile.isAdmin ?? false,
      "combination_shared",
      5,
      exampleRow.id,
      "combination",
    );

    if (createdGlazeId) {
      totalPoints += 10;
      void awardPoints(
        viewer.profile.id,
        viewer.profile.isAdmin ?? false,
        "glaze_added",
        10,
        createdGlazeId,
        "glaze",
      );
    }

    revalidateWorkspace();
    return {
      success: true,
      redirectTo: "/combinations?view=mine&published=1",
      pointsAwarded: totalPoints,
    };
  }

  /* ── New glaze alone (no combination) ────────────────────────────────── */
  if (newGlazeData && createdGlazeId && !isCombination) {
    void awardPoints(
      viewer.profile.id,
      viewer.profile.isAdmin ?? false,
      "glaze_added",
      10,
      createdGlazeId,
      "glaze",
    );
    revalidateWorkspace();
    return {
      success: true,
      redirectTo: `/inventory?customGlazeAdded=1`,
      pointsAwarded: 10,
    };
  }

  /* ── Single existing glaze: firing photo(s) ──────────────────────────── */
  if (existingGlazeIds.length === 1) {
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

  return { error: "We couldn't figure out what you were trying to submit. Try again." };
}

