import "server-only";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabase } from "@/lib/data/users";
import { getCatalogGlazeById } from "@/lib/catalog";
import { glazeMatchesStudioFiring, isStudioFiringRange, type StudioFiringRange } from "@/lib/studio-firing";
import type { Glaze } from "@/lib/types";
import { mapGlaze } from "@/lib/data/inventory";

export type Studio = {
  id: string;
  ownerUserId: string;
  slug: string;
  displayName: string;
  passcodeHash: string;
  passcode: string;
  renameCount: number;
  firingRange: StudioFiringRange;
  createdAt: string;
};

function mapStudio(row: Record<string, unknown>): Studio {
  const firingRaw = row.firing_range;
  const firingRange: StudioFiringRange = isStudioFiringRange(firingRaw) ? firingRaw : "both";
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    passcodeHash: String(row.passcode_hash),
    passcode: String(row.passcode ?? ""),
    renameCount: Number(row.rename_count ?? 0),
    firingRange,
    createdAt: String(row.created_at),
  };
}

// The studios + studio_visitor_logs tables aren't yet in the generated DB
// types, so we cast loosely here. Once `npm run db:types` is run these can
// be tightened.
type LooseQuery = {
  select: (...args: unknown[]) => LooseQuery;
  ilike: (...args: unknown[]) => LooseQuery;
  eq: (...args: unknown[]) => LooseQuery;
  in: (...args: unknown[]) => LooseQuery;
  limit: (...args: unknown[]) => LooseQuery;
  maybeSingle: () => Promise<{ data: unknown }>;
  then: Promise<{ data: unknown }>["then"];
};
type LooseClient = { from: (table: string) => LooseQuery };
function loose(client: unknown): LooseClient {
  return client as LooseClient;
}

const STUDIO_GLAZE_COLUMNS =
  "id,source_type,name,brand,line,code,cone,description,image_url,atmosphere,finish_notes,color_notes,recipe_notes,editorial_summary,editorial_surface,editorial_application,editorial_firing";

async function fetchDatabaseGlazes(client: unknown, glazeIds: string[]) {
  if (!glazeIds.length) return new Map<string, Glaze>();

  const { data } = await loose(client)
    .from("glazes")
    .select(STUDIO_GLAZE_COLUMNS)
    .in("id", glazeIds);
  const rows = Array.isArray(data) ? data : [];

  return new Map(
    rows.map((row) => {
      const record = row as Record<string, unknown>;
      return [String(record.id), mapGlaze(record as Parameters<typeof mapGlaze>[0])] as const;
    }),
  );
}

/** Find a studio by current slug. Public-readable, so any client works. */
export const getStudioBySlug = cache(async function getStudioBySlug(slug: string) {
  const admin = createSupabaseAdminClient();
  const client = admin ?? (await getSupabase());
  if (!client) return null;
  const q = loose(client).from("studios").select("*");
  const { data } = await q.ilike("slug", slug).limit(1).maybeSingle();
  if (!data) return null;
  return mapStudio(data as Record<string, unknown>);
});

export async function getStudioForOwner(ownerUserId: string) {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const q = loose(supabase).from("studios").select("*");
  const { data } = await q.eq("owner_user_id", ownerUserId).maybeSingle();
  if (!data) return null;
  return mapStudio(data as Record<string, unknown>);
}

/** Glazes a studio is sharing publicly (inventory items flagged shared_with_studio). */
export async function getStudioSharedGlazes(
  studio: Studio,
  effectiveRange: StudioFiringRange = studio.firingRange,
): Promise<Glaze[]> {
  const admin = createSupabaseAdminClient();
  const client = admin ?? (await getSupabase());
  if (!client) return [];
  const q = loose(client).from("inventory_items").select("glaze_id, shared_with_studio");
  const { data } = await q.eq("user_id", studio.ownerUserId).eq("shared_with_studio", true);
  const rows = (Array.isArray(data) ? data : []) as Array<{ glaze_id: string }>;
  const databaseIds = rows
    .map((row) => row.glaze_id)
    .filter((id) => !getCatalogGlazeById(id));
  const databaseGlazes = await fetchDatabaseGlazes(client, databaseIds);
  const glazes = rows
    .map((row) => getCatalogGlazeById(row.glaze_id) ?? databaseGlazes.get(row.glaze_id) ?? null)
    .filter((glaze): glaze is Glaze => Boolean(glaze));
  const filtered = glazes.filter((g) => glazeMatchesStudioFiring(g.cone, effectiveRange));
  return filtered.sort(
    (a, b) => (a.brand ?? "").localeCompare(b.brand ?? "") || a.name.localeCompare(b.name)
  );
}

/** Inventory rows for studio settings UI: glaze + currently-shared flag. */
export async function getOwnerInventoryShareList(ownerUserId: string) {
  const supabase = await getSupabase();
  if (!supabase) return [] as Array<{ inventoryId: string; glaze: Glaze; shared: boolean }>;
  const q = loose(supabase).from("inventory_items").select("id, status, shared_with_studio, glaze_id");
  const { data } = await q.eq("user_id", ownerUserId).eq("status", "owned");
  const rows = (Array.isArray(data) ? data : []) as Array<{
    id: string;
    shared_with_studio: boolean;
    glaze_id: string;
  }>;
  const databaseIds = rows
    .map((row) => row.glaze_id)
    .filter((id) => !getCatalogGlazeById(id));
  const databaseGlazes = await fetchDatabaseGlazes(supabase, databaseIds);
  return rows
    .map((row) => {
      const glaze = getCatalogGlazeById(row.glaze_id) ?? databaseGlazes.get(row.glaze_id);
      if (!glaze) return null;
      return { inventoryId: String(row.id), glaze, shared: Boolean(row.shared_with_studio) };
    })
    .filter((entry): entry is { inventoryId: string; glaze: Glaze; shared: boolean } => Boolean(entry))
    .sort(
      (a, b) =>
        (a.glaze.brand ?? "").localeCompare(b.glaze.brand ?? "") ||
        a.glaze.name.localeCompare(b.glaze.name)
    );
}
