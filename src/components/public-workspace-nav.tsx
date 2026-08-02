"use client";

import { BookOpenText, ChevronDown, Layers3, Menu, PenLine, SwatchBook, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/glazes", label: "Glazes", icon: SwatchBook },
  { href: "/combinations", label: "Combinations", icon: Layers3 },
  { href: "/guides/glazing-pottery", label: "Guides", icon: BookOpenText },
  { href: "/contribute", label: "Contribute", icon: PenLine },
];

export function PublicWorkspaceNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (!open) return;

    const frame = window.requestAnimationFrame(() => setOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeItem = items.find((item) => isActive(item.href));
  const ActiveIcon = activeItem?.icon ?? Menu;
  const activeLabel = activeItem?.label ?? "Menu";

  return (
    <nav aria-label="Public navigation">
      <div className="hidden items-center gap-3 lg:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "border border-transparent px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors",
              isActive(item.href)
                ? "border-border bg-panel text-foreground"
                : "text-muted hover:border-border hover:bg-panel/50 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/auth/sign-in"
          className="border border-foreground bg-foreground px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-foreground/85"
        >
          Sign in
        </Link>
      </div>

      <div className="relative lg:hidden">
        {open ? (
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={open ? "Close public navigation menu" : "Open public navigation menu"}
          className="relative z-50 inline-flex h-10 items-center gap-2 border border-border bg-panel/40 px-3 text-[11px] uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-panel/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/10"
        >
          {open ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{activeLabel}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-border bg-background shadow-md"
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 border-b border-border px-4 py-3 text-[11px] uppercase tracking-[0.12em] transition-colors last:border-b-0",
                    isActive(item.href)
                      ? "bg-panel text-foreground"
                      : "text-muted hover:bg-panel/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/auth/sign-in"
              role="menuitem"
              className="flex items-center border-t border-border bg-foreground px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white"
            >
              Sign in
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
