import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

import { adminResetStrikesAction, adminSetContributionsDisabledAction } from "@/app/actions/admin";
import { actionClass, EmptyNote, SectionTitle, StateBadge, linkClass } from "@/components/admin/admin-ui";
import { CommentRow } from "@/components/admin/comment-row";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { SubmissionCard } from "@/components/admin/submission-card";
import { StatTile } from "@/components/ui/stat-tile";
import { getAdminUserAccount, getAdminUserDetail, requireAdminViewer } from "@/lib/data/admin";

const LEDGER_LABELS: Record<string, string> = {
  glaze_added: "Glaze added",
  combination_shared: "Combination shared",
  firing_photo_uploaded: "Firing photo",
  comment_left: "Comment",
  tag_voted: "Tag vote",
  upvote_received: "Upvote received",
};

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdminViewer();
  const { userId } = await params;

  const [account, detail] = await Promise.all([
    getAdminUserAccount(userId),
    // Inventory and store clicks; unavailable in preview mode.
    getAdminUserDetail(userId).catch(() => null),
  ]);
  if (!account) notFound();

  const inventory = detail?.inventory;
  const buyClicks = detail?.activity.buyClicks ?? [];

  return (
    <div className="space-y-10">
      <header className="space-y-3 border-b border-border pb-6">
        <Link href="/admin/users" className={`text-xs text-muted ${linkClass}`}>
          ← All members
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="display-font text-4xl leading-none tracking-tight [overflow-wrap:anywhere]">
            {account.displayName}
          </h1>
          {account.isAdmin ? <StateBadge state="admin" /> : null}
          {account.contributionsDisabled ? <StateBadge state="rejected" label="Contributions off" /> : null}
        </div>
        <p className="text-sm text-muted">
          {[account.email || "No email", account.studioName, account.location].filter(Boolean).join(" · ")} · joined{" "}
          {format(new Date(account.createdAt), "d MMM yyyy")}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Points" value={account.points.toLocaleString()} />
        <StatTile label="Strikes" value={`${account.strikes} / 3`} accent={account.strikes > 0} />
        <StatTile label="Likes received" value={account.likesReceived.toLocaleString()} sublabel={`${account.likesGiven.toLocaleString()} given`} />
        <StatTile label="Comments" value={account.comments.length} />
        <StatTile label="Submissions" value={account.submissions.length} />
        <StatTile
          label="Inventory items"
          value={inventory ? inventory.owned.length + inventory.wishlist.length + inventory.archived.length : "—"}
          sublabel={inventory ? `${inventory.owned.length} owned · ${inventory.wishlist.length} wishlist` : undefined}
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>Access</SectionTitle>
        <div className="space-y-4 border border-border bg-panel-strong p-4">
          <p className="max-w-2xl text-sm leading-6 text-muted">
            {account.contributionsDisabled
              ? "This member cannot add glazes, combinations, photos or comments."
              : "This member can contribute. Three strikes turn contributions off automatically."}
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={adminSetContributionsDisabledAction}>
              <input type="hidden" name="userId" value={account.id} />
              <input type="hidden" name="disabled" value={account.contributionsDisabled ? "false" : "true"} />
              {account.contributionsDisabled ? (
                <button type="submit" className={actionClass("approve")}>
                  Turn contributions back on
                </button>
              ) : (
                <ConfirmButton
                  className={actionClass("danger")}
                  message={`Stop ${account.displayName} from contributing? You can turn it back on later.`}
                >
                  Turn off contributions
                </ConfirmButton>
              )}
            </form>
            {account.strikes > 0 ? (
              <form action={adminResetStrikesAction}>
                <input type="hidden" name="userId" value={account.id} />
                <button type="submit" className={actionClass()}>
                  Clear strikes
                </button>
              </form>
            ) : null}
            <Link href={`/profile?tab=chats&with=${account.id}`} className={actionClass()}>
              Send a message
            </Link>
          </div>
        </div>
      </section>

      <section id="portfolio" className="scroll-mt-6 space-y-3">
        <SectionTitle
          aside={
            <>
              {account.portfolio.length} published ·{" "}
              <Link href={`/potters/${account.id}`} className={linkClass}>
                View public portfolio
              </Link>
            </>
          }
        >
          Portfolio
        </SectionTitle>
        {account.portfolio.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {account.portfolio.map((piece) => (
              <li key={piece.id} className="border border-border bg-panel-strong">
                {piece.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={piece.imageUrl} alt="" loading="lazy" className="aspect-square w-full bg-background object-cover" />
                ) : (
                  <div className="aspect-square w-full bg-background" />
                )}
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-medium" title={piece.title}>
                    <Link href={`/combinations/examples/${piece.id}`} className={linkClass}>
                      {piece.title}
                    </Link>
                  </p>
                  <p className="text-xs text-muted">
                    {piece.likes} like{piece.likes === 1 ? "" : "s"} · {piece.comments} comment
                    {piece.comments === 1 ? "" : "s"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>No published combinations yet.</EmptyNote>
        )}
        <p className="text-xs text-muted">
          To take a piece down, reject it or set its visibility to hidden under Submissions below.
        </p>
      </section>

      <section className="space-y-3">
        <SectionTitle aside={`${account.submissions.length} most recent`}>Submissions</SectionTitle>
        {account.submissions.length ? (
          <div className="space-y-3">
            {account.submissions.map((item) => (
              <SubmissionCard key={`${item.kind}-${item.id}`} item={item} showKind />
            ))}
          </div>
        ) : (
          <EmptyNote>Nothing submitted yet.</EmptyNote>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Comments</SectionTitle>
        {account.comments.length ? (
          <div className="space-y-3">
            {account.comments.map((comment) => (
              <CommentRow key={`${comment.kind}-${comment.id}`} comment={comment} />
            ))}
          </div>
        ) : (
          <EmptyNote>No comments.</EmptyNote>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle>Points history</SectionTitle>
          {account.ledger.length ? (
            <ul className="divide-y divide-border border border-border text-sm">
              {account.ledger.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className={entry.voided ? "text-muted line-through" : undefined}>
                    {LEDGER_LABELS[entry.action] ?? entry.action.replace(/_/g, " ")}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {entry.voided ? "voided · " : ""}
                    <span className="tabular-nums text-foreground">+{entry.points}</span> ·{" "}
                    {format(new Date(entry.createdAt), "d MMM yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No points earned yet.</EmptyNote>
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle>Store clicks</SectionTitle>
          {buyClicks.length ? (
            <ul className="divide-y divide-border border border-border text-sm">
              {buyClicks.map((click, index) => (
                <li key={index} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate">
                    {[click.glazeBrand, click.glazeName].filter(Boolean).join(" ") || "A glaze"}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {click.storeName ?? "Unknown store"} · {format(new Date(click.createdAt), "d MMM yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No store clicks recorded.</EmptyNote>
          )}
        </section>
      </div>

      {inventory?.owned.length ? (
        <section className="space-y-3">
          <SectionTitle aside={`${inventory.owned.length} glazes`}>Owned glazes</SectionTitle>
          <details className="border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm">Show the shelf</summary>
            <ul className="grid gap-x-6 border-t border-border px-4 py-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              {inventory.owned.map((item) => (
                <li key={item.id} className="truncate py-1">
                  <Link href={`/glazes/${item.glazeId}`} className={linkClass}>
                    {[item.brand, item.code, item.name].filter(Boolean).join(" ")}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}
    </div>
  );
}
