"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Value = string | string[] | null | undefined;

/**
 * Filters, search and the open panel live in the URL so Back works and links can be shared.
 * Uses the native History API, which Next keeps in sync with useSearchParams.
 */
export function useUrlState() {
  const params = useSearchParams();
  const pathname = usePathname();

  const get = useCallback((key: string) => params.get(key) ?? "", [params]);
  const list = useCallback((key: string) => (params.get(key) ?? "").split(",").filter(Boolean), [params]);

  const update = useCallback((changes: Record<string, Value>, options: { push?: boolean; keepPage?: boolean } = {}) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      const flat = Array.isArray(value) ? value.join(",") : value;
      if (flat === null || flat === undefined || flat === "") next.delete(key);
      else next.set(key, flat);
    }
    // Changing filters starts the list from the top again.
    if (!options.keepPage && !("n" in changes)) next.delete("n");
    const query = next.toString();
    const url = `${pathname}${query ? `?${query}` : ""}`;
    if (options.push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }, [pathname]);

  return { params, get, list, update };
}
