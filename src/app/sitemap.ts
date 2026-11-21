import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/env";
import { getAllCatalogGlazes, getAllVendorExamples } from "@/lib/catalog";
import { getPublishedCombinationPairKeys } from "@/lib/data/combinations";
import { getCollections } from "@/lib/new-layout/collections";
import { GUIDE_PARTS } from "@/app/guides/glazing-pottery/guide-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const glazes = getAllCatalogGlazes();
  const vendorExamples = getAllVendorExamples();
  const pairKeys = await getPublishedCombinationPairKeys();

  // The home page redirects to /glazes, so it isn't listed.
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/glazes`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/combinations`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/cone-6-glazes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/guides/glazing-pottery`, changeFrequency: "weekly", priority: 0.85 },
    ...GUIDE_PARTS.filter((part) => part.status === "live").map((part) => ({
      url: `${baseUrl}/guides/glazing-pottery/${part.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  const browsePages: MetadataRoute.Sitemap = getCollections().map((collection) => ({
    url: `${baseUrl}/cone-6-glazes/${collection.slug}`,
    changeFrequency: "weekly" as const,
    priority: collection.kind === "line" ? 0.7 : 0.85,
  }));

  const glazePages: MetadataRoute.Sitemap = glazes.map((glaze) => ({
    url: `${baseUrl}/glazes/${glaze.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const vendorExamplePages: MetadataRoute.Sitemap = vendorExamples.map(
    (example) => ({
      url: `${baseUrl}/combinations/examples/${example.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  const combinationPages: MetadataRoute.Sitemap = pairKeys.map((pairKey) => ({
    url: `${baseUrl}/combinations/${pairKey}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...browsePages, ...glazePages, ...combinationPages, ...vendorExamplePages];
}
