import { requireViewer, getSupabase } from "@/lib/data/users";
import {
  demoPosts,
  demoReports,
} from "@/lib/demo-data";
import type {
  ModerationQueue,
  ModerationItem,
  Report,
} from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hydratePosts } from "@/lib/data/combinations";

type Row = Record<string, unknown>;

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

export async function getModerationQueue(): Promise<ModerationQueue> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { combinations: [], customGlazes: [], firingImages: [] };

  const [combosRes, glazesRes, firingImagesRes] = await Promise.all([
    admin
      .from("user_combination_examples")
      .select("id, title, author_user_id, status, cone, atmosphere, notes, image_paths, created_at, moderation_state")
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
      imageUrl: Array.isArray(r.image_paths) ? ((r.image_paths as string[])[0] ?? null) : null,
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
