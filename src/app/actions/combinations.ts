"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAllCatalogGlazes, getCatalogGlazeById } from "@/lib/catalog";
import { requireViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatGlazeLabel } from "@/lib/utils";
import { awardPoints } from "@/lib/points";

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

async function requireMemberSupabase(returnTo = "/auth/sign-in") {
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
