import type { CombinationPost, Glaze } from "@/lib/types";
import { formatGlazeLabel } from "@/lib/utils";

export function extractConeLabel(value: string | null | undefined) {
  const match = value?.match(/\bcone\b[^0-9]*([0-9]{1,2})/i) ?? value?.match(/\b([0-9]{1,2})\b/);
  return match?.[1] ? `Cone ${match[1]}` : null;
}

export function normalizeComparisonText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function extractPostLayerOrder(post: CombinationPost) {
  const match = post.applicationNotes?.match(/layer order:\s*(.+?)\s+over\s+(.+?)(?:\.|$)/i);

  if (!match) {
    return null;
  }

  return {
    top: match[1]?.trim() ?? "",
    base: match[2]?.trim() ?? "",
  };
}

export function glazeMatchesLayerToken(glaze: Glaze, token: string) {
  const normalizedToken = normalizeComparisonText(token);

  if (!normalizedToken) {
    return false;
  }

  const candidates = [
    formatGlazeLabel(glaze),
    glaze.code,
    glaze.name,
    [glaze.code, glaze.name].filter(Boolean).join(" "),
  ]
    .map((value) => normalizeComparisonText(value))
    .filter(Boolean);

  return candidates.some(
    (candidate) =>
      candidate === normalizedToken ||
      candidate.includes(normalizedToken) ||
      normalizedToken.includes(candidate),
  );
}

export function getOrderedPostGlazes(post: CombinationPost) {
  const glazes = [...(post.glazes ?? [])];
  const layerOrder = extractPostLayerOrder(post);

  if (!layerOrder || glazes.length < 2) {
    return glazes;
  }

  const topGlaze = glazes.find((glaze) => glazeMatchesLayerToken(glaze, layerOrder.top));
  const baseGlaze = glazes.find(
    (glaze) => glaze.id !== topGlaze?.id && glazeMatchesLayerToken(glaze, layerOrder.base),
  );

  if (!topGlaze || !baseGlaze) {
    return glazes;
  }

  return [topGlaze, baseGlaze];
}

export function toggleValue(values: string[], target: string) {
  return values.includes(target) ? values.filter((value) => value !== target) : [...values, target];
}
