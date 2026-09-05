export const RESULT_CONES = ["Cone 6", "Cone 10"] as const;
export type ResultCone = (typeof RESULT_CONES)[number];

export function isResultCone(value: string): value is ResultCone {
  return RESULT_CONES.some((cone) => cone === value);
}

/** Preserve leading zeros: Cone 06 is a different firing from Cone 6. */
export function matchesResultCone(value: string | null | undefined, cones: readonly string[] = RESULT_CONES) {
  const tokens: string[] = value?.match(/\b\d+\b/g) ?? [];
  return cones.some((cone) => isResultCone(cone) && tokens.includes(cone.slice(5)));
}

export function contributionUrl(glazeIds: string[], cone?: string | null) {
  const params = new URLSearchParams();
  [...new Set(glazeIds)].slice(0, 4).forEach((id) => params.append("glaze", id));
  if (cone && isResultCone(cone)) params.set("cone", cone);
  return `/contribute?${params}`;
}
