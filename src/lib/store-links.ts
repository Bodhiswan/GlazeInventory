/**
 * Store names, regions and search-URL builders for "Buy this glaze" links.
 *
 * Kept separate from `stores.ts` (which loads each store's product list to
 * decide who stocks a glaze) so client components can build links without
 * bundling those product lists.
 */

export type StoreLinkGlaze = { code: string | null; name: string; brand: string | null };

export interface StoreLink {
  id: string;
  name: string;
  region: string;
  /** ISO 3166-1 alpha-2 country code for flag display */
  country: string;
  url: string;
  buildUrl: (glaze: StoreLinkGlaze) => string;
}

/**
 * Pottery Paints (AU) — WooCommerce search.
 * Their product titles drop hyphens from codes (e.g. "PC25" not "PC-25"),
 * so we strip hyphens/spaces before searching.
 */
function potteryPaintsUrl(glaze: StoreLinkGlaze): string {
  const query = glaze.code ? glaze.code.replace(/[-\s]/g, "") : glaze.name;
  return `https://potterypaints.com.au/?s=${encodeURIComponent(query)}&post_type=product`;
}

/**
 * Clay King (US) — WooCommerce search.
 * They keep hyphens in codes (e.g. "PC-25"), so we pass the code as-is.
 */
function clayKingUrl(glaze: StoreLinkGlaze): string {
  const query = glaze.code ?? glaze.name;
  return `https://clay-king.com/?s=${encodeURIComponent(query)}&post_type=product`;
}

/**
 * Glaze Queen (US) — site search via Google.
 * Their site blocks direct search requests, so we use a site-scoped Google search.
 */
function glazeQueenUrl(glaze: StoreLinkGlaze): string {
  const query = glaze.code ?? glaze.name;
  return `https://www.google.com/search?q=site%3Aglazequeen.com+${encodeURIComponent(query)}`;
}

/**
 * The Ceramic Shop (US) — Nitrosell search.
 * Uses keyword search at /store/search.asp. Hyphens in codes work fine.
 */
function theCeramicShopUrl(glaze: StoreLinkGlaze): string {
  const query = glaze.code ?? glaze.name;
  return `https://theceramicshop.com/store/search.asp?keyword=${encodeURIComponent(query)}`;
}

/**
 * Bath Potters Supplies (UK) - site search uses path-based search URLs.
 */
function bathPottersUrl(glaze: StoreLinkGlaze): string {
  const query = glaze.code ?? glaze.name;
  return `https://www.bathpotters.co.uk/search/${encodeURIComponent(query)}`;
}

/**
 * Potterycrafts (UK) - Shopify search.
 */
function potterycraftsUrl(glaze: StoreLinkGlaze): string {
  const query = glaze.code ?? glaze.name;
  return `https://potterycrafts.co.uk/search?q=${encodeURIComponent(query)}`;
}

/**
 * Scarva (UK) - site-scoped Google search.
 * Their site can block automated direct requests, so this mirrors the
 * Glaze Queen approach and still lands users on product results.
 */
function scarvaUrl(glaze: StoreLinkGlaze): string {
  const query = glaze.code ?? glaze.name;
  return `https://www.google.com/search?q=site%3Ascarva.com+${encodeURIComponent(query)}`;
}

/** In display order. */
export const storeLinks: StoreLink[] = [
  { id: "pottery-paints-au", name: "Pottery Paints", region: "AUS", country: "AU", url: "https://potterypaints.com.au", buildUrl: potteryPaintsUrl },
  { id: "clay-king-us", name: "Clay King", region: "USA", country: "US", url: "https://clay-king.com", buildUrl: clayKingUrl },
  { id: "bath-potters-uk", name: "Bath Potters", region: "UK", country: "GB", url: "https://www.bathpotters.co.uk", buildUrl: bathPottersUrl },
  { id: "potterycrafts-uk", name: "Potterycrafts", region: "UK", country: "GB", url: "https://potterycrafts.co.uk", buildUrl: potterycraftsUrl },
  { id: "scarva-uk", name: "Scarva", region: "UK", country: "GB", url: "https://www.scarva.com", buildUrl: scarvaUrl },
  { id: "glazequeen-us", name: "Glaze Queen", region: "USA", country: "US", url: "https://glazequeen.com", buildUrl: glazeQueenUrl },
  { id: "theceramicshop-us", name: "The Ceramic Shop", region: "USA", country: "US", url: "https://theceramicshop.com", buildUrl: theCeramicShopUrl },
];

export const storeLinksById = new Map(storeLinks.map((store) => [store.id, store]));
