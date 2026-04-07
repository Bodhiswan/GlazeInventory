"use client";

import { ChevronDown, ExternalLink, ShoppingCart } from "lucide-react";

import { trackBuyClickAction } from "@/app/actions";
import { buildStoreSearchUrl, getStoresForGlaze } from "@/lib/stores";

export function BuyLinksDropdown({
  glaze,
}: {
  glaze: { id: string; code?: string | null; name: string; brand?: string | null };
}) {
  const stores = getStoresForGlaze(glaze);
  if (!stores.length) return null;

  return (
    <details className="group border border-border bg-panel">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white">
        <ShoppingCart className="h-3.5 w-3.5" />
        Buy this glaze
        <ChevronDown className="ml-auto h-4 w-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border">
        {stores.map((store) => {
          const storeUrl = buildStoreSearchUrl(store, glaze.code, glaze.name, glaze.brand);
          return (
            <form key={store.id} action={trackBuyClickAction}>
              <input type="hidden" name="glazeId" value={glaze.id} />
              <input type="hidden" name="storeId" value={store.id} />
              <input type="hidden" name="storeName" value={store.name} />
              <input type="hidden" name="url" value={storeUrl} />
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-white"
              >
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{store.region}</span>
                <span className="min-w-0 flex-1 text-left text-foreground">{store.name}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
              </button>
            </form>
          );
        })}
      </div>
    </details>
  );
}
