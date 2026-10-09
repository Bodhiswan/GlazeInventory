/**
 * Chooses between the Cone 6 layout and the classic site for each request.
 *
 * Both layouts share the same public URLs. The new layout lives under the
 * internal `/n` route tree and is reached by rewriting in `proxy.ts`; people
 * who pick "Use the classic site" get a cookie and are never rewritten.
 */

export const LAYOUT_COOKIE = "gi_layout";
export type LayoutMode = "new" | "classic";

export function layoutModeFromCookie(value: string | undefined): LayoutMode {
  return value === "classic" ? "classic" : "new";
}

export type LayoutRoute =
  | { type: "rewrite"; pathname: string }
  | { type: "redirect"; pathname: string; search?: string };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const REWRITES: RegExp[] = [
  /^\/glazes$/,
  new RegExp(`^/glazes/${UUID}$`, "i"),
  /^\/combinations$/,
  /^\/combinations\/examples\/[^/]+$/,
  /^\/inventory$/,
  /^\/profile$/,
  /^\/contribute$/,
  /^\/studio\/[^/]+(\/(library|combinations|join))?$/,
];

export function routeForLayout(pathname: string, mode: LayoutMode): LayoutRoute | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  // The internal tree is never a public URL.
  if (path === "/n" || path.startsWith("/n/")) {
    return { type: "redirect", pathname: path.slice(2) || "/" };
  }

  if (mode === "classic") return null;

  // Pages folded into the new layout.
  if (path === "/dashboard") return { type: "redirect", pathname: "/inventory" };
  if (path === "/community") return { type: "redirect", pathname: "/combinations", search: "?v=potters" };
  if (path === "/inventory/new") return { type: "redirect", pathname: "/glazes" };
  if (/^\/inventory\/[^/]+\/edit$/.test(path)) return { type: "redirect", pathname: "/inventory" };

  if (REWRITES.some((pattern) => pattern.test(path))) return { type: "rewrite", pathname: `/n${path}` };
  return null;
}
