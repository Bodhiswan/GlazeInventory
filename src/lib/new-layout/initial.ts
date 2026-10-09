import "server-only";

import { compareFlow, flowPosition } from "./colour";
import { getCone6Catalog } from "./catalog";
import type { NLGlaze } from "./types";

let firstPage: NLGlaze[] | null = null;

/** The first screen of glazes in default colour order, rendered on the server before the full catalogue loads. */
export function getInitialGlazes(count = 48): NLGlaze[] {
  if (!firstPage) {
    const glazes = getCone6Catalog().glazes;
    const flow = new Map(glazes.map((glaze) => [glaze.id, flowPosition(glaze)]));
    firstPage = [...glazes].sort((a, b) => compareFlow(flow.get(a.id)!, flow.get(b.id)!) || a.id.localeCompare(b.id)).slice(0, 48);
  }
  return firstPage.slice(0, count);
}
