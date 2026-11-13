import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { actionClass, EmptyNote } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/page-header";
import { getPortfolios, requireAdminViewer } from "@/lib/data/admin";

export default async function AdminPortfoliosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminViewer();
  const search = (await searchParams).q?.trim() ?? "";
  const portfolios = await getPortfolios(search);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Portfolios"
        description="Each member's published combinations, with the likes and comments they have drawn. Open a portfolio to review or remove individual pieces."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search by member or studio"
            aria-label="Search portfolios"
            className="h-8 min-w-[220px] max-w-md flex-1 border border-border bg-background px-3 text-sm"
          />
          <button type="submit" className={actionClass()}>
            Search
          </button>
          {search ? (
            <Link href="/admin/portfolios" className={actionClass()}>
              Clear
            </Link>
          ) : null}
        </form>
        <p className="text-xs text-muted">
          {portfolios.length} portfolio{portfolios.length === 1 ? "" : "s"}, largest first
        </p>
      </div>

      {portfolios.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Link
              key={portfolio.memberId}
              href={`/admin/users/${portfolio.memberId}#portfolio`}
              className="group border border-border bg-panel-strong transition-colors hover:border-foreground/40"
            >
              <div className="grid h-28 grid-cols-5 gap-px bg-border">
                {Array.from({ length: 5 }, (_, index) =>
                  portfolio.covers[index] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={index}
                      src={portfolio.covers[index]}
                      alt=""
                      loading="lazy"
                      className="h-28 w-full bg-background object-cover"
                    />
                  ) : (
                    <div key={index} className="bg-background" />
                  ),
                )}
              </div>
              <div className="space-y-2 p-4">
                <div>
                  <h2 className="truncate text-base font-semibold">{portfolio.memberName}</h2>
                  <p className="truncate text-xs text-muted">
                    {portfolio.studioName ? `${portfolio.studioName} · ` : ""}
                    latest {formatDistanceToNow(new Date(portfolio.latestAt), { addSuffix: true })}
                  </p>
                </div>
                <dl className="flex gap-5 text-xs text-muted">
                  {[
                    ["Pieces", portfolio.pieces],
                    ["Likes", portfolio.likes],
                    ["Comments", portfolio.comments],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dd className="text-lg font-semibold leading-none tabular-nums text-foreground">
                        {value.toLocaleString()}
                      </dd>
                      <dt className="mt-1 text-[10px] uppercase tracking-[0.14em]">{label}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyNote>
          {search ? "No portfolios match that search." : "No member has published a combination yet."}
        </EmptyNote>
      )}
    </div>
  );
}
