"use server";

import { z } from "zod";

import { getSupabase } from "@/lib/data/users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface EngagementComment {
  id: string;
  body: string;
  authorId: string;
  author: string;
  date: string;
}

export interface Engagement {
  likes: number;
  comments: EngagementComment[];
}

const EMPTY: Engagement = { likes: 0, comments: [] };
const target = z.object({ kind: z.enum(["glaze", "combination"]), id: z.string().uuid() });

/**
 * The public like count and newest comments for a glaze or a combination.
 * Comments are read as the visitor (so row-level security still applies); the
 * like count and author names come from the service client because they are
 * shown to everyone.
 */
export async function getEngagementAction(kind: "glaze" | "combination", id: string): Promise<Engagement> {
  const parsed = target.safeParse({ kind, id });
  const supabase = await getSupabase();
  if (!parsed.success || !supabase) return EMPTY;

  const admin = createSupabaseAdminClient();
  const [likeRes, commentRes] = await Promise.all([
    admin
      ? admin
          .from("user_favourites")
          .select("id", { count: "exact", head: true })
          .eq("target_type", kind)
          .eq("target_id", id)
      : null,
    kind === "glaze"
      ? supabase
          .from("glaze_comments")
          .select("id, body, author_user_id, created_at")
          .eq("glaze_id", id)
          .order("created_at", { ascending: false })
          .limit(30)
      : supabase
          .from("combination_comments")
          .select("id, body, author_user_id, created_at")
          .eq("example_id", id)
          .order("created_at", { ascending: false })
          .limit(30),
  ]);

  const rows = commentRes.data ?? [];
  const names = new Map<string, string>();
  const authorIds = [...new Set(rows.map((row) => String(row.author_user_id)))];
  if (admin && authorIds.length) {
    const { data } = await admin.from("profiles").select("id, display_name").in("id", authorIds);
    for (const profile of data ?? []) names.set(String(profile.id), profile.display_name);
  }

  return {
    likes: likeRes?.count ?? 0,
    comments: rows.map((row) => ({
      id: String(row.id),
      body: row.body,
      authorId: String(row.author_user_id),
      author: names.get(String(row.author_user_id)) || "A potter",
      date: new Date(row.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
    })),
  };
}
