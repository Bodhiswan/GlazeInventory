import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/env";
import { getAllCatalogGlazes, getAllVendorExamples } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const glazes = getAllCatalogGlazes();
  const vendorExamples = getAllVendorExamples();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/glazes`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/combinations`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

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

  return [...staticPages, ...glazePages, ...vendorExamplePages];
}
