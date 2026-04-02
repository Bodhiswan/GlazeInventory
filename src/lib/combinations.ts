import type { CombinationSummary, Glaze } from "@/lib/types";

export function createPairKey(glazeAId: string, glazeBId: string) {
  return [glazeAId, glazeBId].sort().join("--");
}

export function parsePairKey(pairKey: string) {
  const [glazeAId, glazeBId] = pairKey.split("--");

  if (!glazeAId || !glazeBId) {
    return null;
  }

  return [glazeAId, glazeBId] as const;
}

export function buildCombinationSummaries(
  glazes: Glaze[],
  postCounts: Record<string, number> = {},
): CombinationSummary[] {
  const pairs: CombinationSummary[] = [];

  for (let index = 0; index < glazes.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < glazes.length; nextIndex += 1) {
      const pair = [glazes[index], glazes[nextIndex]].sort((left, right) =>
        left.name.localeCompare(right.name),
      ) as [Glaze, Glaze];
      const pairKey = createPairKey(pair[0].id, pair[1].id);

      pairs.push({
        pairKey,
        glazes: pair,
        postCount: postCounts[pairKey] ?? 0,
        viewerOwnsPair: true,
      });
    }
  }

  return pairs.sort((left, right) => {
    if (right.postCount !== left.postCount) {
      return right.postCount - left.postCount;
    }

    return `${left.glazes[0].name}${left.glazes[1].name}`.localeCompare(
      `${right.glazes[0].name}${right.glazes[1].name}`,
    );
  });
}
