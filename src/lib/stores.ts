/**
 * Retail store configuration for "Buy" links on glaze detail panels.
 *
 * Each store defines which brands it carries and a strategy for building
 * search/product URLs. Different stores index products differently —
 * some strip hyphens from codes, some use full names, some need brand
 * prefixes — so each store provides its own `buildUrl` function.
 *
 * Most stores carry a product-level inventory so we only show "Buy" links
 * for glazes the store actually stocks (even if out of stock temporarily).
 * Search-only stores fall back to brand-level checks until we have a local
 * product scrape for them.
 */

import clayKingData from "@data/stores/clay-king-us.json";
import glazeQueenData from "@data/stores/glazequeen-us.json";
import potteryPaintsData from "@data/stores/pottery-paints-au.json";
import theCeramicShopData from "@data/stores/theceramicshop-us.json";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StoreProduct {
  brand: string;
  code: string;
  name: string;
}

export interface RetailStore {
  id: string;
  name: string;
  region: string;
  /** ISO 3166-1 alpha-2 country code for flag display */
  country: string;
  url: string;
  /** Brands this store carries (lowercase for matching) */
  brands: string[];
  /**
   * Build the product/search URL for a given glaze.
   * Each store implements its own strategy for mapping glaze data to a URL.
   */
  buildUrl: (glaze: { code: string | null; name: string; brand: string | null }) => string;
  /**
   * Check whether this store carries a specific glaze.
   * Falls back to brand-level check if no product inventory is loaded.
   */
  carries: (glaze: { code: string | null; name: string; brand: string | null }) => boolean;
}

// ─── Product indexes (built once at import time) ───────────────────────────────

/** Normalize a glaze code for lookup: strip hyphens, spaces, lowercase */
function normalizeForLookup(value: string): string {
  return value.replace(/[-\s]/g, "").toLowerCase();
}

/** Build a Set of "brand::code" keys for fast lookup */
function buildProductIndex(products: StoreProduct[]): Set<string> {
  const index = new Set<string>();
  for (const p of products) {
    index.add(`${p.brand.toLowerCase()}::${normalizeForLookup(p.code)}`);
  }
  return index;
}

/** Build a Set of normalized glaze names per brand for name-based matching (Coyote) */
function buildNameIndex(products: StoreProduct[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const p of products) {
    const brand = p.brand.toLowerCase();
    if (!index.has(brand)) index.set(brand, new Set());
    index.get(brand)!.add(normalizeForLookup(p.name));
  }
  return index;
}

/**
 * Generic carries check — tries code match, then name match.
 * Reused across stores that share the same matching logic.
 */
function makeCarriesCheck(
  codeIndex: Set<string>,
  nameIndex: Map<string, Set<string>>,
): (glaze: { code: string | null; name: string; brand: string | null }) => boolean {
  return (glaze) => {
    const brand = (glaze.brand ?? "").toLowerCase();
    if (!brand) return false;

    // Try code-based match
    if (glaze.code) {
      const key = `${brand}::${normalizeForLookup(glaze.code)}`;
      if (codeIndex.has(key)) return true;
    }

    // Fall back to name-based match (for brands like Coyote that use names as identifiers)
    const brandNames = nameIndex.get(brand);
    if (brandNames) {
      const normalizedName = normalizeForLookup(glaze.name);
      if (brandNames.has(normalizedName)) return true;
    }

    return false;
  };
}

function makeBrandCarriesCheck(
  brands: string[],
): (glaze: { code: string | null; name: string; brand: string | null }) => boolean {
  const carriedBrands = new Set(brands);
  return (glaze) => {
    const brand = (glaze.brand ?? "").toLowerCase();
    return Boolean(brand && carriedBrands.has(brand));
  };
}

const bathPottersBrands = [
  "amaco",
  "bath potters",
  "bath potters supplies",
  "botz",
  "glost",
  "kiwi",
  "mayco",
  "spectrum",
  "terracolor",
];

const potterycraftsBrands = [
  "amaco",
  "botz",
  "duncan",
  "mayco",
  "potterycrafts",
  "spectrum",
  "terracolor",
];

const scarvaBrands = [
  "amaco",
  "botz",
  "chrysanthos",
  "mayco",
  "scarva",
  "spectrum",
];

// ─── Per-store indexes ─────────────────────────────────────────────────────────

const potteryPaintsCarries = makeCarriesCheck(
  buildProductIndex(potteryPaintsData.products),
  buildNameIndex(potteryPaintsData.products),
);

const clayKingCarries = makeCarriesCheck(
  buildProductIndex(clayKingData.products),
  buildNameIndex(clayKingData.products),
);

const glazeQueenCarries = makeCarriesCheck(
  buildProductIndex(glazeQueenData.products),
  buildNameIndex(glazeQueenData.products),
);

const theCeramicShopCarries = makeCarriesCheck(
  buildProductIndex(theCeramicShopData.products),
  buildNameIndex(theCeramicShopData.products),
);

const bathPottersCarries = makeBrandCarriesCheck(bathPottersBrands);
const potterycraftsCarries = makeBrandCarriesCheck(potterycraftsBrands);
const scarvaCarries = makeBrandCarriesCheck(scarvaBrands);

// ─── Store URL strategies ──────────────────────────────────────────────────────

/**
 * Pottery Paints (AU) — WooCommerce search.
 * Their product titles drop hyphens from codes (e.g. "PC25" not "PC-25"),
 * so we strip hyphens/spaces before searching.
 */
function potteryPaintsUrl(glaze: { code: string | null; name: string }): string {
  const query = glaze.code ? glaze.code.replace(/[-\s]/g, "") : glaze.name;
  return `https://potterypaints.com.au/?s=${encodeURIComponent(query)}&post_type=product`;
}

/**
 * Clay King (US) — WooCommerce search.
 * They keep hyphens in codes (e.g. "PC-25"), so we pass the code as-is.
 */
function clayKingUrl(glaze: { code: string | null; name: string }): string {
  const query = glaze.code ?? glaze.name;
  return `https://clay-king.com/?s=${encodeURIComponent(query)}&post_type=product`;
}

/**
 * Glaze Queen (US) — site search via Google.
 * Their site blocks direct search requests, so we use a site-scoped Google search.
 */
function glazeQueenUrl(glaze: { code: string | null; name: string }): string {
  const query = glaze.code ?? glaze.name;
  return `https://www.google.com/search?q=site%3Aglazequeen.com+${encodeURIComponent(query)}`;
}

/**
 * The Ceramic Shop (US) — Nitrosell search.
 * Uses keyword search at /store/search.asp. Hyphens in codes work fine.
 */
function theCeramicShopUrl(glaze: { code: string | null; name: string }): string {
  const query = glaze.code ?? glaze.name;
  return `https://theceramicshop.com/store/search.asp?keyword=${encodeURIComponent(query)}`;
}

/**
 * Bath Potters Supplies (UK) - site search uses path-based search URLs.
 */
function bathPottersUrl(glaze: { code: string | null; name: string }): string {
  const query = glaze.code ?? glaze.name;
  return `https://www.bathpotters.co.uk/search/${encodeURIComponent(query)}`;
}

/**
 * Potterycrafts (UK) - Shopify search.
 */
function potterycraftsUrl(glaze: { code: string | null; name: string }): string {
  const query = glaze.code ?? glaze.name;
  return `https://potterycrafts.co.uk/search?q=${encodeURIComponent(query)}`;
}

/**
 * Scarva (UK) - site-scoped Google search.
 * Their site can block automated direct requests, so this mirrors the
 * Glaze Queen approach and still lands users on product results.
 */
function scarvaUrl(glaze: { code: string | null; name: string }): string {
  const query = glaze.code ?? glaze.name;
  return `https://www.google.com/search?q=site%3Ascarva.com+${encodeURIComponent(query)}`;
}

// ─── Store registry ────────────────────────────────────────────────────────────

export const retailStores: RetailStore[] = [
  {
    id: "pottery-paints-au",
    name: "Pottery Paints",
    region: "AUS",
    country: "AU",
    url: "https://potterypaints.com.au",
    brands: ["amaco", "coyote", "mayco", "spectrum", "laguna", "northcote"],
    buildUrl: potteryPaintsUrl,
    carries: potteryPaintsCarries,
  },
  {
    id: "clay-king-us",
    name: "Clay King",
    region: "USA",
    country: "US",
    url: "https://clay-king.com",
    brands: ["amaco", "coyote", "mayco", "spectrum", "laguna", "speedball", "duncan"],
    buildUrl: clayKingUrl,
    carries: clayKingCarries,
  },
  {
    id: "bath-potters-uk",
    name: "Bath Potters",
    region: "UK",
    country: "GB",
    url: "https://www.bathpotters.co.uk",
    brands: bathPottersBrands,
    buildUrl: bathPottersUrl,
    carries: bathPottersCarries,
  },
  {
    id: "potterycrafts-uk",
    name: "Potterycrafts",
    region: "UK",
    country: "GB",
    url: "https://potterycrafts.co.uk",
    brands: potterycraftsBrands,
    buildUrl: potterycraftsUrl,
    carries: potterycraftsCarries,
  },
  {
    id: "scarva-uk",
    name: "Scarva",
    region: "UK",
    country: "GB",
    url: "https://www.scarva.com",
    brands: scarvaBrands,
    buildUrl: scarvaUrl,
    carries: scarvaCarries,
  },
  {
    id: "glazequeen-us",
    name: "Glaze Queen",
    region: "USA",
    country: "US",
    url: "https://glazequeen.com",
    brands: ["amaco", "coyote", "mayco", "spectrum", "laguna", "speedball"],
    buildUrl: glazeQueenUrl,
    carries: glazeQueenCarries,
  },
  {
    id: "theceramicshop-us",
    name: "The Ceramic Shop",
    region: "USA",
    country: "US",
    url: "https://theceramicshop.com",
    brands: ["amaco", "coyote", "mayco", "spectrum", "speedball", "laguna"],
    buildUrl: theCeramicShopUrl,
    carries: theCeramicShopCarries,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Find stores that carry a specific glaze (product-level check) */
export function getStoresForGlaze(glaze: {
  code?: string | null | undefined;
  name: string;
  brand?: string | null | undefined;
}): RetailStore[] {
  const normalized = {
    code: glaze.code ?? null,
    name: glaze.name,
    brand: glaze.brand ?? null,
  };
  return retailStores.filter((store) => store.carries(normalized));
}

/** @deprecated Use getStoresForGlaze for product-level matching */
export function getStoresForBrand(brand: string | null | undefined): RetailStore[] {
  if (!brand) return [];
  const normalized = brand.toLowerCase();
  return retailStores.filter((store) => store.brands.includes(normalized));
}

/** Build the URL for a store + glaze (delegates to the store's strategy) */
export function buildStoreSearchUrl(
  store: RetailStore,
  code: string | null | undefined,
  name: string,
  brand?: string | null,
): string {
  return store.buildUrl({ code: code ?? null, name, brand: brand ?? null });
}
