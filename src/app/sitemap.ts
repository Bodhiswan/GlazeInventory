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
    {
      url: `${baseUrl}/guides/glazing-pottery`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/guides/glazing-pottery/foundations`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/glazing-pottery/application`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/glazing-pottery/layering`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/glazing-pottery/decorative`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/glazing-pottery/firing`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/glazing-pottery/troubleshooting`,
      changeFrequency: "monthly",
      priority: 0.8,
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
