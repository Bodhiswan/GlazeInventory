export type StudioFiringRange = "lowfire" | "midfire" | "both";

export function isStudioFiringRange(value: unknown): value is StudioFiringRange {
  return value === "lowfire" || value === "midfire" || value === "both";
}

export const STUDIO_FIRING_LABELS: Record<StudioFiringRange, string> = {
  lowfire: "Earthenware (cone 06)",
  midfire: "Midfire (cone 6)",
  both: "Both cone 06 and cone 6",
};

/** Does a glaze's cone string fit the studio's declared firing range? */
export function glazeMatchesStudioFiring(
  cone: string | null | undefined,
  range: StudioFiringRange,
): boolean {
  if (range === "both") return true;
  if (!cone) return false;
  // Tokenize cone numbers, preserving leading zero (e.g. "06", "6", "10").
  const tokens = cone.match(/0?\d+/g) ?? [];
  if (range === "lowfire") {
    // Earthenware = any leading-zero cone token (06, 05, 04, 03 …).
    return tokens.some((t) => /^0\d+$/.test(t));
  }
  // Midfire = cone 5 or cone 6 *without* a leading zero.
  return tokens.some((t) => t === "5" || t === "6");
}
