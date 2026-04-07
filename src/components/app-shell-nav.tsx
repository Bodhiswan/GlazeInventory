"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronDown,
  Layers3,
  LibraryBig,
  PenLine,
  SwatchBook,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const baseItems = [
  { href: "/inventory", label: "Inventory", icon: LibraryBig, alsoActive: [] as string[], badge: undefined as string | undefined },
  { href: "/glazes", label: "Library", icon: SwatchBook, alsoActive: [] as string[], badge: undefined as string | undefined },
  { href: "/combinations", label: "Combinations", icon: Layers3, alsoActive: [] as string[], badge: undefined as string | undefined },
  { href: "/contribute", label: "Contribute", icon: PenLine, alsoActive: ["/publish", "/glazes/new"], badge: "Beta" as string | undefined },
];

const adminItems = [
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, alsoActive: [] as string[], badge: undefined as string | undefined },
  { href: "/admin/users", label: "Users", icon: Users, alsoActive: [] as string[], badge: undefined as string | undefined },
];

export function AppShellNav({ isAdmin }: Readonly<{ isAdmin: boolean }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  // Close menu whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isItemActive = (item: (typeof items)[number]) =>
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`) ||
    item.alsoActive.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const activeItem = items.find(isItemActive);
  const ActiveIcon = activeItem?.icon ?? LibraryBig;
  const activeLabel = activeItem?.label ?? "Menu";

  return (
    <div className="relative">
      {open && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className={cn(
          "relative z-50 flex items-center gap-2 border px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition-[background-color,color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/10",
          open
            ? "border-border bg-panel text-foreground"
            : "border-border bg-panel/40 text-foreground hover:bg-panel/60",
        )}
      >
        <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{activeLabel}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-1 min-w-[220px] -translate-x-1/2 border border-border bg-background shadow-md">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 border-b border-border px-4 py-3 text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 last:border-b-0",
                  isActive
                    ? "bg-panel text-foreground"
                    : "text-muted hover:bg-panel/50 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-none border border-current px-1 py-0.5 text-[8px] uppercase tracking-[0.1em] opacity-60">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
