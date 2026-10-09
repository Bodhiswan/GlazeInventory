/** Data shapes for the Cone 6 layout. Kept compact because the catalogue ships to the browser. */

export interface NLGlaze {
  id: string;
  brand: string;
  code: string;
  name: string;
  line: string;
  /** Raw cone text from the catalogue, e.g. "Cone 5 / Cone 6". */
  cone: string | null;
  /** True when the glaze fires at cone 5–6. Shelf glazes outside that range get a cone tag. */
  cone6: boolean;
  /** A glaze the user added themselves (not in the vendor catalogue). */
  custom?: boolean;
  /** Colour traits: colour words in the name/notes/description plus colours sampled from the photo. */
  ct: string[];
  /** Finish traits (Glossy, Matte, Satin, …). */
  ft: string[];
  /** Named colour weights sampled from the vendor photo. */
  w: Record<string, number>;
  /** Sampled photo palette as [hex, weight], heaviest first. */
  pal: [string, number][];
  /** Search index (see buildGlazeSearchIndex). */
  s: string;
  /** Photos as [url, label], Cone 6 first. Other firings are never labelled Cone 6. */
  photos: [string, string][];
  /** IDs of stores that stock this glaze (see store-links.ts). */
  buy: string[];
  desc: string;
}

export interface NLLayer {
  /** Glaze ID. */
  g: string;
  /** Connector to the next layer, e.g. "Over". */
  to: string | null;
}

export interface NLCombo {
  id: string;
  title: string;
  image: string | null;
  vendor: string;
  url: string | null;
  clay: string | null;
  notes: string | null;
  firing: string | null;
  layers: NLLayer[];
  /** Only set when the combo isn't Cone 6 (old links and a person's own results). */
  cone?: string;
  /** Set for results posted by potters rather than manufacturers. */
  potter?: { name: string; date: string; mine: boolean };
}

export interface NLCatalog {
  glazes: NLGlaze[];
  combos: NLCombo[];
}

export { isCone6 } from "./cone";

export type NLShelfStatus = "owned" | "wishlist";
export type NLFillLevel = "full" | "half" | "low";

export interface NLShelfItem {
  status: NLShelfStatus;
  fill: NLFillLevel;
  /** Jar count; kept so fill-level saves don't reset it. */
  quantity: number;
  note: string;
  sharedWithStudio: boolean;
  folderIds: string[];
}

export interface NLFolder {
  id: string;
  name: string;
}

export interface NLStudio {
  name: string;
  slug: string;
  passcode: string;
  renames: number;
  firingRange: "lowfire" | "midfire" | "both";
}
