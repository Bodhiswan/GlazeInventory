import type { NextConfig } from "next";
import path from "node:path";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;
const remotePatterns: RemotePattern[] = [
  ...(supabaseHostname
    ? [
        {
          protocol: "https" as const,
          hostname: supabaseHostname,
          pathname: "/storage/v1/object/public/**",
        },
        {
          protocol: "https" as const,
          hostname: supabaseHostname,
          pathname: "/storage/v1/object/sign/**",
        },
      ]
    : []),
  {
    protocol: "https" as const,
    hostname: "www.maycocolors.com",
    pathname: "/wp-content/uploads/**",
  },
  {
    protocol: "https" as const,
    hostname: "archive.maycocolors.com",
    pathname: "/wp-content/uploads/**",
  },
  {
    protocol: "https" as const,
    hostname: "cdn11.bigcommerce.com",
  },
  {
    protocol: "https" as const,
    hostname: "amaco.com",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
  },
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      "@data": path.resolve(__dirname, "data"),
    },
  },
};

export default nextConfig;
