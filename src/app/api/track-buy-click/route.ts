import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { glazeId, storeId, storeName, url } = (await req.json()) as {
      glazeId?: string;
      storeId?: string;
      storeName?: string;
      url?: string;
    };

    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: true });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert({
      event_type: "buy_click",
      user_id: user?.id ?? null,
      // Don't pass glaze_id — catalog glaze IDs don't match the DB's glazes table,
      // which would cause a FK violation. Store the ID in metadata instead.
      glaze_id: null,
      metadata: { glaze_id: glazeId ?? null, store_id: storeId, store_name: storeName, url },
    });
  } catch {
    // Tracking is non-critical — never error the client
  }

  return NextResponse.json({ ok: true });
}
