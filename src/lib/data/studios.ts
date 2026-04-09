import "server-only";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabase } from "@/lib/data/users";
import { getCatalogGlazeById } from "@/lib/catalog";
import { glazeMatchesStudioFiring, isStudioFiringRange, type StudioFiringRange } from "@/lib/studio-firing";
import type { Glaze } from "@/lib/types";

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
type LooseClient = { from: (t: string) => { select: (...a: unknown[]) => unknown; insert: (...a: unknown[]) => unknown; update: (...a: unknown[]) => unknown; delete: (...a: unknown[]) => unknown } };
function loose(client: unknown): LooseClient {
  return client as LooseClient;
}

/** Find a studio by current slug. Public-readable, so any client works. */
export const getStudioBySlug = cache(async function getStudioBySlug(slug: string) {
  const admin = createSupabaseAdminClient();
  const client = admin ?? (await getSupabase());
  if (!client) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = loose(client).from("studios").select("*") as any;
  const { data } = await q.ilike("slug", slug).limit(1).maybeSingle();
  if (!data) return null;
  return mapStudio(data as Record<string, unknown>);
});

export async function getStudioForOwner(ownerUserId: string) {
  const supabase = await getSupabase();
  if (!supabase) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = loose(supabase).from("studios").select("*") as any;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = loose(client)
    .from("inventory_items")
    .select(
      "glaze_id, shared_with_studio, glaze:glazes(id,source_type,name,brand,line,code,cone,description,image_url,atmosphere,finish_notes,color_notes,recipe_notes,editorial_summary,editorial_surface,editorial_application,editorial_firing)"
    ) as any;
  const { data } = await q.eq("user_id", studio.ownerUserId).eq("shared_with_studio", true);
  const rows = (data ?? []) as Array<{
    glaze_id: string;
    glaze: Record<string, unknown> | Record<string, unknown>[] | null;
  }>;
  const glazes: Glaze[] = [];
  for (const row of rows) {
    const g = Array.isArray(row.glaze) ? row.glaze[0] : row.glaze;
    if (!g) {
      const fromCatalog = getCatalogGlazeById(String(row.glaze_id));
      if (fromCatalog) glazes.push(fromCatalog);
      continue;
    }
    glazes.push({
      id: String(g.id),
      sourceType: g.source_type === "nonCommercial" ? "nonCommercial" : "commercial",
      name: String(g.name),
      brand: (g.brand as string | null) ?? null,
      line: (g.line as string | null) ?? null,
      code: (g.code as string | null) ?? null,
      cone: (g.cone as string | null) ?? null,
      description: (g.description as string | null) ?? null,
      imageUrl: (g.image_url as string | null) ?? null,
      atmosphere: (g.atmosphere as string | null) ?? null,
      finishNotes: (g.finish_notes as string | null) ?? null,
      colorNotes: (g.color_notes as string | null) ?? null,
      recipeNotes: (g.recipe_notes as string | null) ?? null,
      editorialSummary: (g.editorial_summary as string | null) ?? null,
      editorialSurface: (g.editorial_surface as string | null) ?? null,
      editorialApplication: (g.editorial_application as string | null) ?? null,
      editorialFiring: (g.editorial_firing as string | null) ?? null,
    });
  }
  const filtered = glazes.filter((g) => glazeMatchesStudioFiring(g.cone, effectiveRange));
  return filtered.sort(
    (a, b) => (a.brand ?? "").localeCompare(b.brand ?? "") || a.name.localeCompare(b.name)
  );
}

/** Inventory rows for studio settings UI: glaze + currently-shared flag. */
export async function getOwnerInventoryShareList(ownerUserId: string) {
  const supabase = await getSupabase();
  if (!supabase) return [] as Array<{ inventoryId: string; glaze: Glaze; shared: boolean }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = loose(supabase)
    .from("inventory_items")
    .select(
      "id, status, shared_with_studio, glaze:glazes(id,source_type,name,brand,line,code,cone,image_url)"
    ) as any;
  const { data } = await q.eq("user_id", ownerUserId).eq("status", "owned");
  const rows = (data ?? []) as Array<{
    id: string;
    shared_with_studio: boolean;
    glaze: Record<string, unknown> | Record<string, unknown>[] | null;
  }>;
  return rows
    .map((row) => {
      const g = Array.isArray(row.glaze) ? row.glaze[0] : row.glaze;
      if (!g) return null;
      const glaze: Glaze = {
        id: String(g.id),
        sourceType: g.source_type === "nonCommercial" ? "nonCommercial" : "commercial",
        name: String(g.name),
        brand: (g.brand as string | null) ?? null,
        line: (g.line as string | null) ?? null,
        code: (g.code as string | null) ?? null,
        cone: (g.cone as string | null) ?? null,
        description: null,
        imageUrl: (g.image_url as string | null) ?? null,
      };
      return { inventoryId: String(row.id), glaze, shared: Boolean(row.shared_with_studio) };
    })
    .filter((entry): entry is { inventoryId: string; glaze: Glaze; shared: boolean } => Boolean(entry))
    .sort(
      (a, b) =>
        (a.glaze.brand ?? "").localeCompare(b.glaze.brand ?? "") ||
        a.glaze.name.localeCompare(b.glaze.name)
    );
}
