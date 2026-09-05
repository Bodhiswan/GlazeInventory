import type {
  CombinationPost,
  Glaze,
  UserCombinationExample,
  VendorCombinationExample,
} from "@/lib/types";

/**
 * Combination cards and previews only need a small subset of each glaze. The full
 * catalogue record contains long vendor descriptions and editorial fields;
 * repeating those records throughout the combinations payload adds megabytes
 * without changing anything rendered by the browser.
 */
function compactGlaze(glaze: Glaze): Glaze {
  return {
    id: glaze.id,
    sourceType: glaze.sourceType,
    name: glaze.name,
    brand: glaze.brand,
    line: glaze.line,
    code: glaze.code,
    cone: glaze.cone,
    atmosphere: glaze.atmosphere,
    imageUrl: glaze.imageUrl,
    createdAt: glaze.createdAt,
  };
}

export function compactCombinationBrowserPayload({
  examples,
  publishedPosts,
  userExamples,
}: {
  examples: VendorCombinationExample[];
  publishedPosts: CombinationPost[];
  userExamples: UserCombinationExample[];
}) {
  const glazeById = new Map<string, Glaze>();

  const getCompactGlaze = (glaze: Glaze) => {
    const existing = glazeById.get(glaze.id);
    if (existing) return existing;

    const compact = compactGlaze(glaze);
    glazeById.set(glaze.id, compact);
    return compact;
  };

  const compactExamples = examples.map((example) => ({
    ...example,
    layers: example.layers.map((layer) => ({
      ...layer,
      glaze: layer.glaze ? getCompactGlaze(layer.glaze) : layer.glaze,
    })),
  }));

  const compactPublishedPosts = publishedPosts.map((post): CombinationPost => ({
    ...post,
    glazes: post.glazes
      ? [getCompactGlaze(post.glazes[0]), getCompactGlaze(post.glazes[1])]
      : undefined,
  }));

  const compactUserExamples = userExamples.map((example) => ({
    ...example,
    layers: example.layers.map((layer) => ({
      ...layer,
      glaze: layer.glaze ? getCompactGlaze(layer.glaze) : layer.glaze,
    })),
  }));

  return {
    examples: compactExamples,
    publishedPosts: compactPublishedPosts,
    userExamples: compactUserExamples,
  };
}
