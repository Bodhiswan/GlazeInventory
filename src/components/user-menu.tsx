"use client";

import Link from "next/link";
import { Loader2, LogOut, User } from "lucide-react";
import { useRef, useState, useEffect, useTransition } from "react";

import { signOutAction } from "@/app/actions";

export function UserMenu({
  displayName,
}: {
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex max-w-[11rem] items-center gap-1.5 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:bg-panel hover:text-foreground sm:max-w-[14rem] sm:text-[11px] sm:tracking-[0.16em]"
      >
        <span className="truncate">{displayName}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] border border-border bg-background shadow-sm">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors hover:bg-panel"
          >
            <User className="h-3.5 w-3.5" />
            Profile
          </Link>
          <div className="border-t border-border" />
          <button
            type="button"
            disabled={isPending}
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-panel hover:text-foreground"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            {isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
