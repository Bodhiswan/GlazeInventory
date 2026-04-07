import { getCatalogGlazeById, getCatalogFiringImages, getCatalogFiringImageMap } from "@/lib/catalog";
import type { Glaze, GlazeComment, GlazeDetail, InventoryItem } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabase } from "@/lib/data/users";
import { attachTagSummariesToGlazes } from "@/lib/data/tags";
import { mapInventoryItem, type InventoryItemWithJoins } from "@/lib/data/inventory";

type GlazeCommentRow = Database["public"]["Tables"]["glaze_comments"]["Row"];

// ─── Exported functions ───────────────────────────────────────────────────────

// Synchronous — reads from local catalog JSON, no Supabase call
export function getGlazeStaticDetail(glazeId: string) {
  const rawGlaze = getCatalogGlazeById(glazeId);
  if (!rawGlaze) return null;
  const firingImages = getCatalogFiringImages(glazeId);
  return { glaze: rawGlaze, firingImages };
}

// Async — makes Supabase calls for user-specific data
export async function getGlazeUserState(viewerId: string, glazeId: string) {
  const supabase = await getSupabase();

  if (!supabase) {
    return {
      comments: [] as GlazeComment[],
      viewerInventoryItem: null as InventoryItem | null,
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
      .select("id,user_id,glaze_id,status,fill_level,quantity,personal_notes,glaze:glazes(*),inventory_item_folders(folder:inventory_folders(*))")
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

  const comments: GlazeComment[] = (commentRows ?? []).map((row) => ({
    id: String(row.id),
    glazeId: String(row.glaze_id),
    authorUserId: String(row.author_user_id),
    authorName: String((row.author as { display_name?: string } | null)?.display_name ?? "Glaze member"),
    body: String(row.body),
    createdAt: String(row.created_at),
  }));

  return {
    comments,
    viewerInventoryItem: inventoryRows?.length ? mapInventoryItem(inventoryRows[0] as unknown as InventoryItemWithJoins) : null,
    viewerHasFavourited: Boolean(favouriteRows?.length),
  };
}

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

  type CommentWithAuthor = GlazeCommentRow & {
    author: { display_name: string } | { display_name: string }[] | null;
  };

  const comments: GlazeComment[] = (commentRows ?? []).map((row) => {
    const typedRow = row as unknown as CommentWithAuthor;
    const authorSource = typedRow.author;
    const author = Array.isArray(authorSource) ? authorSource[0] : authorSource;
    return {
      id: typedRow.id,
      glazeId: typedRow.glaze_id,
      authorUserId: typedRow.author_user_id,
      authorName: author?.display_name ?? "Glaze member",
      body: typedRow.body,
      createdAt: typedRow.created_at,
    };
  });

  return {
    glaze,
    firingImages,
    comments,
    viewerOwnsGlaze: inventoryRows?.length
      ? mapInventoryItem(inventoryRows[0] as unknown as InventoryItemWithJoins).status === "owned"
      : false,
    viewerInventoryItem: inventoryRows?.length
      ? mapInventoryItem(inventoryRows[0] as unknown as InventoryItemWithJoins)
      : null,
    viewerHasFavourited: Boolean(favouriteRows?.length),
  };
}
