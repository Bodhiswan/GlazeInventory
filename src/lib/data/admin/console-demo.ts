/**
 * Sample data for the admin console in preview mode (no Supabase configured),
 * so `npm run dev:demo` can show every admin screen. Never used in production.
 */
import { demoGlazes, demoProfiles } from "@/lib/demo-data";

import type {
  AdminComment,
  AdminCounts,
  AdminOverview,
  AdminStudio,
  AdminUserAccount,
  BrandRequest,
  CommentFilter,
  GuideReport,
  LikesOverview,
  MemberPortfolio,
  ModerationState,
  Submission,
  SubmissionKind,
} from "./console";

const [bodhi, kira] = demoProfiles;
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

function submission(
  kind: SubmissionKind,
  n: number,
  title: string,
  detail: string,
  state: ModerationState,
  author = kira,
): Submission {
  const glaze = demoGlazes[n % demoGlazes.length];
  return {
    kind,
    id: `demo-${kind}-${n}`,
    title,
    detail,
    imageUrl: glaze.imageUrl ?? null,
    authorId: author.id,
    authorName: author.displayName,
    createdAt: daysAgo(n),
    state,
    href: kind === "glaze" ? `/glazes/${glaze.id}` : null,
    fields: [
      { name: kind === "glaze" ? "name" : kind === "combination" ? "title" : "label", label: "Title", value: title },
      { name: "cone", label: "Cone", value: "Cone 6" },
    ],
  };
}

const allSubmissions: Submission[] = [
  submission("combination", 1, "Sea Salt over Tiger's Eye", "Cone 6 · Oxidation · published", "pending"),
  submission("combination", 2, "Two dips of Norse Blue", "Cone 6 · Oxidation · published", "pending", bodhi),
  submission("combination", 9, "Honey Flux under Celadon", "Cone 6 · Reduction · published", "approved"),
  submission("combination", 14, "Blurry test tile", "Cone 6 · Oxidation · hidden", "rejected"),
  submission("glaze", 3, "Studio Ash White", "Studio recipe · SAW-1", "pending"),
  submission("glaze", 11, "Kira's Tenmoku", "Studio recipe", "approved"),
  submission("firingImage", 1, "Thick application, bottom shelf", "Cone 6 · Oxidation · on a glaze", "pending", bodhi),
  submission("firingImage", 6, "Speckled buff clay", "Cone 6 · on a glaze", "approved"),
];

const pieces = [
  { id: "demo-piece-1", authorId: kira.id, title: "Sea Salt over Tiger's Eye", imageUrl: demoGlazes[0].imageUrl ?? null, likes: 14, comments: 3, createdAt: daysAgo(1) },
  { id: "demo-piece-2", authorId: kira.id, title: "Honey Flux under Celadon", imageUrl: demoGlazes[1].imageUrl ?? null, likes: 9, comments: 1, createdAt: daysAgo(9) },
  { id: "demo-piece-3", authorId: bodhi.id, title: "Two dips of Norse Blue", imageUrl: demoGlazes[0].imageUrl ?? null, likes: 4, comments: 0, createdAt: daysAgo(2) },
];

export function portfolios(search: string): MemberPortfolio[] {
  const term = search.trim().toLowerCase();
  return [kira, bodhi]
    .map((member) => {
      const own = pieces.filter((piece) => piece.authorId === member.id);
      return {
        memberId: member.id,
        memberName: member.displayName,
        studioName: member.studioName ?? null,
        pieces: own.length,
        likes: own.reduce((sum, piece) => sum + piece.likes, 0),
        comments: own.reduce((sum, piece) => sum + piece.comments, 0),
        latestAt: own[0]?.createdAt ?? daysAgo(1),
        covers: own.flatMap((piece) => (piece.imageUrl ? [piece.imageUrl] : [])),
      };
    })
    .filter((entry) => !term || entry.memberName.toLowerCase().includes(term));
}

export function likes(): LikesOverview {
  return {
    stats: { total: 412, last7d: 37, onCombinations: 148, onGlazes: 264 },
    topCombinations: pieces.map((piece) => ({
      kind: "combination" as const,
      id: piece.id,
      label: piece.title,
      href: null,
      ownerId: piece.authorId,
      ownerName: piece.authorId === kira.id ? kira.displayName : bodhi.displayName,
      likes: piece.likes,
    })),
    topGlazes: demoGlazes.slice(0, 3).map((glaze, index) => ({
      kind: "glaze" as const,
      id: glaze.id,
      label: `${glaze.brand} ${glaze.name}`,
      href: `/glazes/${glaze.id}`,
      ownerId: null,
      ownerName: null,
      likes: 31 - index * 7,
    })),
    recent: [
      { id: "demo-like-1", userId: bodhi.id, userName: bodhi.displayName, kind: "combination", label: pieces[0].title, href: null, createdAt: daysAgo(0.2) },
      { id: "demo-like-2", userId: kira.id, userName: kira.displayName, kind: "glaze", label: `${demoGlazes[0].brand} ${demoGlazes[0].name}`, href: `/glazes/${demoGlazes[0].id}`, createdAt: daysAgo(1) },
    ],
  };
}

export function submissions(
  kind: SubmissionKind,
  filter: { state?: ModerationState; authorId?: string },
): Submission[] {
  return allSubmissions.filter(
    (item) =>
      item.kind === kind &&
      (!filter.state || item.state === filter.state) &&
      (!filter.authorId || item.authorId === filter.authorId),
  );
}

export function counts(): AdminCounts {
  const pending = (kind: SubmissionKind) => submissions(kind, { state: "pending" }).length;
  return {
    pendingCombinations: pending("combination"),
    pendingGlazes: pending("glaze"),
    pendingPhotos: pending("firingImage"),
    pendingSubmissions: pending("combination") + pending("glaze") + pending("firingImage"),
    openReports: 1,
    pendingRequests: brandRequests().filter((request) => request.status === "pending").length,
    queuedIntakes: 0,
  };
}

export function comments(filter: CommentFilter): AdminComment[] {
  const all: AdminComment[] = [
    {
      kind: "glaze",
      id: "demo-comment-1",
      body: "Breaks beautifully over texture — three coats on buff stoneware.",
      authorId: kira.id,
      authorName: kira.displayName,
      targetLabel: `${demoGlazes[0].brand} ${demoGlazes[0].name}`,
      href: `/glazes/${demoGlazes[0].id}`,
      createdAt: daysAgo(1),
    },
    {
      kind: "combination",
      id: "demo-comment-2",
      body: "Did this run at all on a vertical surface?",
      authorId: bodhi.id,
      authorName: bodhi.displayName,
      targetLabel: "Sea Salt over Tiger's Eye",
      href: "/combinations",
      createdAt: daysAgo(2),
    },
  ];
  const term = filter.search?.trim().toLowerCase();
  return all.filter(
    (comment) =>
      (!filter.authorId || comment.authorId === filter.authorId) &&
      (!filter.kind || comment.kind === filter.kind) &&
      (!term || comment.body.toLowerCase().includes(term)),
  );
}

export function brandRequests(): BrandRequest[] {
  return [
    { id: "demo-request-1", brandName: "Laguna", notes: "Mostly the Moroccan Sand series.", status: "pending", userId: kira.id, userName: kira.displayName, createdAt: daysAgo(1) },
    { id: "demo-request-2", brandName: "Botz", notes: null, status: "pending", userId: bodhi.id, userName: bodhi.displayName, createdAt: daysAgo(4) },
    { id: "demo-request-3", brandName: "Spectrum", notes: null, status: "added", userId: kira.id, userName: kira.displayName, createdAt: daysAgo(30) },
  ];
}

export function guideReports(): GuideReport[] {
  return [
    {
      id: "demo-guide-report-1",
      guideTitle: "Glazing pottery",
      sectionLabel: "Applying glaze",
      note: "The dipping time table says 30 seconds — should that be 3?",
      pagePath: "/guides/glazing-pottery",
      userId: kira.id,
      userName: kira.displayName,
      createdAt: daysAgo(3),
    },
  ];
}

export function studios(): AdminStudio[] {
  return [
    {
      id: "demo-studio-1",
      slug: "marsh-clay",
      displayName: kira.studioName ?? "Marsh Clay Works",
      ownerId: kira.id,
      ownerName: kira.displayName,
      sharedGlazes: 18,
      visits: 42,
      lastVisitAt: daysAgo(1),
      createdAt: daysAgo(60),
    },
  ];
}

export function overview(): AdminOverview {
  return {
    stats: { totalUsers: 128, newUsers7d: 9, publishedCombinations: 64, customGlazes: 21, comments: 87, inventoryItems: 1432 },
    recentUsers: demoProfiles.map((profile, index) => ({
      id: profile.id,
      displayName: profile.displayName,
      email: profile.email ?? "",
      createdAt: daysAgo(index + 1),
    })),
    recentActivity: [
      { id: "demo-event-1", eventType: "combination_publish", metadata: { title: "Sea Salt over Tiger's Eye" }, userId: kira.id, userName: kira.displayName, createdAt: daysAgo(1) },
      { id: "demo-event-2", eventType: "brand_request", metadata: { brand_name: "Laguna" }, userId: kira.id, userName: kira.displayName, createdAt: daysAgo(1) },
      { id: "demo-event-3", eventType: "buy_click", metadata: { store_name: "Clay King" }, userId: null, userName: null, createdAt: daysAgo(2) },
    ],
  };
}

export function userAccount(userId: string): AdminUserAccount | null {
  const profile = demoProfiles.find((candidate) => candidate.id === userId);
  if (!profile) return null;
  return {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.email ?? "",
    studioName: profile.studioName ?? null,
    location: profile.location ?? null,
    isAdmin: Boolean(profile.isAdmin),
    points: profile.id === kira.id ? 140 : 35,
    strikes: profile.id === kira.id ? 1 : 0,
    contributionsDisabled: false,
    createdAt: daysAgo(90),
    submissions: allSubmissions.filter((item) => item.authorId === userId),
    comments: comments({ authorId: userId }),
    portfolio: pieces.filter((piece) => piece.authorId === userId),
    likesGiven: userId === kira.id ? 12 : 5,
    likesReceived: pieces.filter((piece) => piece.authorId === userId).reduce((sum, piece) => sum + piece.likes, 0),
    ledger: [
      { id: "demo-ledger-1", action: "combination_shared", points: 20, voided: false, createdAt: daysAgo(2) },
      { id: "demo-ledger-2", action: "combination_shared", points: 20, voided: true, createdAt: daysAgo(14) },
    ],
  };
}
