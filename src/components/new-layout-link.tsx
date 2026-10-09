"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { LAYOUT_COOKIE } from "@/lib/layout-mode";

/** Footer link on classic pages for people who chose the classic site, to switch back. */
export function NewLayoutLink() {
  const pathname = usePathname();
  const classic = useSyncExternalStore(
    () => () => {},
    () => document.cookie.split("; ").some((part) => part === `${LAYOUT_COOKIE}=classic`),
    () => false,
  );
  if (!classic) return null;
  return (
    <footer className="border-t border-border py-4 text-sm text-muted">
      You&apos;re using the classic site.{" "}
      <a className="underline hover:text-foreground" href={`/layout-switch?to=new&next=${encodeURIComponent(pathname)}`}>
        Switch to the new Cone 6 layout
      </a>
    </footer>
  );
}
