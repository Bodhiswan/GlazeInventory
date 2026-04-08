"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CHANGELOG_KEY, CHANGES } from "@/lib/changelog";

export function ChangelogBanner({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const [open, setOpen] = useState(false);
  const [unreadChangelog, setUnreadChangelog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasUnread = unreadChangelog || unreadMessages > 0;

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHANGELOG_KEY)) {
        setUnreadChangelog(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    setOpen((value) => {
      const next = !value;
      if (next && unreadChangelog) {
        try {
          localStorage.setItem(CHANGELOG_KEY, "1");
        } catch {
          // ignore
        }
        setUnreadChangelog(false);
      }
      return next;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={hasUnread ? "Notifications (unread)" : "Notifications"}
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-panel/40 hover:bg-panel/60"
      >
        <Bell className={`h-4 w-4 ${hasUnread ? "text-red-500" : "text-foreground"}`} />
        {hasUnread ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500"
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[64px] z-40 w-auto border border-border bg-panel p-4 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px]"
        >
          {unreadMessages > 0 ? (
            <div className="mb-4 border-b border-border pb-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Messages
              </p>
              <Link
                href="/profile?tab=chats"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-between gap-3 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 hover:bg-red-100"
              >
                <span>
                  {unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em]">View →</span>
              </Link>
            </div>
          ) : null}

          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">What&apos;s new</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">Recent updates to Glaze Inventory</p>

          <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {CHANGES.map((section) => (
              <div key={section.category} className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  {section.category}
                </p>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-5 text-foreground/80">
                      <span
                        className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
