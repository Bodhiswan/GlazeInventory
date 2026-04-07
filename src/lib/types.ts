export type GlazeSourceType = "commercial" | "nonCommercial";
export type InventoryStatus = "owned" | "wishlist" | "archived";
export type InventoryCollectionState = InventoryStatus | "none";
export type InventoryFillLevel = "full" | "half" | "low";
export type PostVisibility = "members";
export type PostStatus = "published" | "hidden" | "reported";
export type ReportStatus = "open" | "resolved";
export type RuntimeMode = "demo" | "live";
export type IntakeStatus = "queued" | "approved" | "rejected" | "duplicate" | "published";
export type ExternalExamplePrivacyMode = "anonymous" | "attributed" | "none";

export interface UserProfile {
  id: string;
  email?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  studioName?: string | null;
  location?: string | null;
  isAdmin?: boolean;
  isAnonymous?: boolean;
  preferredCone?: string | null;
  preferredAtmosphere?: string | null;
  restrictToPreferredExamples?: boolean;
}

export interface Viewer {
  mode: RuntimeMode;
  profile: UserProfile;
}

export interface GlazeTagSummary {
  id: string;
  slug: string;
  label: string;
  category: string;
  description?: string | null;
  voteCount: number;
  viewerHasVoted: boolean;
}

export interface GlazeFiringImage {
  id: string;
  label: string;
  cone?: string | null;
  atmosphere?: string | null;
  imageUrl: string;
}

export interface GlazeComment {
  id: string;
  glazeId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
}


export interface Glaze {
  id: string;
  sourceType: GlazeSourceType;
  name: string;
  brand?: string | null;
  line?: string | null;
  code?: string | null;
  cone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  editorialSummary?: string | null;
  editorialSurface?: string | null;
  editorialApplication?: string | null;
  editorialFiring?: string | null;
  editorialReviewedAt?: string | null;
  editorialReviewedByUserId?: string | null;
  communityTags?: GlazeTagSummary[];
  atmosphere?: string | null;
  finishNotes?: string | null;
  colorNotes?: string | null;
  recipeNotes?: string | null;
  createdByUserId?: string | null;
}

export interface InventoryFolder {
  id: string;
  userId: string;
  name: string;
  glazeCount?: number;
}

export interface InventoryItem {
  id: string;
  userId: string;
  glazeId: string;
  status: InventoryStatus;
  personalNotes?: string | null;
  fillLevel?: InventoryFillLevel;
  quantity?: number;
  folderIds?: string[];
  folders?: InventoryFolder[];
  glaze: Glaze;
}

export interface CombinationPair {
  id: string;
  glazeAId: string;
  glazeBId: string;
  pairKey: string;
}

export interface CombinationSummary {
  pairKey: string;
  glazes: [Glaze, Glaze];
  postCount: number;
  viewerOwnsPair: boolean;
}

export interface CombinationPost {
  id: string;
  authorUserId: string;
  authorName: string;
  displayAuthorName?: string | null;
  combinationPairId: string;
  pairKey: string;
  glazes?: [Glaze, Glaze];
  imagePath: string;
  caption?: string | null;
  applicationNotes?: string | null;
  firingNotes?: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  createdAt: string;
}

export interface CombinationDetail {
  pairKey: string;
  glazes: [Glaze, Glaze];
  viewerOwnsPair: boolean;
  inventoryNotes: string[];
  posts: CombinationPost[];
}

export interface VendorCombinationExampleLayer {
  id: string;
  exampleId: string;
  glazeId?: string | null;
  glaze?: Glaze | null;
  glazeCode?: string | null;
  glazeName: string;
  layerOrder: number;
  connectorToNext?: string | null;
  sourceImageUrl?: string | null;
}

export interface VendorCombinationExample {
  id: string;
  sourceVendor: string;
  sourceCollection: string;
  sourceKey: string;
  sourceUrl: string;
  title: string;
  imageUrl: string;
  cone?: string | null;
  atmosphere?: string | null;
  clayBody?: string | null;
  applicationNotes?: string | null;
  firingNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  layers: VendorCombinationExampleLayer[];
  viewerOwnsAllGlazes: boolean;
  viewerOwnedLayerCount: number;
}

export interface UserCombinationExampleLayer {
  id: string;
  exampleId: string;
  glazeId: string;
  glaze?: Glaze | null;
  layerOrder: number;
}

export interface UserCombinationExample {
  id: string;
  authorUserId: string;
  authorName: string;
  title: string;
  postFiringImageUrl: string;
  preFiringImageUrl?: string | null;
  cone: string;
  atmosphere?: string | null;
  glazingProcess?: string | null;
  notes?: string | null;
  kilnNotes?: string | null;
  status: PostStatus;
  createdAt: string;
  layers: UserCombinationExampleLayer[];
  viewerOwnsAllGlazes: boolean;
  viewerOwnedLayerCount: number;
}

export interface CombinationComment {
  id: string;
  exampleId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface CombinationRatingSummary {
  averageRating: number | null;
  ratingCount: number;
  viewerRating: number | null;
}

export interface UserFavourite {
  id: string;
  targetType: "glaze" | "combination";
  targetId: string;
  createdAt: string;
}

export interface GlazeDetail {
  glaze: Glaze;
  firingImages: GlazeFiringImage[];
  comments: GlazeComment[];
  viewerOwnsGlaze: boolean;
  viewerInventoryItem?: InventoryItem | null;
  viewerHasFavourited: boolean;
}

export interface Report {
  id: string;
  postId: string;
  reportedByUserId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ModerationItem {
  post: CombinationPost;
  reports: Report[];
}

export interface ExternalExampleGlazeMention {
  id: string;
  intakeId: string;
  freeformText: string;
  matchedGlazeId?: string | null;
  matchedGlaze?: Glaze | null;
  confidence: number;
  mentionOrder: number;
  isApproved: boolean;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
}

export interface ExternalExampleAsset {
  id: string;
  intakeId: string;
  storagePath: string;
  sourceImageUrl?: string | null;
  captureMethod: string;
  width?: number | null;
  height?: number | null;
  sha256: string;
  sortOrder: number;
  signedImageUrl?: string | null;
}

export interface ExternalExampleParserOutput {
  extractedCone?: string | null;
  extractedAtmosphere?: string | null;
  extractedClayBody?: string | null;
  matchedTerms?: string[];
  duplicateSha256s?: string[];
  duplicateSourceUrl?: boolean;
}

export interface ExternalExampleIntake {
  id: string;
  sourcePlatform: "facebook";
  groupLabel: string;
  sourceUrl: string;
  rawCaption?: string | null;
  rawAuthorDisplayName?: string | null;
  rawSourceTimestamp?: string | null;
  capturedByUserId: string;
  privacyMode: ExternalExamplePrivacyMode;
  reviewStatus: IntakeStatus;
  parserOutput: ExternalExampleParserOutput;
  reviewNotes?: string | null;
  duplicateOfIntakeId?: string | null;
  publishedPostId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assets: ExternalExampleAsset[];
  glazeMentions: ExternalExampleGlazeMention[];
}
