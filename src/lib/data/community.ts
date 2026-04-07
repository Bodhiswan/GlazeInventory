import { cache } from "react";

import { demoGlazes, demoPairs, demoPosts, demoProfiles } from "@/lib/demo-data";
import { getCatalogGlazesByIds, getTagDefinitions } from "@/lib/catalog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatGlazeLabel } from "@/lib/utils";
import type {
  CombinationPair,
  CombinationPost,
  Glaze,
  GlazeTagSummary,
  UserProfile,
  Viewer,
} from "@/lib/types";
import { getSupabase, requireViewer, mapProfile } from "@/lib/data/users";
import { getPublishedCombinationPosts } from "@/lib/data/combinations";

type Row = Record<string, unknown>;

// ─── Private helpers (copied from data.ts) ───────────────────────────────────

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

function mapPair(row: Row): CombinationPair {
  return {
    id: String(row.id),
    glazeAId: String(row.glaze_a_id),
    glazeBId: String(row.glaze_b_id),
    pairKey: String(row.pair_key),
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
