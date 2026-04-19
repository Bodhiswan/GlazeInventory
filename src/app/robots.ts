import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/glazes", "/combinations"],
        disallow: [
          "/auth/",
          "/admin/",
          "/api/",
          "/community",
          "/dashboard",
          "/inventory",
          "/profile",
          "/contribute",
          "/studio/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
