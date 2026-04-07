import { demoGlazes, demoPairs, demoPosts } from "@/lib/demo-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatGlazeLabel } from "@/lib/utils";
import type {
  CombinationPair,
  CombinationPost,
} from "@/lib/types";
import { getSupabase, requireViewer } from "@/lib/data/users";
import {
  getPublishedCombinationPosts,
  mapPair,
  attachGlazesToPosts,
  hydratePosts,
} from "@/lib/data/combinations";
import { attachTagSummariesToGlazes } from "@/lib/data/tags";

type Row = Record<string, unknown>;

// ─── Exported functions/types ─────────────────────────────────────────────────

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
