import { format } from "date-fns";
import Link from "next/link";

import { sendDirectMessageAction } from "@/app/actions/community";
import { Panel } from "@/components/ui/panel";
import {
  getDirectMessageConversations,
  getDirectMessagesWithUser,
} from "@/lib/data/community";
import { getAdminUsers } from "@/lib/data/users";
import { AutoMarkRead } from "./auto-mark-read";
import { RecipientCombobox } from "./recipient-combobox";

function subjectFrom(body: string): string {
  const firstLine = body.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.length > 80 ? firstLine.slice(0, 80) + "…" : firstLine;
}

export async function ChatsTab({
  viewerUserId,
  activeOtherId,
  viewerIsAdmin,
}: {
  viewerUserId: string;
  activeOtherId?: string;
  viewerIsAdmin: boolean;
}) {
  const admins = viewerIsAdmin
    ? []
    : (await getAdminUsers()).filter((a) => a.id !== viewerUserId);
  const allDisplayNames = viewerIsAdmin ? await getAllDisplayNames() : [];
  const conversations = await getDirectMessageConversations(viewerUserId);
  const messages = activeOtherId
    ? await getDirectMessagesWithUser(viewerUserId, activeOtherId)
    : [];

  return (
    <div className="space-y-4">
      <Panel className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Inbox
          </h2>
          {viewerIsAdmin ? (
            <Link
              href="/profile?tab=chats&compose=1"
              className="border border-border bg-panel px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted hover:text-foreground"
            >
              New message
            </Link>
          ) : null}
        </div>

        {conversations.length === 0 ? (
          <p className="text-xs text-muted">No conversations yet.</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {conversations.map((c) => {
              const isActive = c.otherUserId === activeOtherId;
              const isUnread = c.unreadCount > 0;
              return (
                <li key={c.otherUserId} className="bg-background">
                  {/* Compact row header */}
                  <Link
                    href={
                      isActive
                        ? "/profile?tab=chats"
                        : `/profile?tab=chats&with=${c.otherUserId}`
                    }
                    className={`grid grid-cols-[auto_10rem_1fr_auto] items-center gap-3 px-3 py-2 text-sm hover:bg-panel ${
                      isUnread ? "font-semibold" : ""
                    } ${isActive ? "bg-panel" : ""}`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isUnread ? "bg-red-500" : "bg-transparent"
                      }`}
                      aria-hidden
                    />
                    <span className="truncate text-foreground">
                      {c.otherDisplayName}
                    </span>
                    <span className="truncate text-muted">
                      {subjectFrom(c.lastBody)}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-muted">
                      {format(new Date(c.lastCreatedAt), "yyyy-MM-dd HH:mm")}
                    </span>
                  </Link>

                  {/* Expanded thread */}
                  {isActive ? (
                    <div className="border-t border-border bg-panel/40 p-3">
                      {isUnread ? <AutoMarkRead fromUserId={c.otherUserId} /> : null}
                      <div className="max-h-[420px] space-y-2 overflow-y-auto">
                        {messages.length === 0 ? (
                          <p className="text-xs text-muted">No messages yet.</p>
                        ) : (
                          messages.map((m) => {
                            const mine = m.senderUserId === viewerUserId;
                            return (
                              <div
                                key={m.id}
                                className={`flex flex-col gap-1 ${
                                  mine ? "items-end" : "items-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] whitespace-pre-wrap break-words border px-3 py-2 text-sm ${
                                    mine
                                      ? "border-border bg-background text-foreground"
                                      : "border-border bg-background text-foreground"
                                  }`}
                                >
                                  {m.body}
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                                  {format(new Date(m.createdAt), "yyyy-MM-dd HH:mm")}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Reply form */}
                      <form action={sendDirectMessageAction} className="mt-3 grid gap-2">
                        <input type="hidden" name="recipientUserId" value={c.otherUserId} />
                        <textarea
                          name="body"
                          required
                          rows={3}
                          maxLength={4000}
                          placeholder="Reply…"
                          className="border border-border bg-background px-2 py-1 text-sm"
                        />
                        <button
                          type="submit"
                          className="justify-self-start border border-border bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
                        >
                          Send reply
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* ── New message composer (admins have free-form; non-admins see admin selector) ── */}
      {!activeOtherId ? (
        <Panel className="min-w-0 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            New message
          </h2>
          <form action={sendDirectMessageAction} className="grid gap-2">
            {viewerIsAdmin ? (
              <label className="grid gap-1 text-sm">
                Send to (display name)
                <RecipientCombobox names={allDisplayNames} />
              </label>
            ) : admins.length > 0 ? (
              <label className="grid gap-1 text-sm">
                Send to admin
                <select
                  name="recipientUserId"
                  required
                  defaultValue=""
                  className="border border-border bg-background px-2 py-1"
                >
                  <option value="" disabled>
                    Select an admin…
                  </option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted">
                  You can only message admins.
                </span>
              </label>
            ) : (
              <p className="text-xs text-muted">No admins available to contact.</p>
            )}
            <label className="grid gap-1 text-sm">
              Message
              <textarea
                name="body"
                required
                rows={3}
                maxLength={4000}
                placeholder="Type your message…"
                className="border border-border bg-background px-2 py-1"
              />
            </label>
            <button
              type="submit"
              className="justify-self-start border border-border bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
            >
              Send
            </button>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
