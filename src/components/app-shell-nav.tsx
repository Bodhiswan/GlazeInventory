"use client";

import Link from "next/link";
import { BarChart3, Layers3, LibraryBig, PenLine, SwatchBook } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const baseItems = [
  { href: "/inventory", label: "Inventory", icon: LibraryBig, alsoActive: [] as string[], badge: undefined as string | undefined },
  { href: "/glazes", label: "Library", icon: SwatchBook, alsoActive: [] as string[], badge: undefined as string | undefined },
  { href: "/combinations", label: "Combinations", icon: Layers3, alsoActive: [] as string[], badge: undefined as string | undefined },
  { href: "/contribute", label: "Contribute", icon: PenLine, alsoActive: ["/publish", "/glazes/new"], badge: "Beta" as string | undefined },
];

export function AppShellNav({ isAdmin }: Readonly<{ isAdmin: boolean }>) {
  const pathname = usePathname();
  const items = isAdmin
    ? [
        ...baseItems,
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3, alsoActive: [] as string[] },
      ]
    : baseItems;

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-1"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          item.alsoActive.some((p) => pathname === p || pathname.startsWith(`${p}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 border border-transparent px-2 py-2 text-[10px] uppercase tracking-[0.1em] transition-[background-color,color,border-color] duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/10 sm:px-3 sm:text-[11px] sm:tracking-[0.12em]",
              isActive
                ? "border-border bg-panel text-foreground"
                : "text-muted hover:bg-panel/50",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">{item.label}</span>
            {item.badge ? (
              <span className="hidden rounded-none border border-current px-1 py-0.5 text-[8px] uppercase tracking-[0.1em] opacity-60 md:inline">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
