import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { linkClass } from "@/components/admin/admin-ui";
import { getAdminCounts, requireAdminViewer } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await requireAdminViewer();
  const counts = await getAdminCounts();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-border bg-background lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-baseline justify-between gap-3 px-4 py-4 lg:block lg:px-6 lg:pb-6 lg:pt-7">
          <Link href="/admin" className="display-font text-xl leading-none tracking-tight">
            Glaze Inventory
          </Link>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted lg:mt-2">Admin console</p>
        </div>

        <AdminNav
          counts={{
            moderation: counts.pendingSubmissions + counts.openReports,
            requests: counts.pendingRequests,
            imports: counts.queuedIntakes,
          }}
        />

        <div className="mt-auto hidden space-y-2 border-t border-border px-6 py-5 text-xs text-muted lg:block">
          <p className="truncate">
            Signed in as <span className="text-foreground">{viewer.profile.displayName}</span>
          </p>
          {viewer.mode === "demo" ? <p>Preview data — changes are not saved.</p> : null}
          <Link href="/glazes" className={`inline-block ${linkClass}`}>
            ← Back to the site
          </Link>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
