import { cache } from "react";

import { demoGlazes, demoInventory, demoInventoryFolders } from "@/lib/demo-data";
import { getAllCatalogGlazes, getTagDefinitions } from "@/lib/catalog";
import { parseInventoryState } from "@/lib/inventory-state";
import { formatGlazeLabel } from "@/lib/utils";
import type { Glaze, GlazeTagSummary, InventoryFolder, InventoryItem, Viewer } from "@/lib/types";
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

const INVENTORY_GLAZE_COLUMNS = "id,source_type,name,brand,line,code,cone,description,image_url,atmosphere,finish_notes,color_notes";

// ─── Exported functions ───────────────────────────────────────────────────────

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
