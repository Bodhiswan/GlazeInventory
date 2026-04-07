import { requireViewer, getSupabase } from "@/lib/data/users";
import { parseInventoryState } from "@/lib/inventory-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ExternalExampleAsset,
  ExternalExampleGlazeMention,
  ExternalExampleIntake,
  ExternalExampleParserOutput,
  Glaze,
  IntakeStatus,
} from "@/lib/types";
import {
  getCatalogGlazesByIds,
} from "@/lib/catalog";
import { getInventory } from "@/lib/data/inventory";
import { getCombinationSummaries } from "@/lib/data/combinations";
import { getCommunityPosts } from "@/lib/data/community";

type Row = Record<string, unknown>;

function getBundledVendorImageUrl(brand: unknown, code: unknown) {
  if (brand === "Coyote" && typeof code === "string" && code.trim()) {
    return `/vendor-images/coyote/${code.toLowerCase()}.jpg`;
  }

  return null;
}


function normalizeVendorImageUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value.trim()
    .replace(/ā|â€™|â/g, "'")
    .replace(/ā|ā|â€œ|â€|â|â/g, "")
    .replace(/\s+/g, " ");

  try {
    const parsed = new URL(normalized);
    const encodedPath = parsed.pathname
      .split("/")
      .map((segment) => {
        if (!segment) {
          return segment;
        }

        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join("/");

    parsed.pathname = encodedPath;
    return parsed.toString();
  } catch {
    return normalized;
  }
}

function mapGlaze(row: Row): Glaze {
  const bundledImageUrl = getBundledVendorImageUrl(row.brand, row.code);

  return {
    id: String(row.id),
    sourceType: row.source_type === "nonCommercial" ? "nonCommercial" : "commercial",
    name: String(row.name),
    brand: (row.brand as string | null) ?? null,
    line: (row.line as string | null) ?? null,
    code: (row.code as string | null) ?? null,
    cone: (row.cone as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    imageUrl: bundledImageUrl ?? normalizeVendorImageUrl((row.image_url as string | null) ?? null),
    editorialSummary: (row.editorial_summary as string | null) ?? null,
    editorialSurface: (row.editorial_surface as string | null) ?? null,
    editorialApplication: (row.editorial_application as string | null) ?? null,
    editorialFiring: (row.editorial_firing as string | null) ?? null,
    editorialReviewedAt: (row.editorial_reviewed_at as string | null) ?? null,
    editorialReviewedByUserId: (row.editorial_reviewed_by_user_id as string | null) ?? null,
    atmosphere: (row.atmosphere as string | null) ?? null,
    finishNotes: (row.finish_notes as string | null) ?? null,
    colorNotes: (row.color_notes as string | null) ?? null,
    recipeNotes: (row.recipe_notes as string | null) ?? null,
    createdByUserId: (row.created_by_user_id as string | null) ?? null,
  };
}

function mapExternalExampleParserOutput(value: unknown): ExternalExampleParserOutput {
  if (!value || typeof value !== "object") {
    return {};
  }

  const row = value as Row;
  return {
    extractedCone: (row.extractedCone as string | null) ?? null,
    extractedAtmosphere: (row.extractedAtmosphere as string | null) ?? null,
    extractedClayBody: (row.extractedClayBody as string | null) ?? null,
    matchedTerms: Array.isArray(row.matchedTerms)
      ? row.matchedTerms.map((item) => String(item))
      : [],
    duplicateSha256s: Array.isArray(row.duplicateSha256s)
      ? row.duplicateSha256s.map((item) => String(item))
      : [],
    duplicateSourceUrl: Boolean(row.duplicateSourceUrl),
  };
}

function mapExternalExampleAsset(row: Row): ExternalExampleAsset {
  return {
    id: String(row.id),
    intakeId: String(row.intake_id),
    storagePath: String(row.storage_path),
    sourceImageUrl: (row.source_image_url as string | null) ?? null,
    captureMethod: String((row.capture_method as string | null) ?? "download"),
    width: typeof row.width === "number" ? row.width : Number(row.width ?? 0) || null,
    height: typeof row.height === "number" ? row.height : Number(row.height ?? 0) || null,
    sha256: String(row.sha256),
    sortOrder: Number(row.sort_order ?? 0),
    signedImageUrl: null,
  };
}

function mapExternalExampleGlazeMention(row: Row): ExternalExampleGlazeMention {
  const glazeSource = Array.isArray((row as Row & { matched_glaze?: unknown }).matched_glaze)
    ? ((row as Row & { matched_glaze?: Row[] }).matched_glaze?.[0] ?? null)
    : ((row as Row & { matched_glaze?: Row | null }).matched_glaze ?? null);

  return {
    id: String(row.id),
    intakeId: String(row.intake_id),
    freeformText: String(row.freeform_text),
    matchedGlazeId: (row.matched_glaze_id as string | null) ?? null,
    matchedGlaze: glazeSource ? mapGlaze(glazeSource as Row) : null,
    confidence: Number(row.confidence ?? 0),
    mentionOrder: Number(row.mention_order ?? 0),
    isApproved: Boolean(row.is_approved),
    approvedByUserId: (row.approved_by_user_id as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
  };
}

function mapExternalExampleIntake(row: Row): ExternalExampleIntake {
  const assetRows = Array.isArray((row as Row & { external_example_assets?: unknown }).external_example_assets)
    ? ((row as Row & { external_example_assets?: Row[] }).external_example_assets ?? [])
    : [];
  const mentionRows = Array.isArray((row as Row & { external_example_glaze_mentions?: unknown }).external_example_glaze_mentions)
    ? ((row as Row & { external_example_glaze_mentions?: Row[] }).external_example_glaze_mentions ?? [])
    : [];

  return {
    id: String(row.id),
    sourcePlatform: "facebook",
    groupLabel: String(row.group_label),
    sourceUrl: String(row.source_url),
    rawCaption: (row.raw_caption as string | null) ?? null,
    rawAuthorDisplayName: (row.raw_author_display_name as string | null) ?? null,
    rawSourceTimestamp: (row.raw_source_timestamp as string | null) ?? null,
    capturedByUserId: String(row.captured_by_user_id),
    privacyMode: ((row.privacy_mode as string | null) ?? "anonymous") as ExternalExampleIntake["privacyMode"],
    reviewStatus: ((row.review_status as string | null) ?? "queued") as IntakeStatus,
    parserOutput: mapExternalExampleParserOutput(row.parser_output),
    reviewNotes: (row.review_notes as string | null) ?? null,
    duplicateOfIntakeId: (row.duplicate_of_intake_id as string | null) ?? null,
    publishedPostId: (row.published_post_id as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    assets: assetRows.map((assetRow) => mapExternalExampleAsset(assetRow)).sort((left, right) => left.sortOrder - right.sortOrder),
    glazeMentions: mentionRows
      .map((mentionRow) => mapExternalExampleGlazeMention(mentionRow))
      .sort((left, right) => left.mentionOrder - right.mentionOrder),
  };
}

async function getSignedExternalExampleAssetUrls(storagePaths: string[]) {
  const admin = createSupabaseAdminClient();

  if (!admin || !storagePaths.length) {
    return new Map<string, string>();
  }

  const signedUrls = await Promise.all(
    storagePaths.map(async (storagePath) => {
      const { data } = await admin.storage.from("external-example-imports").createSignedUrl(storagePath, 60 * 60);
      return data?.signedUrl ? ([storagePath, data.signedUrl] as const) : null;
    }),
  );

  return new Map(
    signedUrls.filter((entry): entry is readonly [string, string] => Boolean(entry)),
  );
}

// Admin context: tag enrichment is not needed for intake/moderation views
async function getGlazesByIds(
  _viewerId: string,
  ids: string[],
  _clientOverride?: ReturnType<typeof createSupabaseAdminClient> | null,
) {
  if (!ids.length) return [];
  return getCatalogGlazesByIds(ids);
}

export async function getDashboardData(viewerId: string) {
  const [inventory, combinations, communityPosts] = await Promise.all([
    getInventory(viewerId),
    getCombinationSummaries(viewerId),
    getCommunityPosts(),
  ]);

  const ownedItems = inventory.filter((item) => item.status === "owned");
  const customCount = ownedItems.filter((item) => item.glaze.sourceType === "nonCommercial").length;

  return {
    inventory,
    combinations,
    recentPosts: communityPosts.slice(0, 3),
    metrics: {
      ownedGlazes: ownedItems.length,
      customGlazes: customCount,
      pairs: combinations.length,
      communityExamples: communityPosts.length,
    },
  };
}

export async function getExternalExampleIntakeQueue(status?: IntakeStatus | "all") {
  const viewer = await requireViewer();

  if (!viewer.profile.isAdmin) {
    return [] as ExternalExampleIntake[];
  }

  const supabase = await getSupabase();

  if (!supabase) {
    return [] as ExternalExampleIntake[];
  }

  let query = supabase
    .from("external_example_intakes")
    .select(
      "*, external_example_assets(*), external_example_glaze_mentions(*, matched_glaze:glazes(*))",
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("review_status", status);
  }

  const { data } = await query;
  const intakes = ((data ?? []) as Row[]).map((row) => mapExternalExampleIntake(row));
  const signedUrls = await getSignedExternalExampleAssetUrls(
    intakes.flatMap((intake) => intake.assets.map((asset) => asset.storagePath)),
  );

  return intakes.map((intake) => ({
    ...intake,
    assets: intake.assets.map((asset) => ({
      ...asset,
      signedImageUrl: signedUrls.get(asset.storagePath) ?? null,
    })),
  }));
}

export async function getExternalExampleIntake(intakeId: string) {
  const viewer = await requireViewer();

  if (!viewer.profile.isAdmin) {
    return null;
  }

  const supabase = await getSupabase();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("external_example_intakes")
    .select("*, external_example_assets(*), external_example_glaze_mentions(*, matched_glaze:glazes(*))")
    .eq("id", intakeId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const intake = mapExternalExampleIntake(data as Row);
  const signedUrls = await getSignedExternalExampleAssetUrls(intake.assets.map((asset) => asset.storagePath));

  return {
    ...intake,
    assets: intake.assets.map((asset) => ({
      ...asset,
      signedImageUrl: signedUrls.get(asset.storagePath) ?? null,
    })),
  } satisfies ExternalExampleIntake;
}

