import { cache } from "react";

import { demoGlazes } from "@/lib/demo-data";
import { getCatalogGlazeById, getCatalogFiringImages, getCatalogFiringImageMap, getTagDefinitions } from "@/lib/catalog";
import { parseInventoryState } from "@/lib/inventory-state";
import type { Glaze, GlazeComment, GlazeDetail, GlazeFiringImage, GlazeTagSummary, InventoryFolder, InventoryItem, Viewer } from "@/lib/types";
import { getSupabase } from "@/lib/data/users";

type Row = Record<string, unknown>;

// ─── Private helpers (copied from data.ts) ───────────────────────────────────

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

function mapInventoryStatus(value: unknown) {
  if (value === "archived") {
    return "archived" as const;
  }

  if (value === "wishlist") {
    return "wishlist" as const;
  }

  return "owned" as const;
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

// ─── Exported functions ───────────────────────────────────────────────────────

export function getGlazeFiringImageMap(glazeIds: string[]) {
  return getCatalogFiringImageMap(glazeIds);
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
