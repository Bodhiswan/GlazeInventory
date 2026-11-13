"use client";

import {
  BarChart3,
  Download,
  Inbox,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface AdminNavCounts {
  moderation: number;
  requests: number;
  imports: number;
}

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, count: null },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck, count: "moderation" },
  { href: "/admin/users", label: "Members", icon: Users, count: null },
  { href: "/admin/requests", label: "Requests", icon: Inbox, count: "requests" },
  { href: "/admin/studios", label: "Studios", icon: Store, count: null },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, count: null },
  { href: "/admin/intake", label: "Imports", icon: Download, count: "imports" },
] as const;

export function AdminNav({ counts }: Readonly<{ counts: AdminNavCounts }>) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const count = item.count ? counts[item.count] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 border px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors",
              active
                ? "border-border bg-panel text-foreground"
                : "border-transparent text-muted hover:bg-panel/60 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
            {count > 0 ? (
              <span
                className="ml-auto bg-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-normal text-background tabular-nums"
                aria-label={`${count} waiting`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
