"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAllCatalogGlazes } from "@/lib/catalog";
import { formatGlazeLabel } from "@/lib/utils";
import { awardPoints } from "@/lib/points";
import { normalizeOptional, revalidateWorkspace, requireMemberSupabase, requireContributingMember } from "./_shared";

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

