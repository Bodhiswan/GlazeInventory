"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeOptional, requireMemberSupabase } from "./_shared";

const RETURN_TO = "/glazes/request";

export async function requestGlazeBrandAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase(RETURN_TO);

  const brand = normalizeOptional(formData.get("brandName"));
  const notes = normalizeOptional(formData.get("notes"));

  if (!brand) {
    redirect(`${RETURN_TO}?error=${encodeURIComponent("Tell us which brand you'd like added.")}`);
  }

  // Cast: glaze_brand_requests was added after the bundled database.types.ts
  // was generated. Run `supabase gen types` to remove the cast.
  const { error } = await (supabase.from("glaze_brand_requests" as never) as unknown as {
    insert: (row: { user_id: string; brand_name: string; notes: string | null }) => Promise<{ error: { message: string } | null }>;
  }).insert({
    user_id: viewer.profile.id,
    brand_name: brand,
    notes,
  });

  if (error) {
    redirect(`${RETURN_TO}?error=${encodeURIComponent(error.message)}`);
  }

  // Surface the request in the admin analytics activity feed.
  void supabase.from("analytics_events").insert({
    event_type: "brand_request",
    user_id: viewer.profile.id,
    glaze_id: null,
    metadata: { brand_name: brand, notes: notes ?? null },
  });

  revalidatePath("/admin/analytics");
  redirect(`${RETURN_TO}?saved=1`);
}
