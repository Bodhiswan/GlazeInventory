import { getCone6Catalog } from "@/lib/new-layout/catalog";

// Built once per deploy and served from the CDN; the catalogue only changes when the app is redeployed.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getCone6Catalog());
}
