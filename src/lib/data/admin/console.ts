/**
 * Data for the admin console (`/admin`).
 *
 * Everything here reads through the service-role client, so callers must gate
 * on `requireAdminViewer()` first. Without Supabase configured (preview mode)
 * each function returns the small sample set in `console-demo.ts`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/data/users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import * as demo from "./console-demo";

type Row = Record<string, unknown>;
type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type ModerationState = "pending" | "approved" | "rejected";
export type SubmissionKind = "combination" | "glaze" | "firingImage";
export type CommentKind = "glaze" | "combination";
export type RequestStatus = "pending" | "added" | "declined";

export const MODERATION_STATES: ModerationState[] = ["pending", "approved", "rejected"];
export const REQUEST_STATUSES: RequestStatus[] = ["pending", "added", "declined"];

export interface AdminCounts {
  pendingCombinations: number;
  pendingGlazes: number;
  pendingPhotos: number;
  pendingSubmissions: number;
  openReports: number;
  pendingRequests: number;
  queuedIntakes: number;
}

export interface EditField {
  name: string;
  label: string;
  value: string;
  multiline?: boolean;
  options?: string[];
}

export interface Submission {
  kind: SubmissionKind;
  id: string;
  title: string;
  detail: string | null;
  imageUrl: string | null;
  authorId: string | null;
  authorName: string;
  createdAt: string;
  state: ModerationState;
  /** Public page for this item, when there is one. */
  href: string | null;
  fields: EditField[];
}

export interface AdminComment {
  kind: CommentKind;
  id: string;
  body: string;
  authorId: string | null;
  authorName: string;
  targetLabel: string;
  href: string;
  createdAt: string;
}

export interface BrandRequest {
  id: string;
  brandName: string;
  notes: string | null;
  status: string;
  userId: string | null;
  userName: string;
  createdAt: string;
}

export interface GuideReport {
  id: string;
  guideTitle: string;
  sectionLabel: string;
  note: string;
  pagePath: string | null;
  userId: string | null;
  userName: string;
  createdAt: string;
}

export interface AdminStudio {
  id: string;
  slug: string;
  displayName: string;
  ownerId: string;
  ownerName: string;
  sharedGlazes: number;
  visits: number;
  lastVisitAt: string | null;
  createdAt: string;
}

export interface AdminOverview {
  stats: {
    totalUsers: number;
    newUsers7d: number;
    publishedCombinations: number;
    customGlazes: number;
    comments: number;
    inventoryItems: number;
  };
  recentUsers: Array<{ id: string; displayName: string; email: string; createdAt: string }>;
  recentActivity: Array<{
    id: string;
    eventType: string;
    metadata: Record<string, unknown>;
    userId: string | null;
    userName: string | null;
    createdAt: string;
  }>;
}

export interface AdminUserAccount {
  id: string;
  displayName: string;
  email: string;
  studioName: string | null;
  location: string | null;
  isAdmin: boolean;
  points: number;
  strikes: number;
  contributionsDisabled: boolean;
  createdAt: string;
  submissions: Submission[];
  comments: AdminComment[];
  ledger: Array<{ id: string; action: string; points: number; voided: boolean; createdAt: string }>;
}

export async function requireAdminViewer() {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) redirect("/dashboard");
  return viewer;
}

/** Tables added after `database.types.ts` was generated need an untyped client. */
function untyped(admin: AdminClient) {
  return admin as unknown as SupabaseClient;
}

function asState(value: unknown): ModerationState {
  return value === "approved" || value === "rejected" ? value : "pending";
}

async function displayNames(admin: AdminClient, ids: Array<unknown>) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  const names = new Map<string, string>();
  if (!unique.length) return names;
  const { data } = await admin.from("profiles").select("id, display_name").in("id", unique);
  for (const row of data ?? []) names.set(String(row.id), row.display_name || "Unnamed member");
  return names;
}

// ─── Counts shown in the sidebar and on the overview ─────────────────────────

export async function getAdminCounts(): Promise<AdminCounts> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.counts();

  const head = { count: "exact", head: true } as const;
  const [combos, glazes, photos, reports, requests, intakes] = await Promise.all([
    admin.from("user_combination_examples").select("id", head).eq("moderation_state", "pending"),
    admin.from("glazes").select("id", head).eq("source_type", "nonCommercial").eq("moderation_state", "pending"),
    admin.from("community_firing_images").select("id", head).eq("moderation_state", "pending"),
    admin.from("reports").select("id", head).eq("status", "open"),
    untyped(admin).from("glaze_brand_requests").select("id", head).eq("status", "pending"),
    admin.from("external_example_intakes").select("id", head).eq("review_status", "queued"),
  ]);

  const pendingCombinations = combos.count ?? 0;
  const pendingGlazes = glazes.count ?? 0;
  const pendingPhotos = photos.count ?? 0;

  return {
    pendingCombinations,
    pendingGlazes,
    pendingPhotos,
    pendingSubmissions: pendingCombinations + pendingGlazes + pendingPhotos,
    openReports: reports.count ?? 0,
    pendingRequests: requests.count ?? 0,
    queuedIntakes: intakes.count ?? 0,
  };
}

// ─── Overview ────────────────────────────────────────────────────────────────

export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.overview();

  const head = { count: "exact", head: true } as const;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [users, newUsers, combos, glazes, glazeComments, comboComments, inventory, recentUsers, events] =
    await Promise.all([
      admin.from("profiles").select("id", head),
      admin.from("profiles").select("id", head).gte("created_at", weekAgo),
      admin.from("user_combination_examples").select("id", head).eq("status", "published"),
      admin.from("glazes").select("id", head).eq("source_type", "nonCommercial"),
      admin.from("glaze_comments").select("id", head),
      admin.from("combination_comments").select("id", head),
      admin.from("inventory_items").select("id", head),
      admin
        .from("profiles")
        .select("id, display_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("analytics_events")
        .select("id, event_type, user_id, metadata, created_at")
        .neq("event_type", "glaze_view")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  const names = await displayNames(admin, (events.data ?? []).map((row) => row.user_id));

  return {
    stats: {
      totalUsers: users.count ?? 0,
      newUsers7d: newUsers.count ?? 0,
      publishedCombinations: combos.count ?? 0,
      customGlazes: glazes.count ?? 0,
      comments: (glazeComments.count ?? 0) + (comboComments.count ?? 0),
      inventoryItems: inventory.count ?? 0,
    },
    recentUsers: (recentUsers.data ?? []).map((row) => ({
      id: String(row.id),
      displayName: row.display_name || "Unnamed member",
      email: row.email ?? "",
      createdAt: String(row.created_at),
    })),
    recentActivity: (events.data ?? []).map((row) => ({
      id: String(row.id),
      eventType: String(row.event_type),
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      userId: row.user_id ? String(row.user_id) : null,
      userName: row.user_id ? (names.get(String(row.user_id)) ?? null) : null,
      createdAt: String(row.created_at),
    })),
  };
}

// ─── Submissions (combinations, custom glazes, firing photos) ────────────────

const SUBMISSION_LIMIT = 100;

function mapCombination(r: Row, names: Map<string, string>): Submission {
  const images = Array.isArray(r.image_paths) ? (r.image_paths as string[]) : [];
  return {
    kind: "combination",
    id: String(r.id),
    title: String(r.title || "Untitled combination"),
    detail: [r.cone, r.atmosphere, r.status].filter(Boolean).map(String).join(" · ") || null,
    imageUrl: images[0] ?? null,
    authorId: r.author_user_id ? String(r.author_user_id) : null,
    authorName: names.get(String(r.author_user_id)) ?? "Unknown",
    createdAt: String(r.created_at),
    state: asState(r.moderation_state),
    href: `/combinations/examples/${String(r.id)}`,
    fields: [
      { name: "title", label: "Title", value: String(r.title ?? "") },
      { name: "cone", label: "Cone", value: String(r.cone ?? "") },
      { name: "atmosphere", label: "Atmosphere", value: String(r.atmosphere ?? "") },
      { name: "status", label: "Visibility", value: String(r.status ?? "published"), options: ["draft", "published", "hidden"] },
      { name: "notes", label: "Notes", value: String(r.notes ?? ""), multiline: true },
    ],
  };
}

function mapGlaze(r: Row, names: Map<string, string>): Submission {
  return {
    kind: "glaze",
    id: String(r.id),
    title: String(r.name || "Unnamed glaze"),
    detail: [r.brand, r.code].filter(Boolean).map(String).join(" · ") || null,
    imageUrl: r.image_url ? String(r.image_url) : null,
    authorId: r.created_by_user_id ? String(r.created_by_user_id) : null,
    authorName: names.get(String(r.created_by_user_id)) ?? "Unknown",
    createdAt: String(r.created_at),
    state: asState(r.moderation_state),
    href: `/glazes/${String(r.id)}`,
    fields: [
      { name: "name", label: "Name", value: String(r.name ?? "") },
      { name: "brand", label: "Brand", value: String(r.brand ?? "") },
      { name: "code", label: "Code", value: String(r.code ?? "") },
      { name: "colorNotes", label: "Colour notes", value: String(r.color_notes ?? ""), multiline: true },
      { name: "finishNotes", label: "Finish notes", value: String(r.finish_notes ?? ""), multiline: true },
    ],
  };
}

function mapFiringImage(r: Row, names: Map<string, string>): Submission {
  const href = r.glaze_id
    ? `/glazes/${String(r.glaze_id)}`
    : r.combination_id && r.combination_type === "user"
      ? `/combinations/examples/${String(r.combination_id)}`
      : null;
  return {
    kind: "firingImage",
    id: String(r.id),
    title: String(r.label || "Firing photo"),
    detail:
      [r.cone, r.atmosphere, r.glaze_id ? "on a glaze" : r.combination_id ? "on a combination" : null]
        .filter(Boolean)
        .map(String)
        .join(" · ") || null,
    imageUrl: r.image_url ? String(r.image_url) : null,
    authorId: r.uploader_user_id ? String(r.uploader_user_id) : null,
    authorName: names.get(String(r.uploader_user_id)) ?? "Unknown",
    createdAt: String(r.created_at),
    state: asState(r.moderation_state),
    href,
    fields: [
      { name: "label", label: "Label", value: String(r.label ?? "") },
      { name: "cone", label: "Cone", value: String(r.cone ?? "") },
      { name: "atmosphere", label: "Atmosphere", value: String(r.atmosphere ?? "") },
    ],
  };
}

const COMBINATION_COLUMNS =
  "id, title, author_user_id, status, cone, atmosphere, notes, image_paths, created_at, moderation_state";
const GLAZE_COLUMNS =
  "id, name, brand, code, color_notes, finish_notes, image_url, created_by_user_id, created_at, moderation_state";
const FIRING_IMAGE_COLUMNS =
  "id, image_url, label, cone, atmosphere, uploader_user_id, glaze_id, combination_id, combination_type, created_at, moderation_state";

/**
 * One moderation list. Pass `state` for the queue, `authorId` for a member's
 * own history, or both. Pending items come oldest first so nothing waits.
 */
export async function getSubmissions(
  kind: SubmissionKind,
  filter: { state?: ModerationState; authorId?: string; limit?: number },
): Promise<Submission[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.submissions(kind, filter);

  const ascending = filter.state === "pending";
  const limit = filter.limit ?? SUBMISSION_LIMIT;
  let rows: Row[] = [];
  let authorColumn = "author_user_id";

  if (kind === "combination") {
    let query = admin.from("user_combination_examples").select(COMBINATION_COLUMNS);
    if (filter.state) query = query.eq("moderation_state", filter.state);
    if (filter.authorId) query = query.eq("author_user_id", filter.authorId);
    rows = ((await query.order("created_at", { ascending }).limit(limit)).data ?? []) as Row[];
  } else if (kind === "glaze") {
    authorColumn = "created_by_user_id";
    let query = admin.from("glazes").select(GLAZE_COLUMNS).eq("source_type", "nonCommercial");
    if (filter.state) query = query.eq("moderation_state", filter.state);
    if (filter.authorId) query = query.eq("created_by_user_id", filter.authorId);
    rows = ((await query.order("created_at", { ascending }).limit(limit)).data ?? []) as Row[];
  } else {
    authorColumn = "uploader_user_id";
    let query = admin.from("community_firing_images").select(FIRING_IMAGE_COLUMNS);
    if (filter.state) query = query.eq("moderation_state", filter.state);
    if (filter.authorId) query = query.eq("uploader_user_id", filter.authorId);
    rows = ((await query.order("created_at", { ascending }).limit(limit)).data ?? []) as Row[];
  }

  const names = await displayNames(admin, rows.map((row) => row[authorColumn]));
  const map = kind === "combination" ? mapCombination : kind === "glaze" ? mapGlaze : mapFiringImage;
  return rows.map((row) => map(row, names));
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getRecentComments(filter: { authorId?: string; limit?: number } = {}): Promise<AdminComment[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.comments(filter);

  const limit = filter.limit ?? 100;
  let glazeQuery = admin.from("glaze_comments").select("id, glaze_id, author_user_id, body, created_at");
  let comboQuery = admin.from("combination_comments").select("id, example_id, author_user_id, body, created_at");
  if (filter.authorId) {
    glazeQuery = glazeQuery.eq("author_user_id", filter.authorId);
    comboQuery = comboQuery.eq("author_user_id", filter.authorId);
  }

  const [glazeRes, comboRes] = await Promise.all([
    glazeQuery.order("created_at", { ascending: false }).limit(limit),
    comboQuery.order("created_at", { ascending: false }).limit(limit),
  ]);
  const glazeRows = glazeRes.data ?? [];
  const comboRows = comboRes.data ?? [];

  const glazeIds = [...new Set(glazeRows.map((row) => String(row.glaze_id)))];
  const exampleIds = [...new Set(comboRows.map((row) => String(row.example_id)))];
  const [names, glazes, examples] = await Promise.all([
    displayNames(admin, [...glazeRows, ...comboRows].map((row) => row.author_user_id)),
    glazeIds.length
      ? admin.from("glazes").select("id, name, brand").in("id", glazeIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; brand: string | null }> }),
    exampleIds.length
      ? admin.from("user_combination_examples").select("id, title").in("id", exampleIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ]);
  const glazeLabels = new Map(
    (glazes.data ?? []).map((g) => [String(g.id), [g.brand, g.name].filter(Boolean).join(" ")]),
  );
  const exampleLabels = new Map((examples.data ?? []).map((e) => [String(e.id), e.title]));

  const comments: AdminComment[] = [
    ...glazeRows.map((row) => ({
      kind: "glaze" as const,
      id: String(row.id),
      body: row.body,
      authorId: String(row.author_user_id),
      authorName: names.get(String(row.author_user_id)) ?? "Unknown",
      targetLabel: glazeLabels.get(String(row.glaze_id)) || "A glaze",
      href: `/glazes/${String(row.glaze_id)}`,
      createdAt: String(row.created_at),
    })),
    ...comboRows.map((row) => ({
      kind: "combination" as const,
      id: String(row.id),
      body: row.body,
      authorId: String(row.author_user_id),
      authorName: names.get(String(row.author_user_id)) ?? "Unknown",
      targetLabel: exampleLabels.get(String(row.example_id)) || "A combination",
      href: `/combinations/examples/${String(row.example_id)}`,
      createdAt: String(row.created_at),
    })),
  ];

  return comments.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

// ─── Requests ────────────────────────────────────────────────────────────────

export async function getBrandRequests(): Promise<BrandRequest[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.brandRequests();

  const { data } = await untyped(admin)
    .from("glaze_brand_requests")
    .select("id, brand_name, notes, status, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];
  const names = await displayNames(admin, rows.map((row) => row.user_id));

  return rows.map((row) => ({
    id: String(row.id),
    brandName: String(row.brand_name),
    notes: row.notes ? String(row.notes) : null,
    status: String(row.status ?? "pending"),
    userId: row.user_id ? String(row.user_id) : null,
    userName: names.get(String(row.user_id)) ?? "A member",
    createdAt: String(row.created_at),
  }));
}

export async function getGuideReports(): Promise<GuideReport[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.guideReports();

  const { data } = await admin
    .from("analytics_events")
    .select("id, user_id, metadata, created_at")
    .eq("event_type", "guide_error_report")
    .order("created_at", { ascending: false })
    .limit(50);
  const names = await displayNames(admin, (data ?? []).map((row) => row.user_id));

  return (data ?? []).map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id),
      guideTitle: String(meta.guide_title ?? "Guide"),
      sectionLabel: String(meta.section_label ?? "Unknown section"),
      note: String(meta.note ?? ""),
      pagePath: meta.page_path ? String(meta.page_path) : null,
      userId: row.user_id ? String(row.user_id) : null,
      userName: row.user_id ? (names.get(String(row.user_id)) ?? "A member") : "Anonymous",
      createdAt: String(row.created_at),
    };
  });
}

// ─── Studios ─────────────────────────────────────────────────────────────────

export async function getStudios(): Promise<AdminStudio[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.studios();

  const loose = untyped(admin);
  const { data } = await loose
    .from("studios")
    .select("id, slug, display_name, owner_user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];
  if (!rows.length) return [];

  const ownerIds = rows.map((row) => String(row.owner_user_id));
  const [names, visitRes, sharedRes] = await Promise.all([
    displayNames(admin, ownerIds),
    loose
      .from("studio_visitor_logs")
      .select("studio_id, created_at")
      .in("studio_id", rows.map((row) => String(row.id)))
      .order("created_at", { ascending: false })
      .limit(5000),
    loose.from("inventory_items").select("user_id").in("user_id", ownerIds).eq("shared_with_studio", true),
  ]);

  const visits = new Map<string, { count: number; last: string }>();
  for (const row of (visitRes.data ?? []) as Row[]) {
    const key = String(row.studio_id);
    const entry = visits.get(key);
    if (entry) entry.count += 1;
    else visits.set(key, { count: 1, last: String(row.created_at) });
  }
  const shared = new Map<string, number>();
  for (const row of (sharedRes.data ?? []) as Row[]) {
    const key = String(row.user_id);
    shared.set(key, (shared.get(key) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    ownerId: String(row.owner_user_id),
    ownerName: names.get(String(row.owner_user_id)) ?? "Unknown",
    sharedGlazes: shared.get(String(row.owner_user_id)) ?? 0,
    visits: visits.get(String(row.id))?.count ?? 0,
    lastVisitAt: visits.get(String(row.id))?.last ?? null,
    createdAt: String(row.created_at),
  }));
}

// ─── One member ──────────────────────────────────────────────────────────────

export async function getAdminUserAccount(userId: string): Promise<AdminUserAccount | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return demo.userAccount(userId);

  const [profileRes, combos, glazes, photos, comments, ledgerRes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    getSubmissions("combination", { authorId: userId, limit: 30 }),
    getSubmissions("glaze", { authorId: userId, limit: 30 }),
    getSubmissions("firingImage", { authorId: userId, limit: 30 }),
    getRecentComments({ authorId: userId, limit: 30 }),
    admin
      .from("points_ledger")
      .select("id, action, points, voided, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);
  const profile = profileRes.data;
  if (!profile) return null;

  return {
    id: String(profile.id),
    displayName: profile.display_name || "Unnamed member",
    email: profile.email ?? "",
    studioName: profile.studio_name,
    location: profile.location,
    isAdmin: Boolean(profile.is_admin),
    points: Number(profile.points ?? 0),
    strikes: Number(profile.contribution_strikes ?? 0),
    contributionsDisabled: Boolean(profile.contributions_disabled),
    createdAt: String(profile.created_at),
    submissions: [...combos, ...glazes, ...photos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    comments,
    ledger: (ledgerRes.data ?? []).map((row) => ({
      id: String(row.id),
      action: String(row.action),
      points: Number(row.points),
      voided: Boolean(row.voided),
      createdAt: String(row.created_at),
    })),
  };
}
