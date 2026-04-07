import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const glazeId = searchParams.get("glazeId");
  const combinationId = searchParams.get("combinationId");

  if (!glazeId && !combinationId) {
    return NextResponse.json([], { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json([]);

  const query = supabase
    .from("community_firing_images")
    .select("id, image_url, label, cone, atmosphere, profiles!uploader_user_id(display_name)")
    .order("created_at", { ascending: false });

  const { data } = glazeId
    ? await query.eq("glaze_id", glazeId)
    : await query.eq("combination_id", combinationId!);

  type Row = Record<string, unknown>;
  const result = (data ?? []).map((r) => {
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

  return NextResponse.json(result);
}
