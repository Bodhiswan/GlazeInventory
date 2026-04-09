"use client";

import { useRef, useState } from "react";
import { setStudioSharedItemsAction } from "@/app/actions/studios";
import { SubmitButton } from "@/components/submit-button";
import { formatGlazeLabel } from "@/lib/utils";
import type { Glaze } from "@/lib/types";

type Row = { inventoryId: string; glaze: Glaze; shared: boolean };

export function StudioShareList({ inventory }: { inventory: Row[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [allChecked, setAllChecked] = useState(
    inventory.length > 0 && inventory.every((r) => r.shared),
  );

  function toggleAll(next: boolean) {
    setAllChecked(next);
    const boxes = formRef.current?.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][name="shared"]',
    );
    boxes?.forEach((b) => {
      b.checked = next;
    });
  }

  return (
    <form ref={formRef} action={setStudioSharedItemsAction} className="space-y-3">
      <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => toggleAll(e.target.checked)}
          className="h-4 w-4 accent-[#2d1c16]"
        />
        Select all
      </label>
      <div className="max-h-[28rem] space-y-1 overflow-auto border border-border bg-panel p-3">
        {inventory.map((row) => (
          <label
            key={row.inventoryId}
            className="flex items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-foreground/5"
          >
            <input
              type="checkbox"
              name="shared"
              value={row.inventoryId}
              defaultChecked={row.shared}
              className="h-4 w-4 accent-[#2d1c16]"
            />
            <span className="flex-1">{formatGlazeLabel(row.glaze)}</span>
            {row.glaze.brand ? (
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                {row.glaze.brand}
              </span>
            ) : null}
          </label>
        ))}
      </div>
      <SubmitButton pendingText="Saving…">Save shared glazes</SubmitButton>
    </form>
  );
}
