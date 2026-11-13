import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { MemberLink, linkClass } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/page-header";
import { getStudios, requireAdminViewer } from "@/lib/data/admin";

export default async function AdminStudiosPage() {
  await requireAdminViewer();
  const studios = await getStudios();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Studios"
        description="Studio pages members have set up to share their glaze shelf, and how much each is being visited."
      />

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-panel text-left text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-medium">Studio</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 text-right font-medium">Shared glazes</th>
              <th className="px-4 py-3 text-right font-medium">Visits</th>
              <th className="px-4 py-3 font-medium">Last visit</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {studios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No studio pages yet.
                </td>
              </tr>
            ) : (
              studios.map((studio) => (
                <tr key={studio.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{studio.displayName}</p>
                    <Link href={`/studio/${studio.slug}`} className={`text-xs text-muted ${linkClass}`}>
                      /studio/{studio.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <MemberLink id={studio.ownerId} name={studio.ownerName} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{studio.sharedGlazes}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{studio.visits}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {studio.lastVisitAt
                      ? formatDistanceToNow(new Date(studio.lastVisitAt), { addSuffix: true })
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{format(new Date(studio.createdAt), "d MMM yyyy")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
