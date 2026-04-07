import { cache } from "react";

import { buildCombinationSummaries, parsePairKey } from "@/lib/combinations";
import { requireViewer } from "@/lib/data/users";
import {
  demoGlazes,
  demoInventory,
  demoInventoryFolders,
  demoPairs,
  demoPosts,
  demoProfiles,
  demoReports,
  getDemoTagSummariesForGlaze,
} from "@/lib/demo-data";
import { getSupabaseEnv } from "@/lib/env";
import { parseInventoryState } from "@/lib/inventory-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CombinationDetail,
  CombinationPair,
  GlazeComment,
  GlazeDetail,
  GlazeFiringImage,
  CombinationPost,
  VendorCombinationExample,
  VendorCombinationExampleLayer,
  ExternalExampleAsset,
  ExternalExampleGlazeMention,
  ExternalExampleIntake,
  ExternalExampleParserOutput,
  Glaze,
  GlazeTagSummary,
  InventoryFolder,
  InventoryItem,
  IntakeStatus,
  LeaderboardEntry,
  ModerationQueue,
  PointsBreakdownEntry,
  ModerationItem,
  Report,
  UserCombinationExample,
  UserCombinationExampleLayer,
  UserProfile,
  Viewer,
} from "@/lib/types";
import { formatGlazeLabel } from "@/lib/utils";
import {
  getAllCatalogGlazes,
  getCatalogGlazeById,
  getCatalogGlazesByIds,
  getCatalogFiringImages,
  getCatalogFiringImageMap,
  getAllVendorExamples,
  getVendorExampleById,
  getTagDefinitions,
  type StaticExample,
} from "@/lib/catalog";

type Row = Record<string, unknown>;

const catalogGlazeByCode = new Map(
  getAllCatalogGlazes()
    .filter((glaze) => Boolean(glaze.code))
    .map((glaze) => [glaze.code!.toLowerCase(), glaze] as const),
);

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
    .replace(/ā|â€™|â/g, "'")
    .replace(/ā|ā|â€œ|â€|â|â/g, "")
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

function mapInventoryStatus(value: unknown) {
  if (value === "archived") {
    return "archived" as const;
  }

  if (value === "wishlist") {
    return "wishlist" as const;
  }

  return "owned" as const;
}

function mapVendorCombinationExample(row: Row) {
  return {
    id: String(row.id),
    sourceVendor: String(row.source_vendor ?? "Mayco"),
    sourceCollection: String(row.source_collection ?? "glaze-combinations"),
    sourceKey: String(row.source_key),
    sourceUrl: String(row.source_url),
    title: String(row.title),
    imageUrl: String(row.image_url),
    cone: (row.cone as string | null) ?? null,
    atmosphere: (row.atmosphere as string | null) ?? null,
    clayBody: (row.clay_body as string | null) ?? null,
    applicationNotes: (row.application_notes as string | null) ?? null,
    firingNotes: (row.firing_notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapVendorCombinationExampleLayer(row: Row): VendorCombinationExampleLayer {
  return {
    id: String(row.id),
    exampleId: String(row.example_id),
    glazeId: (row.glaze_id as string | null) ?? null,
    glazeCode: (row.glaze_code as string | null) ?? null,
    glazeName: String(row.glaze_name),
    layerOrder: Number(row.layer_order ?? 0),
    connectorToNext: (row.connector_to_next as string | null) ?? null,
    sourceImageUrl: (row.source_image_url as string | null) ?? null,
  };
}

function mapInventoryFolder(row: Row): InventoryFolder {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
  };
}

function mapInventoryFoldersFromJoinRows(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as InventoryFolder[];
  }

  const folders = value
    .map((entry) => {
      const joinRow = entry as Row & { folder?: Row | Row[] | null };
      const folderSource = Array.isArray(joinRow.folder) ? joinRow.folder[0] : joinRow.folder;

      if (!folderSource) {
        return null;
      }

      return mapInventoryFolder(folderSource as Row);
    })
    .filter((folder): folder is InventoryFolder => Boolean(folder));

  return Array.from(new Map(folders.map((folder) => [folder.id, folder])).values());
}

const glazeTagCategoryOrder = ["Surface", "Opacity", "Movement", "Application", "Visual"];

function sortTagSummaries(tags: GlazeTagSummary[]) {
  return [...tags].sort((left, right) => {
    const categoryDelta =
      glazeTagCategoryOrder.indexOf(left.category) - glazeTagCategoryOrder.indexOf(right.category);

    if (categoryDelta !== 0) {
      return categoryDelta;
    }

    if (right.voteCount !== left.voteCount) {
      return right.voteCount - left.voteCount;
    }

    return left.label.localeCompare(right.label);
  });
}

const getAllTagData = cache(async function getAllTagData(viewerId: string) {
  const supabase = await getSupabase();

  // Tag definitions come from static JSON; only votes need Supabase.
  const tagRows = getTagDefinitions() as unknown as Row[];

  if (!supabase) {
    return { tagRows, counts: new Map<string, number>(), viewerVotes: new Set<string>() };
  }

  const { data: votes } = await supabase
    .from("glaze_tag_votes")
    .select("glaze_id,tag_id,user_id");

  const voteRows = (votes ?? []) as Row[];
  const counts = new Map<string, number>();
  const viewerVotes = new Set<string>();

  for (const row of voteRows) {
    const glazeId = String(row.glaze_id);
    const tagId = String(row.tag_id);
    const key = `${glazeId}:${tagId}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);

    if (String(row.user_id) === viewerId) {
      viewerVotes.add(key);
    }
  }

  return { tagRows, counts, viewerVotes };
});

async function getGlazeTagSummaryMap(viewerId: string, glazes: Glaze[]) {
  const commercialGlazes = glazes.filter((glaze) => glaze.sourceType === "commercial");

  if (!commercialGlazes.length) {
    return new Map<string, GlazeTagSummary[]>();
  }

  const { tagRows, counts, viewerVotes } = await getAllTagData(viewerId);

  return new Map(
    commercialGlazes.map((glaze) => {
      const summaries = sortTagSummaries(
        tagRows.map((row) => {
          const tagId = String(row.id);
          const key = `${glaze.id}:${tagId}`;

          return {
            id: tagId,
            slug: String(row.slug),
            label: String(row.label),
            category: String(row.category),
            description: (row.description as string | null) ?? null,
            voteCount: counts.get(key) ?? 0,
            viewerHasVoted: viewerVotes.has(key),
          } satisfies GlazeTagSummary;
        }),
      );

      return [glaze.id, summaries];
    }),
  );
}

async function attachTagSummariesToGlazes(viewerId: string, glazes: Glaze[]) {
  const tagSummaryMap = await getGlazeTagSummaryMap(viewerId, glazes);

  return glazes.map((glaze) =>
    glaze.sourceType === "commercial"
      ? {
          ...glaze,
          communityTags: tagSummaryMap.get(glaze.id) ?? [],
        }
      : glaze,
  );
}

function mapInventoryItem(row: Row): InventoryItem {
  const glazeRow = Array.isArray(row.glaze) ? row.glaze[0] : row.glaze;
  const inventoryState = parseInventoryState((row.personal_notes as string | null) ?? null);
  const folders = mapInventoryFoldersFromJoinRows((row as Row & { inventory_item_folders?: unknown }).inventory_item_folders);

  return {
    id: String(row.id),
    userId: String(row.user_id),
    glazeId: String(row.glaze_id),
    status: mapInventoryStatus(row.status),
    personalNotes: inventoryState.note,
    fillLevel: inventoryState.fillLevel,
    quantity: inventoryState.quantity,
    folders,
    folderIds: folders.map((folder) => folder.id),
    glaze: mapGlaze(glazeRow as Row),
  };
}

function mapPair(row: Row): CombinationPair {
  return {
    id: String(row.id),
    glazeAId: String(row.glaze_a_id),
    glazeBId: String(row.glaze_b_id),
    pairKey: String(row.pair_key),
  };
}

function mapGlazeFiringImage(row: Row): GlazeFiringImage {
  return {
    id: String(row.id),
    label: String(row.label),
    cone: (row.cone as string | null) ?? null,
    atmosphere: (row.atmosphere as string | null) ?? null,
    imageUrl: normalizeVendorImageUrl(String(row.image_url)) ?? String(row.image_url),
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

function mapProfile(row: Row, fallback?: Partial<UserProfile>): UserProfile {
  return {
    id: String(row.id ?? fallback?.id ?? ""),
    email: (row.email as string | null) ?? fallback?.email ?? null,
    displayName:
      (row.display_name as string | null) ??
      fallback?.displayName ??
      fallback?.email?.split("@")[0] ??
      "Glaze member",
    avatarUrl: (row.avatar_url as string | null) ?? fallback?.avatarUrl ?? null,
    studioName: (row.studio_name as string | null) ?? fallback?.studioName ?? null,
    location: (row.location as string | null) ?? fallback?.location ?? null,
    isAdmin: Boolean(row.is_admin ?? fallback?.isAdmin),
    isAnonymous: Boolean(row.is_anonymous ?? fallback?.isAnonymous),
    preferredCone: (row.preferred_cone as string | null) ?? fallback?.preferredCone ?? null,
    preferredAtmosphere:
      (row.preferred_atmosphere as string | null) ?? fallback?.preferredAtmosphere ?? null,
    restrictToPreferredExamples: Boolean(
      row.restrict_to_preferred_examples ?? fallback?.restrictToPreferredExamples,
    ),
    points: typeof row.points === "number" ? row.points : 0,
    contributionStrikes: typeof row.contribution_strikes === "number" ? row.contribution_strikes : 0,
    contributionsDisabled: Boolean(row.contributions_disabled ?? false),
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

function attachGlazesToPosts(posts: CombinationPost[], pairs: CombinationPair[], glazes: Glaze[]) {
  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const glazeById = new Map(glazes.map((glaze) => [glaze.id, glaze]));

  return posts.map((post) => {
    const pair = pairById.get(post.combinationPairId);

    if (!pair) {
      return post;
    }

    const postWithPairKey = {
      ...post,
      pairKey: pair.pairKey,
    };

    const glazeA = glazeById.get(pair.glazeAId);
    const glazeB = glazeById.get(pair.glazeBId);

    if (!glazeA || !glazeB) {
      return postWithPairKey;
    }

    return {
      ...postWithPairKey,
      glazes: [glazeA, glazeB] as [Glaze, Glaze],
    };
  });
}

async function getSupabase() {
  if (!getSupabaseEnv()) {
    return null;
  }

  return createSupabaseServerClient();
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


export const getCatalogGlazes = cache(async function getCatalogGlazes(viewerId: string) {
  const staticGlazes = getAllCatalogGlazes();

  // Merge in any custom glazes this user has added
  let customGlazes: Glaze[] = [];
  const supabase = await getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("glazes")
      .select("id,source_type,name,brand,line,code,cone,description,image_url,atmosphere,finish_notes,color_notes,recipe_notes,created_by_user_id")
      .eq("source_type", "nonCommercial")
      .eq("created_by_user_id", viewerId);
    customGlazes = (data ?? []).map((row) => mapGlaze(row as Row));
  }

  const glazes = [...staticGlazes, ...customGlazes].sort((left, right) =>
    formatGlazeLabel(left).localeCompare(formatGlazeLabel(right)),
  );
  return attachTagSummariesToGlazes(viewerId, glazes);
});

/* Lightweight ownership lookup — only id, glaze_id, status. No glaze join, no tags, no folders. */
export const getInventoryOwnership = cache(async function getInventoryOwnership(viewerId: string) {
  const supabase = await getSupabase();

  if (!supabase) {
    return demoInventory
      .filter((item) => item.userId === viewerId)
      .map((item) => ({ id: item.id, glazeId: item.glazeId, status: item.status }));
  }

  const { data } = await supabase
    .from("inventory_items")
    .select("id,glaze_id,status")
    .eq("user_id", viewerId);

  return (data ?? []).map((row) => ({
    id: String((row as Row).id),
    glazeId: String((row as Row).glaze_id),
    status: mapInventoryStatus((row as Row).status),
  }));
});

const INVENTORY_GLAZE_COLUMNS = "id,source_type,name,brand,line,code,cone,description,image_url,atmosphere,finish_notes,color_notes";

export const getInventory = cache(async function getInventory(viewerId: string) {
  const supabase = await getSupabase();

  if (!supabase) {
    return demoInventory
      .filter((item) => item.userId === viewerId)
      .sort((left, right) => left.glaze.name.localeCompare(right.glaze.name));
  }

  const { data } = await supabase
    .from("inventory_items")
    .select(`id,user_id,glaze_id,status,personal_notes,glaze:glazes(${INVENTORY_GLAZE_COLUMNS}),inventory_item_folders(folder:inventory_folders(*))`)
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });

  const inventory = (data ?? []).map((row) => mapInventoryItem(row as Row));

  return inventory;
});

export async function getInventoryFolders(viewerId: string) {
  const supabase = await getSupabase();

  if (!supabase) {
    return demoInventoryFolders
      .filter((folder) => folder.userId === viewerId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  const { data: folderRows } = await supabase
    .from("inventory_folders")
    .select("id,user_id,name")
    .eq("user_id", viewerId)
    .order("name", { ascending: true });

  const folders = (folderRows ?? []).map((row) => mapInventoryFolder(row as Row));

  if (!folders.length) {
    return [] as InventoryFolder[];
  }

  const { data: assignmentRows } = await supabase
    .from("inventory_item_folders")
    .select("folder_id")
    .in(
      "folder_id",
      folders.map((folder) => folder.id),
    );

  const counts = ((assignmentRows ?? []) as Row[]).reduce<Map<string, number>>((map, row) => {
    const folderId = String(row.folder_id);
    map.set(folderId, (map.get(folderId) ?? 0) + 1);
    return map;
  }, new Map());

  return folders.map((folder) => ({
    ...folder,
    glazeCount: counts.get(folder.id) ?? 0,
  }));
}

export async function getInventoryItem(viewerId: string, inventoryId: string) {
  const inventory = await getInventory(viewerId);
  return inventory.find((item) => item.id === inventoryId) ?? null;
}

export function getGlazeFiringImageMap(glazeIds: string[]) {
  return getCatalogFiringImageMap(glazeIds);
}

async function getGlazesByIds(
  viewerId: string,
  ids: string[],
  _clientOverride?: ReturnType<typeof createSupabaseAdminClient> | null,
  options?: { skipTags?: boolean },
) {
  if (!ids.length) return [];
  const glazes = getCatalogGlazesByIds(ids);
  if (options?.skipTags) return glazes;
  return attachTagSummariesToGlazes(viewerId, glazes);
}

async function getPostCountsByPairKey() {
  const supabase = await getSupabase();

  if (!supabase) {
    return demoPosts
      .filter((post) => post.status === "published")
      .reduce<Record<string, number>>((counts, post) => {
        counts[post.pairKey] = (counts[post.pairKey] ?? 0) + 1;
        return counts;
      }, {});
  }

  /* Single JOIN query instead of two sequential fetches */
  const { data: joinedRows } = await supabase
    .from("combination_posts")
    .select("combination_pair_id, combination_pairs(pair_key)")
    .eq("status", "published");

  return (joinedRows ?? []).reduce<Record<string, number>>((counts, row) => {
    const pairData = (row as Row & { combination_pairs?: Row | Row[] | null }).combination_pairs;
    const pairSource = Array.isArray(pairData) ? pairData[0] : pairData;
    const pairKey = pairSource ? String((pairSource as Row).pair_key) : null;

    if (!pairKey) {
      return counts;
    }

    counts[pairKey] = (counts[pairKey] ?? 0) + 1;
    return counts;
  }, {});
}

export async function getCombinationSummaries(viewerId: string) {
  const [ownership, postCounts] = await Promise.all([
    getInventoryOwnership(viewerId),
    getPostCountsByPairKey(),
  ]);
  const ownedGlazeIds = ownership.filter((item) => item.status === "owned").map((item) => item.glazeId);
  const ownedGlazes = getCatalogGlazesByIds(ownedGlazeIds);

  return buildCombinationSummaries(ownedGlazes, postCounts);
}

async function getPairsByIds(
  pairIds: string[],
  clientOverride?: ReturnType<typeof createSupabaseAdminClient> | null,
) {
  const supabase = clientOverride ?? (await getSupabase());

  if (!supabase) {
    return demoPairs.filter((pair) => pairIds.includes(pair.id));
  }

  if (!pairIds.length) {
    return [];
  }

  const { data } = await supabase.from("combination_pairs").select("*").in("id", pairIds);
  return (data ?? []).map((row) => mapPair(row as Row));
}

async function getProfilesByIds(
  profileIds: string[],
  clientOverride?: ReturnType<typeof createSupabaseAdminClient> | null,
) {
  const supabase = clientOverride ?? (await getSupabase());

  if (!supabase) {
    return demoProfiles.filter((profile) => profileIds.includes(profile.id));
  }

  if (!profileIds.length) {
    return [];
  }

  const { data } = await supabase.from("profiles").select("id,display_name,is_admin,is_anonymous").in("id", profileIds);
  return (data ?? []).map((row) => mapProfile(row as Row));
}

async function hydrateVendorCombinationExamples(viewerId: string, exampleRows: Row[], layerRows: Row[]) {
  if (!exampleRows.length) {
    return [] as VendorCombinationExample[];
  }

  const examples = exampleRows.map((row) => mapVendorCombinationExample(row));
  const layers = layerRows.map((row) => mapVendorCombinationExampleLayer(row));
  const glazeIds = Array.from(
    new Set(
      layers
        .flatMap((layer) => {
          if (layer.glazeId) {
            return [layer.glazeId];
          }

          if (layer.glazeCode) {
            const matchedGlaze = catalogGlazeByCode.get(layer.glazeCode.toLowerCase());
            return matchedGlaze ? [matchedGlaze.id] : [];
          }

          return [];
        })
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const [glazes, ownership] = await Promise.all([
    getGlazesByIds(viewerId, glazeIds),
    getInventoryOwnership(viewerId),
  ]);
  const glazesById = new Map(glazes.map((glaze) => [glaze.id, glaze]));
  const ownedGlazeIds = new Set(
    ownership
      .filter((item) => item.status === "owned")
      .map((item) => item.glazeId),
  );
  const layersByExampleId = layers.reduce<Map<string, VendorCombinationExampleLayer[]>>((groups, layer) => {
    const matchedGlaze = layer.glazeId
      ? glazesById.get(layer.glazeId) ?? null
      : layer.glazeCode
        ? catalogGlazeByCode.get(layer.glazeCode.toLowerCase()) ?? null
        : null;
    const hydratedLayer = {
      ...layer,
      glazeId: layer.glazeId ?? matchedGlaze?.id ?? null,
      glaze: matchedGlaze,
    };

    groups.set(layer.exampleId, [...(groups.get(layer.exampleId) ?? []), hydratedLayer]);
    return groups;
  }, new Map());

  return examples.map((example) => {
    const exampleLayers = [...(layersByExampleId.get(example.id) ?? [])].sort(
      (left, right) => left.layerOrder - right.layerOrder,
    );
    const matchedLayers = exampleLayers.filter((layer) => layer.glazeId);
    const viewerOwnedLayerCount = matchedLayers.filter((layer) =>
      layer.glazeId ? ownedGlazeIds.has(layer.glazeId) : false,
    ).length;

    return {
      ...example,
      layers: exampleLayers,
      viewerOwnsAllGlazes:
        Boolean(exampleLayers.length) &&
        exampleLayers.every((layer) => layer.glazeId && ownedGlazeIds.has(layer.glazeId)),
      viewerOwnedLayerCount,
    };
  });
}

async function hydratePosts(
  viewerId: string,
  rows: Row[],
  options?: {
    useAdminRead?: boolean;
    includeProfiles?: boolean;
    preloadedPairs?: CombinationPair[];
  },
) {
  if (!rows.length) {
    return [] as CombinationPost[];
  }

  const useAdminRead = Boolean(options?.useAdminRead);
  const includeProfiles = options?.includeProfiles ?? !useAdminRead;
  const adminClient = useAdminRead ? createSupabaseAdminClient() : null;

  const basePosts: CombinationPost[] = rows.map((row) => ({
    id: String(row.id),
    authorUserId: String(row.author_user_id),
    authorName: "Glaze member",
    displayAuthorName: (row.display_author_name as string | null) ?? null,
    combinationPairId: String(row.combination_pair_id),
    pairKey: "",
    imagePath: String(row.image_path),
    caption: (row.caption as string | null) ?? null,
    applicationNotes: (row.application_notes as string | null) ?? null,
    firingNotes: (row.firing_notes as string | null) ?? null,
    visibility: "members",
    status: row.status === "hidden" ? "hidden" : row.status === "reported" ? "reported" : "published",
    createdAt: String(row.created_at),
  }));

  if (options?.preloadedPairs) {
    const pairs = options.preloadedPairs;
    const glazeIds = Array.from(new Set(pairs.flatMap((pair) => [pair.glazeAId, pair.glazeBId])));
    const [glazes, profiles] = await Promise.all([
      getGlazesByIds(viewerId, glazeIds, adminClient),
      includeProfiles ? getProfilesByIds(basePosts.map((post) => post.authorUserId), adminClient) : Promise.resolve([]),
    ]);
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    return attachGlazesToPosts(basePosts, pairs, glazes).map((post) => ({
      ...post,
      authorName: post.displayAuthorName ?? profilesById.get(post.authorUserId)?.displayName ?? post.authorName,
    }));
  }

  const [pairs, profiles] = await Promise.all([
    getPairsByIds(basePosts.map((post) => post.combinationPairId), adminClient),
    includeProfiles ? getProfilesByIds(basePosts.map((post) => post.authorUserId), adminClient) : Promise.resolve([]),
  ]);
  const glazeIds = Array.from(new Set(pairs.flatMap((pair) => [pair.glazeAId, pair.glazeBId])));
  const glazes = await getGlazesByIds(viewerId, glazeIds, adminClient);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return attachGlazesToPosts(basePosts, pairs, glazes).map((post) => ({
    ...post,
    authorName: post.displayAuthorName ?? profilesById.get(post.authorUserId)?.displayName ?? post.authorName,
  }));
}

function hydrateStaticExamplesWithInventory(
  staticExamples: StaticExample[],
  ownedGlazeIds: Set<string>,
): VendorCombinationExample[] {
  return staticExamples.map((ex) => {
    const layers: VendorCombinationExampleLayer[] = ex.layers.map((layer: StaticExample["layers"][number]) => ({
      ...layer,
      glazeName: layer.glazeName,
      glaze: layer.glaze ?? null,
    }));
    const matchedLayers = layers.filter((l) => l.glazeId);
    const viewerOwnedLayerCount = matchedLayers.filter((l) =>
      l.glazeId ? ownedGlazeIds.has(l.glazeId) : false,
    ).length;

    return {
      ...ex,
      createdAt: "",
      updatedAt: "",
      layers,
      viewerOwnsAllGlazes:
        Boolean(layers.length) &&
        layers.every((l) => l.glazeId && ownedGlazeIds.has(l.glazeId)),
      viewerOwnedLayerCount,
    };
  });
}

export async function getVendorCombinationExamples(viewerId: string, options?: { skipInventory?: boolean }) {
  const staticExamples = getAllVendorExamples();
  if (options?.skipInventory) {
    return hydrateStaticExamplesWithInventory(staticExamples, new Set());
  }
  const ownership = await getInventoryOwnership(viewerId);
  const ownedGlazeIds = new Set(
    ownership.filter((item) => item.status === "owned").map((item) => item.glazeId),
  );
  return hydrateStaticExamplesWithInventory(staticExamples, ownedGlazeIds);
}

export async function getVendorCombinationExample(viewerId: string, exampleId: string) {
  const staticExample = getVendorExampleById(exampleId);
  if (!staticExample) return null;

  const ownership = await getInventoryOwnership(viewerId);
  const ownedGlazeIds = new Set(
    ownership.filter((item) => item.status === "owned").map((item) => item.glazeId),
  );
  const [result] = hydrateStaticExamplesWithInventory([staticExample], ownedGlazeIds);
  return result ?? null;
}

export async function getCommunityPosts(search = "") {
  const viewer = await requireViewer();
  const supabase = await getSupabase();

  let posts: CombinationPost[] = [];

  if (!supabase) {
    const taggedGlazes = await attachTagSummariesToGlazes(viewer.profile.id, demoGlazes);
    posts = attachGlazesToPosts(
      demoPosts.filter((post) => post.status === "published"),
      demoPairs,
      taggedGlazes,
    );
  } else {
    const { data: joinedRows } = await supabase
      .from("combination_posts")
      .select("*, combination_pairs(*)")
      .eq("visibility", "members")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const postRows: Row[] = [];
    const pairsById = new Map<string, CombinationPair>();

    for (const row of joinedRows ?? []) {
      const { combination_pairs: pairData, ...postData } = row as Row & { combination_pairs: Row | null };
      postRows.push(postData as Row);
      if (pairData) {
        const pair = mapPair(pairData);
        pairsById.set(pair.id, pair);
      }
    }

    posts = await hydratePosts(viewer.profile.id, postRows, {
      preloadedPairs: Array.from(pairsById.values()),
    });
  }

  const query = search.trim().toLowerCase();

  if (!query) {
    return posts;
  }

  return posts.filter((post) => {
    const glazeCopy = (post.glazes ?? []).map((glaze) => formatGlazeLabel(glaze).toLowerCase()).join(" ");
    const tagCopy = (post.glazes ?? [])
      .flatMap((glaze) => (glaze.communityTags ?? []).filter((tag) => tag.voteCount > 0).map((tag) => tag.label.toLowerCase()))
      .join(" ");

    return [post.caption ?? "", post.applicationNotes ?? "", post.firingNotes ?? "", glazeCopy, tagCopy]
      .join(" ")
      .toLowerCase()
      .includes(query);
    });
}

export async function getPublishedPostsByAuthor(viewerId: string, search = "") {
  const posts = await getPublishedCombinationPosts(viewerId, { authorUserId: viewerId });

  const query = search.trim().toLowerCase();

  if (!query) {
    return posts;
  }

  return posts.filter((post) => {
    const glazeCopy = (post.glazes ?? []).map((glaze) => formatGlazeLabel(glaze).toLowerCase()).join(" ");
    const tagCopy = (post.glazes ?? [])
      .flatMap((glaze) =>
        (glaze.communityTags ?? [])
          .filter((tag) => tag.voteCount > 0)
          .map((tag) => tag.label.toLowerCase()),
      )
      .join(" ");

    return [post.caption ?? "", post.applicationNotes ?? "", post.firingNotes ?? "", glazeCopy, tagCopy]
      .join(" ")
      .toLowerCase()
      .includes(query);
    });
}

export async function getCommunityFiringImagesForGlaze(glazeId: string): Promise<Array<{
  id: string; imageUrl: string; label: string | null; cone: string | null; atmosphere: string | null; uploaderName: string | null;
}>> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("community_firing_images")
    .select("id, image_url, label, cone, atmosphere, profiles!uploader_user_id(display_name)")
    .eq("glaze_id", glazeId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => {
    const row = r as Row;
    const profile = row.profiles as Row | null;
    return {
      id: String(row.id),
      imageUrl: String(row.image_url),
      label: row.label ? String(row.label) : null,
      cone: row.cone ? String(row.cone) : null,
      atmosphere: row.atmosphere ? String(row.atmosphere) : null,
      uploaderName: profile ? String(profile.display_name ?? "Member") : "Member",
    };
  });
}

export async function getCommunityFiringImagesForCombination(combinationId: string): Promise<Array<{
  id: string; imageUrl: string; label: string | null; cone: string | null; atmosphere: string | null; uploaderName: string | null;
}>> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("community_firing_images")
    .select("id, image_url, label, cone, atmosphere, profiles!uploader_user_id(display_name)")
    .eq("combination_id", combinationId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => {
    const row = r as Row;
    const profile = row.profiles as Row | null;
    return {
      id: String(row.id),
      imageUrl: String(row.image_url),
      label: row.label ? String(row.label) : null,
      cone: row.cone ? String(row.cone) : null,
      atmosphere: row.atmosphere ? String(row.atmosphere) : null,
      uploaderName: profile ? String(profile.display_name ?? "Member") : "Member",
    };
  });
}

export async function getUserCombinationExamples(viewerId: string) {
  const supabase = await getSupabase();

  if (!supabase) {
    return [] as UserCombinationExample[];
  }

  const { data: exampleRows } = await supabase
    .from("user_combination_examples")
    .select("*, user_combination_example_layers(*), profiles!author_user_id(display_name)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!exampleRows?.length) {
    return [] as UserCombinationExample[];
  }

  const ownership = await getInventoryOwnership(viewerId);
  const ownedGlazeIds = new Set(
    ownership.filter((item) => item.status === "owned").map((item) => item.glazeId),
  );

  return exampleRows.map((row: Row & { user_combination_example_layers?: Row[]; profiles?: Row | null }) => {
    const rawLayers = (row.user_combination_example_layers ?? []) as Row[];
    const sortedLayers = rawLayers
      .sort((a, b) => Number(a.layer_order) - Number(b.layer_order));

    const layers: UserCombinationExampleLayer[] = sortedLayers.map((layer) => {
      const glazeId = String(layer.glaze_id);
      const glaze = getCatalogGlazeById(glazeId);
      return {
        id: String(layer.id),
        exampleId: String(row.id),
        glazeId,
        glaze,
        layerOrder: Number(layer.layer_order),
      };
    });

    const ownedCount = layers.filter((l) => l.glazeId && ownedGlazeIds.has(l.glazeId)).length;
    const profileData = row.profiles as Row | null;

    return {
      id: String(row.id),
      authorUserId: String(row.author_user_id),
      authorName: profileData ? String(profileData.display_name) : "Unknown",
      title: String(row.title ?? ""),
      postFiringImageUrl: String(row.post_firing_image_path ?? ""),
      preFiringImageUrl: row.pre_firing_image_path ? String(row.pre_firing_image_path) : null,
      cone: String(row.cone ?? ""),
      atmosphere: row.atmosphere ? String(row.atmosphere) : null,
      glazingProcess: row.glazing_process ? String(row.glazing_process) : null,
      notes: row.notes ? String(row.notes) : null,
      kilnNotes: row.kiln_notes ? String(row.kiln_notes) : null,
      status: "published" as const,
      createdAt: String(row.created_at),
      layers,
      viewerOwnsAllGlazes: layers.length > 0 && ownedCount === layers.length,
      viewerOwnedLayerCount: ownedCount,
    } satisfies UserCombinationExample;
  });
}

export async function getPublishedCombinationPosts(
  viewerId: string,
  options?: {
    authorUserId?: string;
    publicRead?: boolean;
  },
) {
  const adminClient = options?.publicRead ? createSupabaseAdminClient() : null;
  const supabase = adminClient ?? (await getSupabase());

  let posts: CombinationPost[] = [];

  if (!supabase) {
    const taggedGlazes = await attachTagSummariesToGlazes(viewerId, demoGlazes);
    posts = attachGlazesToPosts(
      demoPosts.filter(
        (post) =>
          post.status === "published" &&
          (!options?.authorUserId || post.authorUserId === options.authorUserId),
      ),
      demoPairs,
      taggedGlazes,
    );
  } else {
    let query = supabase
      .from("combination_posts")
      .select("*, combination_pairs(*)")
      .eq("visibility", "members")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (options?.authorUserId) {
      query = query.eq("author_user_id", options.authorUserId);
    }

    const { data: joinedRows } = await query;
    const postRows: Row[] = [];
    const pairsById = new Map<string, CombinationPair>();

    for (const row of joinedRows ?? []) {
      const { combination_pairs: pairData, ...postData } = row as Row & { combination_pairs: Row | null };
      postRows.push(postData as Row);
      if (pairData) {
        const pair = mapPair(pairData);
        pairsById.set(pair.id, pair);
      }
    }

    posts = await hydratePosts(viewerId, postRows, {
      useAdminRead: Boolean(adminClient),
      includeProfiles: false,
      preloadedPairs: Array.from(pairsById.values()),
    });
  }

  return posts;
}

export async function getCombinationDetail(
  viewerId: string,
  pairKey: string,
  options?: {
    publicRead?: boolean;
  },
): Promise<CombinationDetail | null> {
  const ids = parsePairKey(pairKey);

  if (!ids) {
    return null;
  }

  const adminClient = options?.publicRead ? createSupabaseAdminClient() : null;
  const glazes = await getGlazesByIds(viewerId, [...ids], adminClient);

  if (glazes.length !== 2) {
    return null;
  }

  const orderedGlazes = [...glazes].sort((left, right) => left.name.localeCompare(right.name)) as [
    Glaze,
    Glaze,
  ];

  const ownership = options?.publicRead ? [] : await getInventoryOwnership(viewerId);
  const inventoryForPair = ownership.filter((item) => ids.includes(item.glazeId));

  /* Fetch notes only for glaze IDs in this pair — avoids loading full inventory */
  let inventoryNotes: string[] = [];
  if (!options?.publicRead && inventoryForPair.length) {
    const supabaseForNotes = await getSupabase();
    if (supabaseForNotes) {
      const { data: noteRows } = await supabaseForNotes
        .from("inventory_items")
        .select("personal_notes")
        .eq("user_id", viewerId)
        .in("glaze_id", [...ids]);
      inventoryNotes = (noteRows ?? [])
        .map((row) => {
          const parsed = parseInventoryState((row as Row).personal_notes as string | null ?? null);
          return parsed.note;
        })
        .filter((note): note is string => Boolean(note));
    }
  }
  const viewerOwnsPair = ids.every((id) => inventoryForPair.some((item) => item.glazeId === id && item.status === "owned"));

  const supabase = adminClient ?? (await getSupabase());
  let posts: CombinationPost[] = [];

  if (!supabase) {
    posts = demoPosts
      .filter((post) => post.pairKey === pairKey && (options?.publicRead ? post.status === "published" : post.status !== "hidden"))
      .map((post) => ({
        ...post,
        glazes: orderedGlazes,
      }));
  } else {
    const { data: pairRow } = await supabase
      .from("combination_pairs")
      .select("*")
      .eq("pair_key", pairKey)
      .maybeSingle();

      if (pairRow) {
        const pairQuery = supabase
          .from("combination_posts")
          .select("*")
          .eq("combination_pair_id", String((pairRow as Row).id))
          .order("created_at", { ascending: false });

        const { data: postRows } = options?.publicRead
          ? await pairQuery.eq("status", "published")
          : await pairQuery.neq("status", "hidden");

        posts = await hydratePosts(viewerId, (postRows ?? []) as Row[], {
          useAdminRead: Boolean(adminClient),
          includeProfiles: false,
        });
      }
    }

  return {
    pairKey,
    glazes: orderedGlazes,
    viewerOwnsPair,
    inventoryNotes,
    posts,
  };
}

export async function getGlazeDetail(viewerId: string, glazeId: string): Promise<GlazeDetail | null> {
  const rawGlaze = getCatalogGlazeById(glazeId);
  if (!rawGlaze) return null;

  const glaze = (await attachTagSummariesToGlazes(viewerId, [rawGlaze]))[0];
  const firingImages = getCatalogFiringImages(glazeId);

  // User-specific data still needs Supabase
  const supabase = await getSupabase();

  if (!supabase) {
    return {
      glaze,
      firingImages,
      comments: [],
      viewerOwnsGlaze: false,
      viewerInventoryItem: null,
      viewerHasFavourited: false,
    };
  }

  const [
    { data: inventoryRows },
    { data: commentRows },
    { data: favouriteRows },
  ] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id,user_id,glaze_id,status,personal_notes,glaze:glazes(*),inventory_item_folders(folder:inventory_folders(*))")
      .eq("user_id", viewerId)
      .eq("glaze_id", glazeId)
      .limit(1),
    supabase
      .from("glaze_comments")
      .select("*, author:profiles(display_name)")
      .eq("glaze_id", glazeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_favourites")
      .select("id")
      .eq("user_id", viewerId)
      .eq("target_type", "glaze")
      .eq("target_id", glazeId)
      .limit(1),
  ]);

  const comments: GlazeComment[] = (commentRows ?? []).map((row) => {
    const rowObject = row as Row & { author?: Row | Row[] | null };
    const authorSource = rowObject.author;
    const author = Array.isArray(authorSource) ? authorSource[0] : authorSource;
    return {
      id: String(rowObject.id),
      glazeId: String(rowObject.glaze_id),
      authorUserId: String(rowObject.author_user_id),
      authorName: String(((author as Row | undefined)?.display_name as string | null) ?? "Glaze member"),
      body: String(rowObject.body),
      createdAt: String(rowObject.created_at),
    };
  });

  return {
    glaze,
    firingImages,
    comments,
    viewerOwnsGlaze: inventoryRows?.length ? mapInventoryItem(inventoryRows[0] as Row).status === "owned" : false,
    viewerInventoryItem: inventoryRows?.length ? mapInventoryItem(inventoryRows[0] as Row) : null,
    viewerHasFavourited: Boolean(favouriteRows?.length),
  };
}

export async function getFavouriteIds(
  viewerId: string,
  targetType: "glaze" | "combination",
): Promise<string[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("user_favourites")
    .select("target_id")
    .eq("user_id", viewerId)
    .eq("target_type", targetType);
  return (data ?? []).map((row) => String((row as Row).target_id));
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

export async function getReportedPostsQueue(): Promise<ModerationItem[]> {
  const viewer = await requireViewer();
  const supabase = await getSupabase();

  if (!supabase) {
    return demoPosts
      .filter((post) => post.status === "reported" || post.status === "hidden")
      .map((post) => ({
        post,
        reports: demoReports.filter((report) => report.postId === post.id),
      }));
  }

  const { data: posts } = await supabase
    .from("combination_posts")
    .select("*")
    .in("status", ["reported", "hidden"])
    .order("created_at", { ascending: false });

  const hydrated = await hydratePosts(viewer.profile.id, (posts ?? []) as Row[]);

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const mappedReports = (reports ?? []).map(
    (row) =>
      ({
        id: String((row as Row).id),
        postId: String((row as Row).post_id),
        reportedByUserId: String((row as Row).reported_by_user_id),
        reason: String((row as Row).reason),
        status: "open",
        createdAt: String((row as Row).created_at),
      }) satisfies Report,
  );

  return hydrated.map((post) => ({
    post,
    reports: mappedReports.filter((report) => report.postId === post.id),
  }));
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  stats: {
    totalUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    usersWithInventory: number;
    totalInventoryItems: number;
    totalPublishedPosts: number;
    totalBuyClicks: number;
    totalRatings: number;
    totalComments: number;
  };
  topGlazesByInventory: Array<{
    id: string;
    name: string;
    brand: string | null;
    code: string | null;
    count: number;
  }>;
  topGlazesByBuyClicks: Array<{
    id: string;
    name: string;
    brand: string | null;
    code: string | null;
    count: number;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    displayName: string | null;
    createdAt: string;
    inventoryCount: number;
  }>;
  recentBuyClicks: Array<{
    id: string;
    glazeName: string | null;
    glazeBrand: string | null;
    storeName: string | null;
    createdAt: string;
  }>;
  buyClicksByStore: Array<{ storeName: string; count: number }>;
}

export interface AdminUserDetail {
  profile: {
    id: string;
    email: string;
    displayName: string | null;
    studioName: string | null;
    location: string | null;
    preferredCone: string | null;
    preferredAtmosphere: string | null;
    createdAt: string;
  };
  inventory: {
    owned: Array<{ id: string; glazeId: string; name: string; brand: string | null; code: string | null; fillLevel: string; quantity: number; notes: string | null }>;
    wishlist: Array<{ id: string; glazeId: string; name: string; brand: string | null; code: string | null }>;
    archived: Array<{ id: string; glazeId: string; name: string; brand: string | null; code: string | null }>;
  };
  activity: {
    ratingsCount: number;
    commentsCount: number;
    buyClicks: Array<{ glazeName: string | null; glazeBrand: string | null; storeName: string | null; createdAt: string }>;
    postsCount: number;
  };
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Admin client unavailable");
  type Row = Record<string, unknown>;

  // Fetch profile and inventory in parallel
  const [{ data: profileRow }, { data: invRows }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single(),
    admin.from("inventory_items").select("id, glaze_id, status, personal_notes").eq("user_id", userId),
  ]);
  if (!profileRow) return null;
  const p = profileRow as Row;

  // Get glaze IDs to fetch details
  const glazeIds = [...new Set((invRows ?? []).map((r) => (r as Row).glaze_id as string))];
  const { data: glazeRows } = glazeIds.length
    ? await admin.from("glazes").select("id, name, brand, code").in("id", glazeIds)
    : { data: [] };
  const glazeMap: Record<string, { name: string; brand: string | null; code: string | null }> = {};
  for (const g of glazeRows ?? []) {
    const gr = g as Row;
    glazeMap[String(gr.id)] = { name: String(gr.name), brand: gr.brand as string | null, code: gr.code as string | null };
  }

  // Parse inventory into buckets
  const owned: AdminUserDetail["inventory"]["owned"] = [];
  const wishlist: AdminUserDetail["inventory"]["wishlist"] = [];
  const archived: AdminUserDetail["inventory"]["archived"] = [];

  for (const row of invRows ?? []) {
    const r = row as Row;
    const glazeId = String(r.glaze_id);
    const glaze = glazeMap[glazeId] ?? { name: "Unknown", brand: null, code: null };
    const status = String(r.status);
    const invState = parseInventoryState(r.personal_notes as string | null);

    if (status === "owned") {
      owned.push({ id: String(r.id), glazeId, ...glaze, fillLevel: invState.fillLevel, quantity: invState.quantity, notes: invState.note });
    } else if (status === "wishlist") {
      wishlist.push({ id: String(r.id), glazeId, ...glaze });
    } else {
      archived.push({ id: String(r.id), glazeId, ...glaze });
    }
  }

  // Activity: ratings, comments, buy clicks, posts
  const [ratingsRes, commentsRes, buyClicksRes, postsRes] = await Promise.all([
    admin.from("glaze_ratings").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("glaze_comments").select("id", { count: "exact", head: true }).eq("author_user_id", userId),
    admin.from("analytics_events").select("glaze_id, metadata, created_at").eq("event_type", "buy_click").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    admin.from("combination_posts").select("id", { count: "exact", head: true }).eq("author_user_id", userId),
  ]);

  // Resolve glaze names for buy clicks
  const buyGlazeIds = (buyClicksRes.data ?? []).map((r) => (r as Row).glaze_id as string).filter(Boolean);
  const { data: buyGlazeRows } = buyGlazeIds.length
    ? await admin.from("glazes").select("id, name, brand").in("id", buyGlazeIds)
    : { data: [] };
  const buyGlazeMap: Record<string, { name: string; brand: string | null }> = {};
  for (const g of buyGlazeRows ?? []) {
    buyGlazeMap[String((g as Row).id)] = { name: String((g as Row).name), brand: (g as Row).brand as string | null };
  }

  const buyClicks = (buyClicksRes.data ?? []).map((row) => {
    const r = row as Row;
    const meta = r.metadata as { store_name?: string } | null;
    const g = r.glaze_id ? buyGlazeMap[r.glaze_id as string] : null;
    return { glazeName: g?.name ?? null, glazeBrand: g?.brand ?? null, storeName: meta?.store_name ?? null, createdAt: String(r.created_at) };
  });

  return {
    profile: {
      id: String(p.id),
      email: String(p.email ?? ""),
      displayName: p.display_name ? String(p.display_name) : null,
      studioName: p.studio_name ? String(p.studio_name) : null,
      location: p.location ? String(p.location) : null,
      preferredCone: p.preferred_cone ? String(p.preferred_cone) : null,
      preferredAtmosphere: p.preferred_atmosphere ? String(p.preferred_atmosphere) : null,
      createdAt: String(p.created_at),
    },
    inventory: { owned, wishlist, archived },
    activity: {
      ratingsCount: ratingsRes.count ?? 0,
      commentsCount: commentsRes.count ?? 0,
      buyClicks,
      postsCount: postsRes.count ?? 0,
    },
  };
}

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Admin client unavailable");
  type Row = Record<string, unknown>;

  const now = Date.now();

  // ── Counts ──
  const [
    totalUsersRes,
    newUsers7dRes,
    newUsers30dRes,
    totalInventoryRes,
    postsRes,
    buyClicksRes,
    ratingsRes,
    commentsRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", new Date(now - 7 * 86400000).toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", new Date(now - 30 * 86400000).toISOString()),
    admin.from("inventory_items").select("id", { count: "exact", head: true }),
    admin.from("combination_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "buy_click"),
    admin.from("glaze_ratings").select("id", { count: "exact", head: true }),
    admin.from("glaze_comments").select("id", { count: "exact", head: true }),
  ]);

  // ── Top glazes by inventory: flat queries, no joins ──
  const { data: invItems } = await admin.from("inventory_items").select("glaze_id, user_id");
  const glazeIdCounts: Record<string, number> = {};
  for (const row of invItems ?? []) {
    const id = (row as Row).glaze_id as string;
    glazeIdCounts[id] = (glazeIdCounts[id] ?? 0) + 1;
  }
  const topGlazeIds = Object.entries(glazeIdCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
  const { data: topGlazeRows } = topGlazeIds.length
    ? await admin.from("glazes").select("id, name, brand, code, created_by_user_id").in("id", topGlazeIds).is("created_by_user_id", null)
    : { data: [] };
  const topGlazesByInventory = (topGlazeRows ?? [])
    .map((g) => ({ id: String((g as Row).id), name: String((g as Row).name), brand: (g as Row).brand as string | null, code: (g as Row).code as string | null, count: glazeIdCounts[String((g as Row).id)] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  // ── Distinct users with inventory (reuse the invItems query) ──
  const distinctUserIds = new Set((invItems ?? []).map((r) => (r as Row).user_id as string));

  // ── Buy clicks: flat queries ──
  const { data: buyClickRows } = await admin.from("analytics_events").select("id, glaze_id, metadata, created_at").eq("event_type", "buy_click").order("created_at", { ascending: false }).limit(1000);

  // Buy clicks by store
  const storeMap: Record<string, number> = {};
  const buyGlazeIdCounts: Record<string, number> = {};
  for (const row of buyClickRows ?? []) {
    const r = row as Row;
    const meta = r.metadata as { store_name?: string } | null;
    const storeName = meta?.store_name ?? "Unknown";
    storeMap[storeName] = (storeMap[storeName] ?? 0) + 1;
    if (r.glaze_id) buyGlazeIdCounts[r.glaze_id as string] = (buyGlazeIdCounts[r.glaze_id as string] ?? 0) + 1;
  }
  const buyClicksByStore = Object.entries(storeMap).map(([storeName, count]) => ({ storeName, count })).sort((a, b) => b.count - a.count);

  // Top glazes by buy clicks
  const topBuyGlazeIds = Object.entries(buyGlazeIdCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
  const { data: topBuyGlazeRows } = topBuyGlazeIds.length
    ? await admin.from("glazes").select("id, name, brand, code").in("id", topBuyGlazeIds)
    : { data: [] };
  const topGlazesByBuyClicks = (topBuyGlazeRows ?? [])
    .map((g) => ({ id: String((g as Row).id), name: String((g as Row).name), brand: (g as Row).brand as string | null, code: (g as Row).code as string | null, count: buyGlazeIdCounts[String((g as Row).id)] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  // Recent buy clicks with glaze names
  const recentClickGlazeIds = (buyClickRows ?? []).slice(0, 20).map((r) => (r as Row).glaze_id as string).filter(Boolean);
  const { data: recentClickGlazes } = recentClickGlazeIds.length
    ? await admin.from("glazes").select("id, name, brand").in("id", recentClickGlazeIds)
    : { data: [] };
  const glazeById: Record<string, { name: string; brand: string | null }> = {};
  for (const g of recentClickGlazes ?? []) {
    glazeById[String((g as Row).id)] = { name: String((g as Row).name), brand: (g as Row).brand as string | null };
  }
  const recentBuyClicks = (buyClickRows ?? []).slice(0, 20).map((row) => {
    const r = row as Row;
    const meta = r.metadata as { store_name?: string } | null;
    const g = r.glaze_id ? glazeById[r.glaze_id as string] : null;
    return { id: String(r.id), glazeName: g?.name ?? null, glazeBrand: g?.brand ?? null, storeName: meta?.store_name ?? null, createdAt: String(r.created_at) };
  });

  // ── Recent users ──
  const { data: recentUsersData } = await admin.from("profiles").select("id, email, display_name, created_at").order("created_at", { ascending: false }).limit(25);
  const recentUserIds = (recentUsersData ?? []).map((u) => (u as Row).id as string);
  const { data: invByUser } = recentUserIds.length
    ? await admin.from("inventory_items").select("user_id").in("user_id", recentUserIds)
    : { data: [] };
  const invCountByUser: Record<string, number> = {};
  for (const row of invByUser ?? []) {
    const uid = (row as Row).user_id as string;
    invCountByUser[uid] = (invCountByUser[uid] ?? 0) + 1;
  }
  const recentUsers = (recentUsersData ?? []).map((u) => ({
    id: String((u as Row).id),
    email: String((u as Row).email ?? ""),
    displayName: (u as Row).display_name ? String((u as Row).display_name) : null,
    createdAt: String((u as Row).created_at),
    inventoryCount: invCountByUser[String((u as Row).id)] ?? 0,
  }));

  return {
    stats: {
      totalUsers: totalUsersRes.count ?? 0,
      newUsers7d: newUsers7dRes.count ?? 0,
      newUsers30d: newUsers30dRes.count ?? 0,
      usersWithInventory: distinctUserIds.size,
      totalInventoryItems: totalInventoryRes.count ?? 0,
      totalPublishedPosts: postsRes.count ?? 0,
      totalBuyClicks: buyClicksRes.count ?? 0,
      totalRatings: ratingsRes.count ?? 0,
      totalComments: commentsRes.count ?? 0,
    },
    topGlazesByInventory,
    topGlazesByBuyClicks,
    recentUsers,
    recentBuyClicks,
    buyClicksByStore,
  };
}

// ─── Admin Dashboard V2 ───────────────────────────────────────────────────────

export type DashboardRange = "7d" | "30d" | "90d" | "all";

export interface AdminDashboard {
  range: DashboardRange;
  stats: {
    totalUsers: number;
    newUsers: number;
    glazeViews: number;
    combinationsPublished: number;
    customGlazesCreated: number;
    buyClicks: number;
    totalInventoryItems: number;
  };
  recentActivity: Array<{
    id: string;
    eventType: string;
    userDisplayName: string | null;
    userId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
  recentCombinations: Array<{
    id: string;
    title: string;
    authorName: string;
    authorId: string;
    status: string;
    cone: string;
    atmosphere: string;
    imageUrl: string;
    createdAt: string;
  }>;
  recentCustomGlazes: Array<{
    id: string;
    name: string;
    brand: string | null;
    colorNotes: string | null;
    finishNotes: string | null;
    creatorName: string;
    creatorId: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    displayName: string | null;
    createdAt: string;
    inventoryCount: number;
  }>;
  topGlazesByInventory: Array<{ id: string; name: string; brand: string | null; code: string | null; count: number }>;
  topGlazesByViews: Array<{ glazeName: string; glazeBrand: string | null; count: number }>;
  buyClicksByStore: Array<{ storeName: string; count: number }>;
  recentBuyClicks: Array<{
    id: string;
    glazeName: string | null;
    glazeBrand: string | null;
    storeName: string | null;
    createdAt: string;
  }>;
}

function rangeStart(range: DashboardRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 86400000).toISOString();
}

export async function getAdminDashboard(range: DashboardRange = "30d"): Promise<AdminDashboard> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Admin client unavailable");
  type Row = Record<string, unknown>;

  const since = rangeStart(range);

  // ── Parallel stat counts ──
  const statsQueries = [
    admin.from("profiles").select("id", { count: "exact", head: true }),
    since
      ? admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since)
      : admin.from("profiles").select("id", { count: "exact", head: true }),
    since
      ? admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "glaze_view").gte("created_at", since)
      : admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "glaze_view"),
    since
      ? admin.from("user_combination_examples").select("id", { count: "exact", head: true }).eq("status", "published").gte("created_at", since)
      : admin.from("user_combination_examples").select("id", { count: "exact", head: true }).eq("status", "published"),
    since
      ? admin.from("glazes").select("id", { count: "exact", head: true }).eq("source_type", "nonCommercial").gte("created_at", since)
      : admin.from("glazes").select("id", { count: "exact", head: true }).eq("source_type", "nonCommercial"),
    since
      ? admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "buy_click").gte("created_at", since)
      : admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "buy_click"),
    admin.from("inventory_items").select("id", { count: "exact", head: true }),
  ] as const;

  const [totalUsersRes, newUsersRes, glazeViewsRes, combosRes, customGlazesRes, buyClicksRes, inventoryRes] =
    await Promise.all(statsQueries);

  // ── Recent activity feed (all event types, last 40) ──
  const activityQuery = since
    ? admin.from("analytics_events").select("id, event_type, user_id, metadata, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(40)
    : admin.from("analytics_events").select("id, event_type, user_id, metadata, created_at").order("created_at", { ascending: false }).limit(40);
  const { data: activityRows } = await activityQuery;

  // Resolve user names for activity feed
  const activityUserIds = [...new Set((activityRows ?? []).map((r) => (r as Row).user_id as string).filter(Boolean))];
  const { data: activityUsers } = activityUserIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", activityUserIds)
    : { data: [] };
  const activityUserMap = new Map((activityUsers ?? []).map((u) => [String((u as Row).id), (u as Row).display_name as string | null]));

  const recentActivity = (activityRows ?? []).map((row) => {
    const r = row as Row;
    return {
      id: String(r.id),
      eventType: String(r.event_type),
      userDisplayName: r.user_id ? (activityUserMap.get(r.user_id as string) ?? null) : null,
      userId: r.user_id ? String(r.user_id) : null,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
      createdAt: String(r.created_at),
    };
  });

  // ── Recent combinations ──
  const combosQuery = since
    ? admin.from("user_combination_examples").select("id, title, author_user_id, status, cone, atmosphere, post_firing_image_path, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20)
    : admin.from("user_combination_examples").select("id, title, author_user_id, status, cone, atmosphere, post_firing_image_path, created_at").order("created_at", { ascending: false }).limit(20);
  const { data: combosData } = await combosQuery;

  const comboAuthorIds = [...new Set((combosData ?? []).map((c) => (c as Row).author_user_id as string).filter(Boolean))];
  const { data: comboAuthors } = comboAuthorIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", comboAuthorIds)
    : { data: [] };
  const comboAuthorMap = new Map((comboAuthors ?? []).map((u) => [String((u as Row).id), String((u as Row).display_name ?? "Unknown")]));

  const recentCombinations = (combosData ?? []).map((row) => {
    const r = row as Row;
    return {
      id: String(r.id),
      title: String(r.title),
      authorName: comboAuthorMap.get(r.author_user_id as string) ?? "Unknown",
      authorId: String(r.author_user_id),
      status: String(r.status),
      cone: String(r.cone),
      atmosphere: String(r.atmosphere),
      imageUrl: String(r.post_firing_image_path),
      createdAt: String(r.created_at),
    };
  });

  // ── Recent custom glazes ──
  const glazesQuery = since
    ? admin.from("glazes").select("id, name, brand, color_notes, finish_notes, created_by_user_id, created_at").eq("source_type", "nonCommercial").gte("created_at", since).order("created_at", { ascending: false }).limit(20)
    : admin.from("glazes").select("id, name, brand, color_notes, finish_notes, created_by_user_id, created_at").eq("source_type", "nonCommercial").order("created_at", { ascending: false }).limit(20);
  const { data: customGlazesData } = await glazesQuery;

  const glazeCreatorIds = [...new Set((customGlazesData ?? []).map((g) => (g as Row).created_by_user_id as string).filter(Boolean))];
  const { data: glazeCreators } = glazeCreatorIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", glazeCreatorIds)
    : { data: [] };
  const glazeCreatorMap = new Map((glazeCreators ?? []).map((u) => [String((u as Row).id), String((u as Row).display_name ?? "Unknown")]));

  const recentCustomGlazes = (customGlazesData ?? []).map((row) => {
    const r = row as Row;
    return {
      id: String(r.id),
      name: String(r.name),
      brand: r.brand ? String(r.brand) : null,
      colorNotes: r.color_notes ? String(r.color_notes) : null,
      finishNotes: r.finish_notes ? String(r.finish_notes) : null,
      creatorName: glazeCreatorMap.get(r.created_by_user_id as string) ?? "Unknown",
      creatorId: String(r.created_by_user_id),
      createdAt: String(r.created_at),
    };
  });

  // ── Recent users ──
  const { data: recentUsersData } = await admin
    .from("profiles")
    .select("id, email, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const recentUserIds = (recentUsersData ?? []).map((u) => (u as Row).id as string);
  const { data: invByUser } = recentUserIds.length
    ? await admin.from("inventory_items").select("user_id").in("user_id", recentUserIds)
    : { data: [] };
  const invCountByUser: Record<string, number> = {};
  for (const row of invByUser ?? []) {
    const uid = (row as Row).user_id as string;
    invCountByUser[uid] = (invCountByUser[uid] ?? 0) + 1;
  }

  const recentUsers = (recentUsersData ?? []).map((u) => ({
    id: String((u as Row).id),
    email: String((u as Row).email ?? ""),
    displayName: (u as Row).display_name ? String((u as Row).display_name) : null,
    createdAt: String((u as Row).created_at),
    inventoryCount: invCountByUser[String((u as Row).id)] ?? 0,
  }));

  // ── Top glazes by inventory (all time) ──
  const { data: invItems } = await admin.from("inventory_items").select("glaze_id");
  const glazeIdCounts: Record<string, number> = {};
  for (const row of invItems ?? []) {
    const id = (row as Row).glaze_id as string;
    glazeIdCounts[id] = (glazeIdCounts[id] ?? 0) + 1;
  }
  const topGlazeIds = Object.entries(glazeIdCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
  const { data: topGlazeRows } = topGlazeIds.length
    ? await admin.from("glazes").select("id, name, brand, code").in("id", topGlazeIds).is("created_by_user_id", null)
    : { data: [] };
  const topGlazesByInventory = (topGlazeRows ?? [])
    .map((g) => ({ id: String((g as Row).id), name: String((g as Row).name), brand: (g as Row).brand as string | null, code: (g as Row).code as string | null, count: glazeIdCounts[String((g as Row).id)] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  // ── Top glazes by views (from analytics_events metadata) ──
  const viewsQuery = since
    ? admin.from("analytics_events").select("metadata").eq("event_type", "glaze_view").gte("created_at", since)
    : admin.from("analytics_events").select("metadata").eq("event_type", "glaze_view");
  const { data: viewRows } = await viewsQuery;
  const viewCounts: Record<string, { glazeName: string; glazeBrand: string | null; count: number }> = {};
  for (const row of viewRows ?? []) {
    const meta = ((row as Row).metadata ?? {}) as Record<string, unknown>;
    const key = String(meta.catalog_glaze_id ?? meta.glaze_id ?? "unknown");
    if (!viewCounts[key]) viewCounts[key] = { glazeName: String(meta.glaze_name ?? "Unknown"), glazeBrand: meta.glaze_brand ? String(meta.glaze_brand) : null, count: 0 };
    viewCounts[key].count++;
  }
  const topGlazesByViews = Object.values(viewCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  // ── Buy clicks ──
  const buyQuery = since
    ? admin.from("analytics_events").select("id, metadata, created_at").eq("event_type", "buy_click").gte("created_at", since).order("created_at", { ascending: false }).limit(200)
    : admin.from("analytics_events").select("id, metadata, created_at").eq("event_type", "buy_click").order("created_at", { ascending: false }).limit(200);
  const { data: buyRows } = await buyQuery;

  const storeMap: Record<string, number> = {};
  for (const row of buyRows ?? []) {
    const meta = ((row as Row).metadata ?? {}) as { store_name?: string };
    const storeName = meta.store_name ?? "Unknown";
    storeMap[storeName] = (storeMap[storeName] ?? 0) + 1;
  }
  const buyClicksByStore = Object.entries(storeMap).map(([storeName, count]) => ({ storeName, count })).sort((a, b) => b.count - a.count);

  const recentBuyClicks = (buyRows ?? []).slice(0, 20).map((row) => {
    const r = row as Row;
    const meta = (r.metadata ?? {}) as { store_name?: string; glaze_id?: string; glaze_name?: string; glaze_brand?: string };
    return {
      id: String(r.id),
      glazeName: meta.glaze_name ?? null,
      glazeBrand: meta.glaze_brand ?? null,
      storeName: meta.store_name ?? null,
      createdAt: String(r.created_at),
    };
  });

  return {
    range,
    stats: {
      totalUsers: totalUsersRes.count ?? 0,
      newUsers: newUsersRes.count ?? 0,
      glazeViews: glazeViewsRes.count ?? 0,
      combinationsPublished: combosRes.count ?? 0,
      customGlazesCreated: customGlazesRes.count ?? 0,
      buyClicks: buyClicksRes.count ?? 0,
      totalInventoryItems: inventoryRes.count ?? 0,
    },
    recentActivity,
    recentCombinations,
    recentCustomGlazes,
    recentUsers,
    topGlazesByInventory,
    topGlazesByViews,
    buyClicksByStore,
    recentBuyClicks,
  };
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("profiles")
    .select("id, display_name, studio_name, points")
    .eq("contributions_disabled", false)
    .eq("is_admin", false)
    .gt("points", 0)
    .order("points", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    displayName: (row.display_name as string | null) ?? "Glaze member",
    studioName: (row.studio_name as string | null) ?? null,
    points: typeof row.points === "number" ? row.points : 0,
  }));
}

export async function getUserPointsRank(userId: string): Promise<number> {
  const admin = createSupabaseAdminClient();
  if (!admin) return 0;

  const { data: self } = await admin
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single();

  const userPoints = self?.points ?? 0;
  if (userPoints === 0) return 0;

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gt("points", userPoints)
    .eq("contributions_disabled", false)
    .eq("is_admin", false);

  return (count ?? 0) + 1;
}

export async function getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Pull all non-voided ledger rows from the past 7 days
  const { data: rows } = await admin
    .from("points_ledger")
    .select("user_id, points")
    .eq("voided", false)
    .gte("created_at", since);

  if (!rows || rows.length === 0) return [];

  // Aggregate per user in JS (no GROUP BY support in the JS client)
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const uid = String(row.user_id);
    totals[uid] = (totals[uid] ?? 0) + Number(row.points);
  }

  // Sort descending, keep top 10 user IDs
  const top10Ids = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([userId]) => userId);

  if (top10Ids.length === 0) return [];

  // Fetch profile names — exclude disabled/admin users
  const { data: profileRows } = await admin
    .from("profiles")
    .select("id, display_name, studio_name")
    .in("id", top10Ids)
    .eq("contributions_disabled", false)
    .eq("is_admin", false);

  if (!profileRows) return [];

  // Reassemble in rank order, dropping any filtered-out profiles
  return top10Ids
    .map((userId) => {
      const profile = profileRows.find((p) => String(p.id) === userId);
      if (!profile) return null;
      return {
        id: userId,
        displayName: (profile.display_name as string | null) ?? "Glaze member",
        studioName: (profile.studio_name as string | null) ?? null,
        points: Math.floor(totals[userId]),
      };
    })
    .filter((entry): entry is LeaderboardEntry => entry !== null);
}

export async function getModerationQueue(): Promise<ModerationQueue> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { combinations: [], customGlazes: [], firingImages: [] };
  type Row = Record<string, unknown>;

  const [combosRes, glazesRes, firingImagesRes] = await Promise.all([
    admin
      .from("user_combination_examples")
      .select("id, title, author_user_id, status, cone, atmosphere, notes, post_firing_image_path, created_at, moderation_state")
      .order("created_at", { ascending: true })
      .limit(200),
    admin
      .from("glazes")
      .select("id, name, brand, code, color_notes, finish_notes, image_url, created_by_user_id, created_at, moderation_state")
      .eq("source_type", "nonCommercial")
      .order("created_at", { ascending: true })
      .limit(200),
    admin
      .from("community_firing_images")
      .select("id, image_url, label, cone, atmosphere, uploader_user_id, glaze_id, combination_id, combination_type, created_at, moderation_state")
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  // Resolve author/creator/uploader display names in one round
  const userIds = new Set<string>();
  for (const row of combosRes.data ?? []) {
    const uid = (row as Row).author_user_id;
    if (uid) userIds.add(String(uid));
  }
  for (const row of glazesRes.data ?? []) {
    const uid = (row as Row).created_by_user_id;
    if (uid) userIds.add(String(uid));
  }
  for (const row of firingImagesRes.data ?? []) {
    const uid = (row as Row).uploader_user_id;
    if (uid) userIds.add(String(uid));
  }

  const userMap = new Map<string, string>();
  if (userIds.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", [...userIds]);
    for (const p of profiles ?? []) {
      userMap.set(String((p as Row).id), String((p as Row).display_name ?? "Unknown"));
    }
  }

  const combinations = (combosRes.data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: String(r.id),
      title: String(r.title ?? ""),
      authorName: userMap.get(String(r.author_user_id)) ?? "Unknown",
      authorId: String(r.author_user_id ?? ""),
      status: String(r.status ?? ""),
      cone: String(r.cone ?? ""),
      atmosphere: String(r.atmosphere ?? ""),
      notes: r.notes ? String(r.notes) : null,
      imageUrl: r.post_firing_image_path ? String(r.post_firing_image_path) : null,
      createdAt: String(r.created_at),
      moderationState: String(r.moderation_state ?? "pending"),
    };
  });

  const customGlazes = (glazesRes.data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: String(r.id),
      name: String(r.name ?? ""),
      brand: r.brand ? String(r.brand) : null,
      code: r.code ? String(r.code) : null,
      colorNotes: r.color_notes ? String(r.color_notes) : null,
      finishNotes: r.finish_notes ? String(r.finish_notes) : null,
      imageUrl: r.image_url ? String(r.image_url) : null,
      creatorName: userMap.get(String(r.created_by_user_id)) ?? "Unknown",
      creatorId: String(r.created_by_user_id ?? ""),
      createdAt: String(r.created_at),
      moderationState: String(r.moderation_state ?? "pending"),
    };
  });

  const firingImages = (firingImagesRes.data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: String(r.id),
      imageUrl: String(r.image_url ?? ""),
      label: r.label ? String(r.label) : null,
      cone: r.cone ? String(r.cone) : null,
      atmosphere: r.atmosphere ? String(r.atmosphere) : null,
      uploaderName: userMap.get(String(r.uploader_user_id)) ?? "Unknown",
      uploaderId: String(r.uploader_user_id ?? ""),
      glazeId: r.glaze_id ? String(r.glaze_id) : null,
      combinationId: r.combination_id ? String(r.combination_id) : null,
      combinationType: r.combination_type ? String(r.combination_type) : null,
      createdAt: String(r.created_at),
      moderationState: String(r.moderation_state ?? "pending"),
    };
  });

  return { combinations, customGlazes, firingImages };
}

const POINTS_ACTION_LABELS: Record<string, string> = {
  glaze_added: "Glazes added",
  combination_shared: "Combinations shared",
  firing_photo_uploaded: "Firing photos",
  comment_left: "Comments",
  tag_voted: "Tag votes",
  upvote_received: "Upvotes received",
};

export async function getUserPointsBreakdown(
  userId: string,
): Promise<PointsBreakdownEntry[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data: rows } = await admin
    .from("points_ledger")
    .select("action, points")
    .eq("user_id", userId)
    .eq("voided", false);

  if (!rows || rows.length === 0) return [];

  // Aggregate by action
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const action = String(row.action);
    totals[action] = (totals[action] ?? 0) + Number(row.points);
  }

  return Object.entries(totals)
    .filter(([, pts]) => pts > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([action, pts]) => ({
      action,
      label: POINTS_ACTION_LABELS[action] ?? action,
      points: pts,
    }));
}

// ── Direct messages ────────────────────────────────────────────────────────

export interface DirectMessageSummary {
  otherUserId: string;
  otherDisplayName: string;
  lastBody: string;
  lastCreatedAt: string;
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export async function getUnreadDirectMessageCount(userId: string): Promise<number> {
  const admin = createSupabaseAdminClient();
  if (!admin) return 0;
  const { count } = await admin
    .from("direct_messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function getDirectMessageConversations(
  userId: string,
): Promise<DirectMessageSummary[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data: rows } = await admin
    .from("direct_messages")
    .select("id, sender_user_id, recipient_user_id, body, created_at, read_at")
    .or(`sender_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!rows) return [];

  type Row = Record<string, unknown>;
  const byOther = new Map<string, DirectMessageSummary>();
  for (const r of rows as Row[]) {
    const sender = String(r.sender_user_id);
    const recipient = String(r.recipient_user_id);
    const other = sender === userId ? recipient : sender;
    const existing = byOther.get(other);
    const isUnreadForViewer = recipient === userId && r.read_at === null;
    if (!existing) {
      byOther.set(other, {
        otherUserId: other,
        otherDisplayName: "Unknown",
        lastBody: String(r.body ?? ""),
        lastCreatedAt: String(r.created_at),
        unreadCount: isUnreadForViewer ? 1 : 0,
      });
    } else if (isUnreadForViewer) {
      existing.unreadCount += 1;
    }
  }

  if (byOther.size === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", [...byOther.keys()]);
  for (const p of profiles ?? []) {
    const s = byOther.get(String((p as Record<string, unknown>).id));
    if (s) s.otherDisplayName = String((p as Record<string, unknown>).display_name ?? "Unknown");
  }

  return [...byOther.values()].sort((a, b) =>
    b.lastCreatedAt.localeCompare(a.lastCreatedAt),
  );
}

export async function getDirectMessagesWithUser(
  viewerUserId: string,
  otherUserId: string,
): Promise<DirectMessage[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("direct_messages")
    .select("id, sender_user_id, recipient_user_id, body, created_at, read_at")
    .or(
      `and(sender_user_id.eq.${viewerUserId},recipient_user_id.eq.${otherUserId}),and(sender_user_id.eq.${otherUserId},recipient_user_id.eq.${viewerUserId})`,
    )
    .order("created_at", { ascending: true })
    .limit(500);
  type Row = Record<string, unknown>;
  return (data ?? []).map((r) => {
    const row = r as Row;
    return {
      id: String(row.id),
      senderUserId: String(row.sender_user_id),
      recipientUserId: String(row.recipient_user_id),
      body: String(row.body ?? ""),
      createdAt: String(row.created_at),
      readAt: row.read_at ? String(row.read_at) : null,
    };
  });
}

