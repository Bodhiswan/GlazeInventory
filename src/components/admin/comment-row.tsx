import { format } from "date-fns";
import Link from "next/link";

import { adminDeleteCommentAction } from "@/app/actions/admin";
import type { AdminComment } from "@/lib/data/admin";

import { actionClass, linkClass, MemberLink } from "./admin-ui";
import { ConfirmButton } from "./confirm-button";

export function CommentRow({ comment }: { comment: AdminComment }) {
  return (
    <article className="flex flex-wrap items-start justify-between gap-3 border border-border bg-panel-strong p-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm leading-6 [overflow-wrap:anywhere]">{comment.body}</p>
        <p className="text-xs text-muted">
          <MemberLink id={comment.authorId} name={comment.authorName} /> on{" "}
          <Link href={comment.href} className={linkClass}>
            {comment.targetLabel}
          </Link>{" "}
          · <time dateTime={comment.createdAt}>{format(new Date(comment.createdAt), "d MMM yyyy, HH:mm")}</time>
        </p>
      </div>
      <form action={adminDeleteCommentAction}>
        <input type="hidden" name="kind" value={comment.kind} />
        <input type="hidden" name="id" value={comment.id} />
        <ConfirmButton className={actionClass("danger")} message="Delete this comment? This cannot be undone.">
          Delete
        </ConfirmButton>
      </form>
    </article>
  );
}
