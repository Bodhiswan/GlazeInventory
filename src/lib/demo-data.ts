import { createPairKey } from "@/lib/combinations";
import type {
  CombinationPair,
  CombinationPost,
  Glaze,
  GlazeTagSummary,
  InventoryFolder,
  InventoryItem,
  Report,
  UserProfile,
} from "@/lib/types";

export const demoProfiles: UserProfile[] = [
  {
    id: "b84a8cdb-1111-4fc4-95e9-d67ec72fbe00",
    email: "demo@glazelibrary.app",
    displayName: "Bodhi Swan",
    studioName: "Swan Ceramics",
    location: "Brisbane",
  },
  {
    id: "b84a8cdb-2222-4fc4-95e9-d67ec72fbe00",
    email: "kira@example.com",
    displayName: "Kira Marsh",
    studioName: "Marsh Clay Works",
    location: "Byron Bay",
  },
  {
    id: "b84a8cdb-3333-4fc4-95e9-d67ec72fbe00",
    email: "admin@glazelibrary.app",
    displayName: "Studio Admin",
    studioName: "Glaze Library",
    location: "Melbourne",
    isAdmin: true,
  },
];

export const demoGlazes: Glaze[] = [
  {
    id: "f1f3487a-c001-460b-9efe-48d02eb0f111",
    sourceType: "commercial",
    brand: "Mayco",
    line: "Stoneware",
    code: "SW-118",
    name: "Sea Salt",
    cone: "Cone 6",
    description:
      "Sea Salt is a white matte glaze with sage-green crystals that bloom into a foamy, textured surface as they melt.",
    imageUrl: "https://www.maycocolors.com/wp-content/uploads/2020/01/SW118-web.jpg",
    finishNotes: "Gloss break",
    colorNotes: "Cream with warm float",
  },
  {
    id: "f1f3487a-c002-460b-9efe-48d02eb0f111",
    sourceType: "commercial",
    brand: "Mayco",
    line: "Stoneware",
    code: "SW-152",
    name: "Tiger's Eye",
    cone: "Cone 6",
    description:
      "Tiger's Eye is a fluid iron-brown glaze that develops amber breaks and rich movement where it pools.",
    imageUrl: "https://www.maycocolors.com/wp-content/uploads/2020/01/SW152-web.jpg",
    finishNotes: "Fluid gloss",
    colorNotes: "Iron brown with amber breaks",
  },
  {
    id: "f1f3487a-c003-460b-9efe-48d02eb0f111",
    sourceType: "commercial",
    brand: "Amaco",
    line: "Potter's Choice",
    code: "PC-20",
    name: "Blue Rutile",
    cone: "Cone 5/6",
    description: "Blue Rutile is a glossy variegated glaze with blue, cream, and rutile streaking.",
    imageUrl:
      "https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/2000x2000/products/620/3066/PC-20_6x6_Label_Tile_Chip-hires__64880.1659539237.jpg?c=1",
    finishNotes: "Gloss with movement",
    colorNotes: "Blue, cream and rutile streaking",
  },
  {
    id: "f1f3487a-c004-460b-9efe-48d02eb0f111",
    sourceType: "commercial",
    brand: "Amaco",
    line: "Celadon",
    code: "C-11",
    name: "Mixing Clear",
    cone: "Cone 5/6",
    description: "Mixing Clear is a transparent clear glaze designed for layering and color development.",
    imageUrl:
      "https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/2000x2000/products/783/3534/C-11_Mixing_Clear_TV__31995.1659540501.jpg?c=1",
    finishNotes: "Clear gloss",
    colorNotes: "Transparent",
  },
  {
    id: "f1f3487a-c005-460b-9efe-48d02eb0f111",
    sourceType: "nonCommercial",
    name: "Fog Slip White",
    cone: "Cone 6",
    atmosphere: "Oxidation",
    finishNotes: "Dry satin",
    recipeNotes: "Magnesium-heavy white slip used as a soft underlayer.",
    createdByUserId: demoProfiles[0].id,
  },
  {
    id: "f1f3487a-c006-460b-9efe-48d02eb0f111",
    sourceType: "nonCommercial",
    name: "River Ash Gloss",
    cone: "Cone 10",
    atmosphere: "Reduction",
    finishNotes: "Gloss with pinholing risk on thick rims",
    recipeNotes: "Ash-derived custom reduction glaze.",
    createdByUserId: demoProfiles[1].id,
  },
];

const demoTagSeed = [
  ["glossy", "Glossy", "Surface", "Finishes with a glossy or reflective surface."],
  ["satin", "Satin", "Surface", "Lands between matte and glossy with a soft sheen."],
  ["matte", "Matte", "Surface", "Finishes with a dry or low-sheen matte surface."],
  ["transparent", "Transparent", "Opacity", "Lets the clay body or underglaze show through clearly."],
  ["translucent", "Translucent", "Opacity", "Lets some underlying color show through while softening it."],
  ["opaque", "Opaque", "Opacity", "Covers the body or underlayers with little transparency."],
  ["stable", "Stable", "Movement", "Stays where it is applied and does not move much in the kiln."],
  ["runny", "Runny", "Movement", "Moves or flows a lot in the kiln."],
  ["thin-coat-friendly", "Thin Coat Friendly", "Application", "Looks good even when applied on the thinner side."],
  ["thick-coat-friendly", "Thick Coat Friendly", "Application", "Develops best when applied generously."],
  ["easy-to-layer", "Easy To Layer", "Application", "Usually layers well with other glazes."],
  ["hard-to-apply", "Hard To Apply", "Application", "Can be fussy, inconsistent, or difficult to apply well."],
  ["breaks-on-edges", "Breaks On Edges", "Visual", "Breaks over texture or edges and reveals variation there."],
  ["variegated", "Variegated", "Visual", "Shows multiple colors, pooling, or movement in one finish."],
  ["crystalline", "Crystalline", "Visual", "Develops crystal growth or crystal-like blooms."],
  ["textured", "Textured", "Visual", "Creates a tactile, foamy, cratered, or visibly textured surface."],
] as const;

const demoTagCountsByGlazeId: Record<string, Record<string, number>> = {
  [demoGlazes[0].id]: {
    matte: 11,
    textured: 8,
    variegated: 9,
    "thick-coat-friendly": 6,
    "easy-to-layer": 4,
  },
  [demoGlazes[1].id]: {
    glossy: 10,
    runny: 12,
    variegated: 7,
    "breaks-on-edges": 5,
    "hard-to-apply": 3,
  },
  [demoGlazes[2].id]: {
    glossy: 9,
    variegated: 11,
    runny: 7,
    "easy-to-layer": 8,
    "breaks-on-edges": 6,
  },
  [demoGlazes[3].id]: {
    glossy: 8,
    transparent: 10,
    stable: 7,
    "thin-coat-friendly": 5,
    "easy-to-layer": 6,
  },
};

const demoViewerVotesByGlazeId: Record<string, string[]> = {
  [demoGlazes[0].id]: ["matte", "textured"],
  [demoGlazes[1].id]: ["glossy"],
  [demoGlazes[2].id]: ["variegated", "easy-to-layer"],
};

export function getDemoTagSummariesForGlaze(glazeId: string, viewerId?: string): GlazeTagSummary[] {
  const counts = demoTagCountsByGlazeId[glazeId] ?? {};
  const viewerVotes = viewerId ? demoViewerVotesByGlazeId[glazeId] ?? [] : [];

  return demoTagSeed.map(([slug, label, category, description], index) => ({
    id: `demo-tag-${index + 1}`,
    slug,
    label,
    category,
    description,
    voteCount: counts[slug] ?? 0,
    viewerHasVoted: viewerVotes.includes(slug),
  }));
}

export const demoInventoryFolders: InventoryFolder[] = [
  {
    id: "6aaf99d0-0001-45d5-bb39-404e3e546001",
    userId: demoProfiles[0].id,
    name: "Mug liners",
    glazeCount: 2,
  },
  {
    id: "6aaf99d0-0002-45d5-bb39-404e3e546001",
    userId: demoProfiles[0].id,
    name: "Next order",
    glazeCount: 1,
  },
];

export const demoInventory: InventoryItem[] = [
  {
    id: "a4f44e90-0001-45d5-bb39-404e3e546001",
    userId: demoProfiles[0].id,
    glazeId: demoGlazes[0].id,
    status: "owned",
    personalNotes: "Reliable on buff clay bodies.",
    folderIds: [demoInventoryFolders[0].id],
    folders: [demoInventoryFolders[0]],
    glaze: demoGlazes[0],
  },
  {
    id: "a4f44e90-0002-45d5-bb39-404e3e546001",
    userId: demoProfiles[0].id,
    glazeId: demoGlazes[1].id,
    status: "owned",
    personalNotes: "Use on vertical texture with catch trays.",
    folderIds: [demoInventoryFolders[0].id],
    folders: [demoInventoryFolders[0]],
    glaze: demoGlazes[1],
  },
  {
    id: "a4f44e90-0003-45d5-bb39-404e3e546001",
    userId: demoProfiles[0].id,
    glazeId: demoGlazes[2].id,
    status: "wishlist",
    personalNotes: "Want this for layered mug tests.",
    folderIds: [demoInventoryFolders[1].id],
    folders: [demoInventoryFolders[1]],
    glaze: demoGlazes[2],
  },
  {
    id: "a4f44e90-0004-45d5-bb39-404e3e546001",
    userId: demoProfiles[0].id,
    glazeId: demoGlazes[4].id,
    status: "archived",
    personalNotes: "My class test tile base.",
    glaze: demoGlazes[4],
  },
];

export const demoPairs: CombinationPair[] = [
  {
    id: "9c58d0ab-0001-46d4-a1ec-4ab646aa0001",
    glazeAId: demoGlazes[0].id,
    glazeBId: demoGlazes[1].id,
    pairKey: createPairKey(demoGlazes[0].id, demoGlazes[1].id),
  },
  {
    id: "9c58d0ab-0002-46d4-a1ec-4ab646aa0001",
    glazeAId: demoGlazes[2].id,
    glazeBId: demoGlazes[4].id,
    pairKey: createPairKey(demoGlazes[2].id, demoGlazes[4].id),
  },
];

export const demoPosts: CombinationPost[] = [
  {
    id: "8fb1ecf9-0001-4a31-bc9e-20f7ab000001",
    authorUserId: demoProfiles[1].id,
    authorName: demoProfiles[1].displayName,
    combinationPairId: demoPairs[0].id,
    pairKey: demoPairs[0].pairKey,
    imagePath:
      "https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1200&q=80",
    caption: "Tiger's Eye over Sea Salt on a speckled buff body with a very slow cool.",
    applicationNotes: "Sea Salt x2, Tiger's Eye rim dip.",
    firingNotes: "Cone 6 oxidation, half shelf down.",
    visibility: "members",
    status: "published",
    createdAt: "2026-03-28T10:15:00.000Z",
  },
  {
    id: "8fb1ecf9-0002-4a31-bc9e-20f7ab000001",
    authorUserId: demoProfiles[0].id,
    authorName: demoProfiles[0].displayName,
    combinationPairId: demoPairs[1].id,
    pairKey: demoPairs[1].pairKey,
    imagePath:
      "https://images.unsplash.com/photo-1523419409543-a5e549c1d598?auto=format&fit=crop&w=1200&q=80",
    caption: "Blue Rutile over Fog Slip White on thrown mugs.",
    applicationNotes: "Slip leather-hard, Blue Rutile poured inside and dipped outside.",
    firingNotes: "Cone 6 oxidation on a white stoneware body.",
    visibility: "members",
    status: "published",
    createdAt: "2026-03-30T08:45:00.000Z",
  },
  {
    id: "8fb1ecf9-0003-4a31-bc9e-20f7ab000001",
    authorUserId: demoProfiles[1].id,
    authorName: demoProfiles[1].displayName,
    combinationPairId: demoPairs[1].id,
    pairKey: demoPairs[1].pairKey,
    imagePath:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=1200&q=80",
    caption: "Extra-thick overlap created bubbling. Good reference for what not to repeat.",
    applicationNotes: "Blue Rutile over thick slip overlap on rims.",
    firingNotes: "Cone 6 oxidation.",
    visibility: "members",
    status: "reported",
    createdAt: "2026-03-31T07:10:00.000Z",
  },
];

export const demoReports: Report[] = [
  {
    id: "7f13b100-0001-4c8b-b314-19df63000001",
    postId: demoPosts[2].id,
    reportedByUserId: demoProfiles[0].id,
    reason: "Caption is useful, but the image was uploaded upside down.",
    status: "open",
    createdAt: "2026-03-31T09:00:00.000Z",
  },
];
