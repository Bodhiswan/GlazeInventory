import { demoGlazes, demoPairs, demoPosts, demoProfiles } from "@/lib/demo-data";
import { buildCombinationSummaries, parsePairKey } from "@/lib/combinations";
import {
  getCatalogGlazesByIds,
  getCatalogGlazeById,
  getAllVendorExamples,
  getVendorExampleById,
  type StaticExample,
} from "@/lib/catalog";
import { parseInventoryState } from "@/lib/inventory-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CombinationDetail,
  CombinationPair,
  CombinationPost,
  Glaze,
  VendorCombinationExample,
  VendorCombinationExampleLayer,
  UserCombinationExample,
  UserCombinationExampleLayer,
} from "@/lib/types";
import { getSupabase, mapProfile } from "@/lib/data/users";
import { getInventoryOwnership } from "@/lib/data/inventory";
import { attachTagSummariesToGlazes } from "@/lib/data/tags";

type Row = Record<string, unknown>;

// ─── Private helpers ──────────────────────────────────────────────────────────

export function mapPair(row: Row): CombinationPair {
  return {
    id: String(row.id),
    glazeAId: String(row.glaze_a_id),
    glazeBId: String(row.glaze_b_id),
    pairKey: String(row.pair_key),
  };
}

export async function getGlazesByIds(
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

export async function getPairsByIds(
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

export async function getProfilesByIds(
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

  const { data } = await supabase.from("profiles").select("id,display_name,is_admin").in("id", profileIds);
  return (data ?? []).map((row) => mapProfile(row as Row));
}

export function attachGlazesToPosts(posts: CombinationPost[], pairs: CombinationPair[], glazes: Glaze[]) {
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

export async function hydratePosts(
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

// ─── Exported functions ───────────────────────────────────────────────────────

export async function getCombinationSummaries(viewerId: string) {
  const [ownership, postCounts] = await Promise.all([
    getInventoryOwnership(viewerId),
    getPostCountsByPairKey(),
  ]);
  const ownedGlazeIds = ownership.filter((item) => item.status === "owned").map((item) => item.glazeId);
  const ownedGlazes = getCatalogGlazesByIds(ownedGlazeIds);

  return buildCombinationSummaries(ownedGlazes, postCounts);
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

  // Collect all glaze IDs that aren't in the static catalog so we can fetch them from the DB
  const allLayerRows = exampleRows.flatMap((row: Row) =>
    ((row.user_combination_example_layers ?? []) as Row[]).map((l) => String(l.glaze_id))
  );
  const missingIds = [...new Set(allLayerRows.filter((id) => !getCatalogGlazeById(id)))];
  const dbGlazeMap = new Map<string, Glaze>();
  if (missingIds.length > 0) {
    const { data: dbGlazes } = await supabase
      .from("glazes")
      .select("id,source_type,name,brand,line,code,cone,image_url,description")
      .in("id", missingIds);
    for (const g of dbGlazes ?? []) {
      dbGlazeMap.set(String(g.id), {
        id: String(g.id),
        sourceType: (g.source_type as Glaze["sourceType"]) ?? "nonCommercial",
        name: String(g.name),
        brand: g.brand ? String(g.brand) : null,
        line: g.line ? String(g.line) : null,
        code: g.code ? String(g.code) : null,
        cone: g.cone ? String(g.cone) : null,
        description: g.description ? String(g.description) : null,
        imageUrl: g.image_url ? String(g.image_url) : null,
      });
    }
  }

  return exampleRows.map((row: Row & { user_combination_example_layers?: Row[]; profiles?: Row | null }) => {
    const rawLayers = (row.user_combination_example_layers ?? []) as Row[];
    const sortedLayers = rawLayers
      .sort((a, b) => Number(a.layer_order) - Number(b.layer_order));

    const layers: UserCombinationExampleLayer[] = sortedLayers.map((layer) => {
      const glazeId = String(layer.glaze_id);
      const glaze = getCatalogGlazeById(glazeId) ?? dbGlazeMap.get(glazeId) ?? null;
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
      imageUrls: Array.isArray(row.image_paths) ? (row.image_paths as string[]) : [],
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
