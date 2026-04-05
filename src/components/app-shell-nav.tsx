"use client";

import Link from "next/link";
import { BarChart3, Layers3, LibraryBig, SwatchBook } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const baseItems = [
  { href: "/inventory", label: "Inventory", icon: LibraryBig },
  { href: "/glazes", label: "Library", icon: SwatchBook },
  { href: "/combinations", label: "Combinations", icon: Layers3 },
];

export function AppShellNav({ isAdmin }: Readonly<{ isAdmin: boolean }>) {
  const pathname = usePathname();
  const items = isAdmin
    ? [
        ...baseItems,
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      ]
    : baseItems;

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-1"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border border-transparent px-3 py-2 text-[10px] uppercase tracking-[0.1em] transition-[background-color,color,border-color] duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/10 sm:text-[11px] sm:tracking-[0.12em]",
              isActive
                ? "border-border bg-panel text-foreground"
                : "text-muted hover:bg-panel/50",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
