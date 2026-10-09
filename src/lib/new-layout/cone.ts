/** True when a cone description includes cone 5 or 6 ("Cone 6", "Cone 5 / Cone 6", "Cone 5/6"). Cone 06 is earthenware and doesn't match. */
export function isCone6(cone: string | null | undefined) {
  return /\bcone\s*(5|6)\b|\b5\s*\/\s*6\b/i.test(cone ?? "");
}

/** Short tag for shelf glazes outside cone 6, e.g. "Cone 06" or "Cone 10". */
export function coneTag(cone: string | null | undefined) {
  if (!cone || isCone6(cone)) return null;
  const first = cone.match(/cone\s*0?\d+/i)?.[0];
  return first ? first.replace(/^cone\s*/i, "Cone ") : cone;
}
