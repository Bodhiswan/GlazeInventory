import { format } from "date-fns";
import Link from "next/link";

import {
  adminApproveSubmissionAction,
  adminEditCombinationAction,
  adminEditCommunityFiringImageAction,
  adminEditCustomGlazeAction,
  adminPermanentDeleteSubmissionAction,
  adminRejectSubmissionAction,
  adminReopenSubmissionAction,
} from "@/app/actions/admin";
import type { Submission, SubmissionKind } from "@/lib/data/admin";

import { actionClass, linkClass, MemberLink, StateBadge } from "./admin-ui";
import { ConfirmButton } from "./confirm-button";

const KIND_LABEL: Record<SubmissionKind, string> = {
  combination: "Combination",
  glaze: "Custom glaze",
  firingImage: "Firing photo",
};

const EDIT: Record<SubmissionKind, { action: (formData: FormData) => Promise<void>; idField: string }> = {
  combination: { action: adminEditCombinationAction, idField: "exampleId" },
  glaze: { action: adminEditCustomGlazeAction, idField: "glazeId" },
  firingImage: { action: adminEditCommunityFiringImageAction, idField: "imageId" },
};

const inputClass = "w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground";
const thumbClass = "h-24 w-24 border border-border bg-background sm:h-28 sm:w-28";

function Target({ item }: { item: Submission }) {
  return (
    <>
      <input type="hidden" name="target" value={item.kind} />
      <input type="hidden" name="id" value={item.id} />
    </>
  );
}

/** One submission with its review actions. Used in the queue and on a member's page. */
export function SubmissionCard({ item, showKind = false }: { item: Submission; showKind?: boolean }) {
  const edit = EDIT[item.kind];

  return (
    <article className="border border-border bg-panel-strong">
      <div className="flex gap-4 p-4">
        {item.imageUrl ? (
          <a href={item.imageUrl} target="_blank" rel="noreferrer" className="shrink-0" title="Open the full image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt="" loading="lazy" className={`${thumbClass} object-cover`} />
          </a>
        ) : (
          <div
            className={`${thumbClass} flex shrink-0 items-center justify-center text-[10px] uppercase tracking-[0.14em] text-muted`}
          >
            No image
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-base font-semibold leading-tight [overflow-wrap:anywhere]">{item.title}</h3>
            <StateBadge state={item.state} />
          </div>
          <p className="text-xs leading-5 text-muted">
            {showKind ? `${KIND_LABEL[item.kind]} · ` : null}
            {item.detail ? `${item.detail} · ` : null}
            by <MemberLink id={item.authorId} name={item.authorName} /> ·{" "}
            <time dateTime={item.createdAt}>{format(new Date(item.createdAt), "d MMM yyyy, HH:mm")}</time>
            {item.href ? (
              <>
                {" · "}
                <Link href={item.href} className={linkClass}>
                  View on site
                </Link>
              </>
            ) : null}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {item.state === "pending" ? (
              <form action={adminApproveSubmissionAction}>
                <Target item={item} />
                <button type="submit" className={actionClass("approve")}>
                  Approve
                </button>
              </form>
            ) : null}
            {item.state !== "rejected" ? (
              <form action={adminRejectSubmissionAction}>
                <Target item={item} />
                <ConfirmButton
                  className={actionClass("danger")}
                  message={`Reject "${item.title}"? This voids the points it earned and adds a strike to ${item.authorName}.`}
                >
                  Reject
                </ConfirmButton>
              </form>
            ) : null}
            {item.state !== "pending" ? (
              <form action={adminReopenSubmissionAction}>
                <Target item={item} />
                <button type="submit" className={actionClass()}>
                  Back to pending
                </button>
              </form>
            ) : null}
            {item.state === "rejected" ? (
              <form action={adminPermanentDeleteSubmissionAction}>
                <Target item={item} />
                <ConfirmButton
                  className={actionClass("danger")}
                  message={`Permanently delete "${item.title}"? This cannot be undone.`}
                >
                  Delete permanently
                </ConfirmButton>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      <details className="border-t border-border">
        <summary className="cursor-pointer px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-muted hover:text-foreground">
          Edit details
        </summary>
        <form action={edit.action} className="grid gap-3 px-4 pb-4 pt-1 sm:grid-cols-2">
          <input type="hidden" name={edit.idField} value={item.id} />
          {item.fields.map((field) => (
            <label
              key={field.name}
              className={`grid gap-1 text-xs text-muted${field.multiline ? " sm:col-span-2" : ""}`}
            >
              {field.label}
              {field.options ? (
                <select name={field.name} defaultValue={field.value} className={inputClass}>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.multiline ? (
                <textarea name={field.name} defaultValue={field.value} rows={3} className={inputClass} />
              ) : (
                <input name={field.name} defaultValue={field.value} className={inputClass} />
              )}
            </label>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" className={actionClass()}>
              Save changes
            </button>
          </div>
        </form>
      </details>
    </article>
  );
}
