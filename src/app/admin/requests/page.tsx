import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { adminSetBrandRequestStatusAction } from "@/app/actions/admin";
import { actionClass, EmptyNote, MemberLink, SectionTitle, StateBadge, Tabs, linkClass } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/page-header";
import { getBrandRequests, getGuideReports, REQUEST_STATUSES, requireAdminViewer, type RequestStatus } from "@/lib/data/admin";

const STATUS_ACTIONS: Record<RequestStatus, Array<{ to: RequestStatus; label: string; tone?: "approve" }>> = {
  pending: [
    { to: "added", label: "Mark as added", tone: "approve" },
    { to: "declined", label: "Decline" },
  ],
  added: [{ to: "pending", label: "Back to pending" }],
  declined: [{ to: "pending", label: "Back to pending" }],
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminViewer();
  const [params, requests, guideReports] = await Promise.all([searchParams, getBrandRequests(), getGuideReports()]);

  const status = REQUEST_STATUSES.find((option) => option === params.status) ?? "pending";
  const visible = requests.filter((request) => request.status === status);
  const countFor = (option: RequestStatus) => requests.filter((request) => request.status === option).length;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Requests"
        description="Brands members have asked for, and problems they have flagged in the guides."
      />

      <section className="space-y-4">
        <SectionTitle>Brand requests</SectionTitle>
        <Tabs
          label="Request status"
          active={status}
          tabs={REQUEST_STATUSES.map((option) => ({
            key: option,
            label: option,
            href: `/admin/requests?status=${option}`,
            count: option === "pending" ? countFor(option) : undefined,
          }))}
        />
        {visible.length ? (
          <div className="space-y-3">
            {visible.map((request) => (
              <article
                key={request.id}
                className="flex flex-wrap items-start justify-between gap-3 border border-border bg-panel-strong p-4"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold [overflow-wrap:anywhere]">{request.brandName}</h3>
                    <StateBadge state={request.status} />
                  </div>
                  {request.notes ? <p className="text-sm leading-6 [overflow-wrap:anywhere]">{request.notes}</p> : null}
                  <p className="text-xs text-muted">
                    <MemberLink id={request.userId} name={request.userName} /> ·{" "}
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ACTIONS[status].map((action) => (
                    <form key={action.to} action={adminSetBrandRequestStatusAction}>
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="status" value={action.to} />
                      <button type="submit" className={actionClass(action.tone)}>
                        {action.label}
                      </button>
                    </form>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyNote>No {status} brand requests.</EmptyNote>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle aside="Most recent 50">Guide issue reports</SectionTitle>
        {guideReports.length ? (
          <div className="space-y-3">
            {guideReports.map((report) => (
              <article key={report.id} className="space-y-1.5 border border-border bg-panel-strong p-4">
                <h3 className="text-sm font-semibold">
                  {report.guideTitle} — {report.sectionLabel}
                </h3>
                <p className="text-sm leading-6 [overflow-wrap:anywhere]">{report.note || "No note left."}</p>
                <p className="text-xs text-muted">
                  <MemberLink id={report.userId} name={report.userName} /> ·{" "}
                  {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  {report.pagePath ? (
                    <>
                      {" · "}
                      <Link href={report.pagePath} className={linkClass}>
                        Open the guide
                      </Link>
                    </>
                  ) : null}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyNote>No guide issues reported.</EmptyNote>
        )}
      </section>
    </div>
  );
}
