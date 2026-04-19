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
  {
    protocol: "https" as const,
    hostname: "www.spectrumglazes.com",
    pathname: "/wp-content/uploads/**",
  },
  {
    protocol: "https" as const,
    hostname: "cdn.powered-by-nitrosell.com",
    pathname: "/product_images/**",
  },
  {
    protocol: "https" as const,
    hostname: "www.coyoteclay.com",
  },
  {
    protocol: "https" as const,
    hostname: "cdn.shopify.com",
    pathname: "/s/files/**",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "45mb",
    },
  },
  images: {
    remotePatterns,
    // Custom loader routes Supabase Storage images through Supabase's own
    // image transformation endpoint (free, served from their CDN) and passes
    // vendor CDN URLs through unchanged. This avoids Vercel's Image
    // Optimization quota entirely while still giving us properly sized
    // responsive images for anything we host ourselves.
    loader: "custom",
    loaderFile: "./src/lib/supabase-image-loader.ts",
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      "@data": path.resolve(__dirname, "data"),
    },
  },
};

export default nextConfig;
