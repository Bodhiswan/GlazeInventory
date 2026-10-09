import "server-only";

import { cache } from "react";

import { getCatalogFiringImages } from "@/lib/catalog";
import { getUserCombinationExamples } from "@/lib/data/combinations";
import { getFavouriteIds, getUnreadDirectMessageCount } from "@/lib/data/community";
import { getInventory, getInventoryFolders } from "@/lib/data/inventory";
import { getStudioForOwner } from "@/lib/data/studios";
import { getViewer } from "@/lib/data/users";
import type { UserCombinationExample } from "@/lib/types";
import { getCone6Catalog, toNLGlaze } from "./catalog";
import { isCone6 } from "./cone";
import type { NLCombo, NLFolder, NLGlaze, NLShelfItem, NLStudio } from "./types";

export interface NLViewer {
  id: string;
  name: string;
  isAdmin: boolean;
  /** Demo mode (no Supabase) can browse but not save. */
  readOnly: boolean;
}

export interface NLViewerState {
  viewer: NLViewer | null;
  /** Keyed by glaze ID. */
  shelf: Record<string, NLShelfItem & { inventoryId: string }>;
  /** Shelf glazes that aren't in the Cone 6 catalogue (other cones, or the user's own glazes). */
  extraGlazes: NLGlaze[];
  savedGlazes: string[];
  savedCombos: string[];
  folders: NLFolder[];
  studio: NLStudio | null;
  unreadMessages: number;
}

export const EMPTY_VIEWER_STATE: NLViewerState = {
  viewer: null, shelf: {}, extraGlazes: [], savedGlazes: [], savedCombos: [], folders: [], studio: null, unreadMessages: 0,
};

/** Everything the layout needs to know about the signed-in person. Guests get empty state. Cached per request. */
export const getNLViewerState = cache(async function getNLViewerState(): Promise<NLViewerState> {
  const viewer = await getViewer();
  if (!viewer || viewer.profile.isAnonymous) return EMPTY_VIEWER_STATE;
  const id = viewer.profile.id;
  const [inventory, savedGlazes, savedCombos, folders, studio, unreadMessages] = await Promise.all([
    getInventory(id),
    getFavouriteIds(id, "glaze"),
    getFavouriteIds(id, "combination"),
    getInventoryFolders(id),
    viewer.mode === "live" ? getStudioForOwner(id) : Promise.resolve(null),
    viewer.mode === "live" ? getUnreadDirectMessageCount(id) : Promise.resolve(0),
  ]);

  const catalogIds = new Set(getCone6Catalog().glazes.map((glaze) => glaze.id));
  const shelf: NLViewerState["shelf"] = {};
  const extraGlazes: NLGlaze[] = [];
  for (const item of inventory) {
    shelf[item.glazeId] = {
      inventoryId: item.id,
      // "Used up" (archived) isn't shown separately; those jars need re-buying, so they sit on the wishlist.
      status: item.status === "owned" ? "owned" : "wishlist",
      fill: item.fillLevel ?? "full",
      quantity: item.quantity ?? 1,
      note: item.personalNotes ?? "",
      sharedWithStudio: false,
      folderIds: item.folderIds ?? [],
    };
    if (!catalogIds.has(item.glazeId) && item.glaze) {
      extraGlazes.push(toNLGlaze(item.glaze, getCatalogFiringImages(item.glazeId)));
    }
  }

  return {
    viewer: { id, name: viewer.profile.displayName, isAdmin: Boolean(viewer.profile.isAdmin), readOnly: viewer.mode === "demo" },
    shelf,
    extraGlazes,
    savedGlazes,
    savedCombos,
    folders: folders.map((folder) => ({ id: folder.id, name: folder.name })),
    studio: studio
      ? { name: studio.displayName, slug: studio.slug, passcode: studio.passcode, renames: studio.renameCount, firingRange: studio.firingRange }
      : null,
    unreadMessages,
  };
});

/** Published potters' results as combos. Only Cone 6 results whose glazes are known are included. */
export async function getPotterCombos(viewerId: string | null, extraGlazes: NLGlaze[] = []): Promise<NLCombo[]> {
  const examples = await getUserCombinationExamples(viewerId ?? "public-guest-viewer");
  const known = new Set([...getCone6Catalog().glazes, ...extraGlazes].map((glaze) => glaze.id));
  return examples
    .filter((example) => isCone6(example.cone) && example.layers.length >= 1 && example.layers.every((layer) => known.has(layer.glazeId)))
    .map((example) => potterCombo(example, viewerId));
}

/**
 * The viewer's own results at any cone, so nothing they posted disappears. Glazes the
 * Cone 6 catalogue doesn't cover come back alongside so the layers can still be shown.
 */
export async function getMyResults(viewerId: string, extraGlazes: NLGlaze[] = []): Promise<{ combos: NLCombo[]; glazes: NLGlaze[] }> {
  const examples = (await getUserCombinationExamples(viewerId)).filter((example) => example.authorUserId === viewerId);
  const known = new Set([...getCone6Catalog().glazes, ...extraGlazes].map((glaze) => glaze.id));
  const glazes = new Map<string, NLGlaze>();
  for (const example of examples) {
    for (const layer of example.layers) {
      if (!known.has(layer.glazeId) && layer.glaze && !glazes.has(layer.glazeId)) glazes.set(layer.glazeId, toNLGlaze(layer.glaze));
    }
  }
  return { combos: examples.map((example) => potterCombo(example, viewerId)), glazes: [...glazes.values()] };
}

function potterCombo(example: UserCombinationExample, viewerId: string | null): NLCombo {
  // Posted layers are stored top layer first, the same as vendor combos.
  const layers = [...example.layers].sort((a, b) => a.layerOrder - b.layerOrder);
  return {
    id: example.id,
    title: example.title,
    image: example.imageUrls[0] ?? null,
    vendor: "Potter",
    url: null,
    clay: example.clayBody ?? null,
    notes: [example.glazingProcess, example.notes].filter(Boolean).join(" ") || null,
    firing: example.kilnNotes ?? null,
    layers: layers.map((layer, i) => ({ g: layer.glazeId, to: i < layers.length - 1 ? "Over" : null })),
    ...(isCone6(example.cone) ? {} : { cone: example.cone }),
    potter: {
      name: example.authorName,
      date: new Date(example.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
      mine: example.authorUserId === viewerId,
    },
  };
}
