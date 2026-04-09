"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAllCatalogGlazes } from "@/lib/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { awardPoints } from "@/lib/points";
import { setGlazeInventoryStateAction } from "@/app/actions/inventory";
import { getCatalogGlazes } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { normalizeOptional, revalidateWorkspace, requireMemberSupabase, requireContributingMember } from "./_shared";

const glazeTagVoteSchema = z.object({
  glazeId: z.string().uuid(),
  tagSlug: z.string().min(2).max(80),
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

/** Return lightweight catalog glaze data for the label scanner.
 * Uses the merged catalog (static JSON + DB-only brands like Opulence)
 * so newly imported brands show up in the inventory add-glaze search. */
export async function getCatalogGlazesForScannerAction() {
  const viewer = await requireViewer();
  const glazes = await getCatalogGlazes(viewer.profile.id);
  return glazes.map((g) => ({
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
