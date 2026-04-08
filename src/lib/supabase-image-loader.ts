/**
 * Custom next/image loader.
 *
 * Strategy:
 *   - For Supabase Storage URLs, rewrite them to use Supabase's on-the-fly
 *     image transformation endpoint (`/render/image/...`) so we get resized
 *     WebP output for free, served from Supabase's CDN. This bypasses Vercel's
 *     Image Optimization quota entirely.
 *   - For every other URL (vendor CDNs, relative paths, etc.) return the src
 *     unchanged. Next.js will then emit the raw URL into `srcset` without
 *     routing through `/_next/image`, which means zero Vercel image
 *     transformations and zero origin transfer for those bytes.
 *
 * Net effect: we get the benefits of `next/image` (lazy loading, sizes,
 * placeholders) without consuming Vercel's Image Optimization quota, while
 * still getting properly sized WebPs for anything we host ourselves.
 */
type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

const SUPABASE_OBJECT_RE = /^(https?:\/\/[^/]+)\/storage\/v1\/object\/(public|sign)\/(.+)$/;

export default function supabaseImageLoader({ src, width, quality }: LoaderArgs): string {
  // Pass-through for relative paths / data URLs / anything we don't recognise.
  if (!src.startsWith("http")) return src;

  const match = src.match(SUPABASE_OBJECT_RE);
  if (!match) {
    // Vendor CDN or other absolute URL — serve as-is (no Vercel optimization).
    return src;
  }

  const [, origin, visibility, path] = match;
  // Signed URLs carry a `token` query string that we must preserve.
  const [pathOnly, existingQuery] = path.split("?");
  const params = new URLSearchParams(existingQuery ?? "");
  params.set("width", String(width));
  params.set("quality", String(quality ?? 75));
  params.set("resize", "contain");

  return `${origin}/storage/v1/render/image/${visibility}/${pathOnly}?${params.toString()}`;
}
