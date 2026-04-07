import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PointsAction =
  | "glaze_added"
  | "combination_shared"
  | "firing_photo_uploaded"
  | "comment_left"
  | "tag_voted"
  | "upvote_received";

/** Actions that have a lifetime cap on total points earned */
const ACTION_CAPS: Partial<Record<PointsAction, number>> = {
  comment_left: 50,
  tag_voted: 50,
};

/**
 * Award points to a user. No-ops for admins.
 * Writes a ledger row and recomputes the cached total on profiles from all ledger rows.
 */
export async function awardPoints(
  userId: string,
  isAdmin: boolean,
  action: PointsAction,
  points: number,
  referenceId?: string,
  referenceType?: string,
): Promise<void> {
  if (isAdmin) return;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    console.error("[awardPoints] Admin client unavailable — SUPABASE_SERVICE_ROLE_KEY may be missing");
    return;
  }

  const cap = ACTION_CAPS[action];

  if (cap !== undefined) {
    const { data: rows } = await admin
      .from("points_ledger")
      .select("points")
      .eq("user_id", userId)
      .eq("action", action)
      .eq("voided", false);

    const earned = (rows ?? []).reduce((sum, r) => sum + Number(r.points), 0);
    if (earned >= cap) return;
  }

  const { error: insertError } = await admin.from("points_ledger").insert({
    user_id: userId,
    action,
    points,
    reference_id: referenceId ?? null,
    reference_type: referenceType ?? null,
  });

  if (insertError) {
    console.error("[awardPoints] Failed to insert ledger row:", insertError.message);
    return;
  }

  // Recompute total from ALL non-voided ledger rows (avoids integer truncation
  // when fractional values like 0.1 are accumulated).
  const { data: allRows } = await admin
    .from("points_ledger")
    .select("points")
    .eq("user_id", userId)
    .eq("voided", false);

  const newTotal = Math.floor(
    (allRows ?? []).reduce((sum, r) => sum + Number(r.points), 0),
  );

  await admin
    .from("profiles")
    .update({ points: newTotal })
    .eq("id", userId);
}
