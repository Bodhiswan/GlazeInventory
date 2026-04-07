import { getCatalogGlazeById, getCatalogFiringImages, getCatalogFiringImageMap } from "@/lib/catalog";
import type { Glaze, GlazeComment, GlazeDetail } from "@/lib/types";
import { getSupabase } from "@/lib/data/users";
import { attachTagSummariesToGlazes } from "@/lib/data/tags";
import { mapInventoryItem } from "@/lib/data/inventory";

type Row = Record<string, unknown>;

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
