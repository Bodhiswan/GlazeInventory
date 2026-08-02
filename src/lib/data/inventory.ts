import { cache } from "react";

import { demoGlazes, demoInventory, demoInventoryFolders } from "@/lib/demo-data";
import { getAllCatalogGlazes, getCatalogGlazeById } from "@/lib/catalog";
import { parseInventoryState } from "@/lib/inventory-state";
import { formatGlazeLabel } from "@/lib/utils";
import type { Glaze, InventoryFolder, InventoryItem } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabase } from "@/lib/data/users";
import { attachTagSummariesToGlazes } from "@/lib/data/tags";

type GlazeRow = Database["public"]["Tables"]["glazes"]["Row"];
type InventoryFolderRow = Database["public"]["Tables"]["inventory_folders"]["Row"];
type InventoryItemRow = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryItemFolderRow = Database["public"]["Tables"]["inventory_item_folders"]["Row"];

// ─── Private helpers (copied from data.ts) ───────────────────────────────────

function getBundledVendorImageUrl(brand: string | null, code: string | null) {
  if (brand === "Coyote" && typeof code === "string" && code.trim()) {
    return `/vendor-images/coyote/${code.toLowerCase()}.jpg`;
  }

  return null;
}

function normalizeVendorImageUrl(value: string | null) {
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

export function mapGlaze(row: Partial<GlazeRow>): Glaze {
  const bundledImageUrl = getBundledVendorImageUrl(row.brand ?? null, row.code ?? null);

  return {
    id: String(row.id),
    sourceType: row.source_type === "nonCommercial" ? "nonCommercial" : "commercial",
    name: String(row.name),
    brand: row.brand ?? null,
    line: row.line ?? null,
    code: row.code ?? null,
    cone: row.cone ?? null,
    description: row.description ?? null,
    imageUrl: bundledImageUrl ?? normalizeVendorImageUrl(row.image_url ?? null),
    editorialSummary: row.editorial_summary ?? null,
    editorialSurface: row.editorial_surface ?? null,
    editorialApplication: row.editorial_application ?? null,
    editorialFiring: row.editorial_firing ?? null,
    editorialReviewedAt: row.editorial_reviewed_at ?? null,
    editorialReviewedByUserId: row.editorial_reviewed_by_user_id ?? null,
    atmosphere: row.atmosphere ?? null,
    finishNotes: row.finish_notes ?? null,
    colorNotes: row.color_notes ?? null,
    recipeNotes: row.recipe_notes ?? null,
    createdAt: row.created_at ?? null,
    createdByUserId: row.created_by_user_id ?? null,
  };
}

export function mapInventoryStatus(value: unknown) {
  if (value === "archived") {
    return "archived" as const;
  }

  if (value === "wishlist") {
    return "wishlist" as const;
  }

  return "owned" as const;
}

export function mapInventoryFolder(row: Pick<InventoryFolderRow, "id" | "user_id" | "name">): InventoryFolder {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
  };
}

type FolderJoinEntry = {
  folder: InventoryFolderRow | InventoryFolderRow[] | null;
};

export function mapInventoryFoldersFromJoinRows(value: FolderJoinEntry[] | unknown) {
  if (!Array.isArray(value)) {
    return [] as InventoryFolder[];
  }

  const folders = (value as FolderJoinEntry[])
    .map((entry) => {
      const folderSource = Array.isArray(entry.folder) ? entry.folder[0] : entry.folder;

      if (!folderSource) {
        return null;
      }

      return mapInventoryFolder(folderSource);
    })
    .filter((folder): folder is InventoryFolder => Boolean(folder));

  return Array.from(new Map(folders.map((folder) => [folder.id, folder])).values());
}

export type InventoryItemWithJoins = InventoryItemRow & {
  glaze?: Partial<GlazeRow> | Partial<GlazeRow>[] | null;
  inventory_item_folders?: (Omit<InventoryItemFolderRow, "inventory_item_id"> & {
    folder: InventoryFolderRow | InventoryFolderRow[] | null;
  })[];
};

export function mapInventoryItem(row: InventoryItemWithJoins): InventoryItem | null {
  const glazeRow = Array.isArray(row.glaze) ? row.glaze[0] : row.glaze;
  const inventoryState = parseInventoryState(row.personal_notes ?? null);
  const folders = mapInventoryFoldersFromJoinRows(row.inventory_item_folders);
  const glaze = getCatalogGlazeById(row.glaze_id) ?? (glazeRow ? mapGlaze(glazeRow) : null);

  // Catalog glazes use stable IDs from the bundled JSON. If a stale or
  // deleted custom row is ever left behind, omit it rather than rendering a
  // misleading blank inventory card.
  if (!glaze) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    glazeId: row.glaze_id,
    status: mapInventoryStatus(row.status),
    personalNotes: inventoryState.note,
    fillLevel: inventoryState.fillLevel,
    quantity: inventoryState.quantity,
    folders,
    folderIds: folders.map((folder) => folder.id),
    glaze,
  };
}

const INVENTORY_GLAZE_COLUMNS =
  "id,source_type,name,brand,line,code,cone,description,image_url,atmosphere,finish_notes,color_notes,recipe_notes,editorial_summary,editorial_surface,editorial_application,editorial_firing,created_at,created_by_user_id";
type SupabaseClient = NonNullable<Awaited<ReturnType<typeof getSupabase>>>;

/**
 * Resolve only database-backed glazes for inventory rows that are not part of
 * the bundled catalog. Inventory rows intentionally store the catalog's
 * semantic glaze ID, so this cannot rely on a PostgREST glaze relationship.
 */
export async function fetchInventoryGlazes(
  supabase: SupabaseClient,
  rows: Array<Pick<InventoryItemRow, "glaze_id">>,
) {
  const databaseGlazeIds = Array.from(
    new Set(rows.map((row) => row.glaze_id).filter((id) => !getCatalogGlazeById(id))),
  );

  if (!databaseGlazeIds.length) {
    return new Map<string, Partial<GlazeRow>>();
  }

  const { data } = await supabase
    .from("glazes")
    .select(INVENTORY_GLAZE_COLUMNS)
    .in("id", databaseGlazeIds);

  return new Map(
    (data ?? []).map((row) => [String(row.id), row as Partial<GlazeRow>] as const),
  );
}

// ─── Exported functions ───────────────────────────────────────────────────────

export const getCatalogGlazes = cache(async function getCatalogGlazes(viewerId: string) {
  const staticGlazes = getAllCatalogGlazes();

  // Merge in any glazes that live only in Supabase:
  //  • all custom (nonCommercial) glazes — visible to every viewer
  //  • commercial glazes for brands not yet in the bundled catalog JSON
  //    (newly imported brands like Opulence)
  // Two scoped queries instead of one unfiltered fetch so we don't hit
  // PostgREST's default 1000-row cap and silently lose late-alphabet rows.
  let dbGlazes: Glaze[] = [];
  const supabase = await getSupabase();
  if (supabase) {
    const staticIds = new Set(staticGlazes.map((g) => g.id));
    const staticBrands = new Set(
      staticGlazes.map((g) => g.brand).filter((b): b is string => Boolean(b)),
    );
    const cols =
      "id,source_type,name,brand,line,code,cone,description,image_url,atmosphere,finish_notes,color_notes,recipe_notes,created_at,created_by_user_id";

    const [customRes, dbOnlyCommercialRes] = await Promise.all([
      supabase.from("glazes").select(cols).eq("source_type", "nonCommercial"),
      staticBrands.size
        ? supabase
            .from("glazes")
            .select(cols)
            .eq("source_type", "commercial")
            .not("brand", "in", `(${[...staticBrands].map((b) => `"${b.replace(/"/g, '""')}"`).join(",")})`)
        : supabase.from("glazes").select(cols).eq("source_type", "commercial"),
    ]);

    dbGlazes = [...(customRes.data ?? []), ...(dbOnlyCommercialRes.data ?? [])]
      .filter((row) => !staticIds.has(row.id as string))
      .map((row) => mapGlaze(row));
  }

  // Deduplicate by ID — the static catalog historically had a few dupes.
  const seen = new Set<string>();
  const glazes = [...staticGlazes, ...dbGlazes]
    .filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    })
    .sort((left, right) => formatGlazeLabel(left).localeCompare(formatGlazeLabel(right)));
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
    id: row.id,
    glazeId: row.glaze_id,
    status: mapInventoryStatus(row.status),
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
    .select("id,user_id,glaze_id,status,personal_notes,inventory_item_folders(folder:inventory_folders(*))")
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as InventoryItemWithJoins[];
  const databaseGlazes = await fetchInventoryGlazes(supabase, rows);
  const inventory = rows
    .map((row) =>
      mapInventoryItem({
        ...row,
        glaze: databaseGlazes.get(row.glaze_id) ?? null,
      }),
    )
    .filter((item): item is InventoryItem => Boolean(item));

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

  const folders = (folderRows ?? []).map((row) => mapInventoryFolder(row));

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

  const counts = (assignmentRows ?? []).reduce<Map<string, number>>((map, row) => {
    const folderId = row.folder_id;
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
