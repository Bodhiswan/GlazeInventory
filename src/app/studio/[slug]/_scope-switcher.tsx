"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setStudioScopeAction } from "@/app/actions/studios";

export function StudioScopeSwitcher({
  slug,
  current,
}: {
  slug: string;
  current: "lowfire" | "midfire";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [warning, setWarning] = useState<null | "lowfire" | "midfire">(null);

  function handleChange(next: string) {
    if (next !== "lowfire" && next !== "midfire") return;
    if (next === current) return;
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("scope", next);
    startTransition(async () => {
      await setStudioScopeAction(fd);
      setWarning(next);
      router.refresh();
    });
  }

  return (
    <>
      <label className="flex items-center gap-2 border border-border bg-panel px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
        <span>Firing</span>
        <select
          value={current}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value)}
          className="bg-transparent text-[11px] uppercase tracking-[0.14em] text-foreground focus:outline-none"
        >
          <option value="lowfire">Earthenware (06)</option>
          <option value="midfire">Midfire (6)</option>
        </select>
      </label>

      {warning ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <div className="max-w-md border border-border bg-panel-strong p-5 shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              You switched to {warning === "lowfire" ? "earthenware (cone 06)" : "midfire (cone 6)"}
            </p>
            <h2 className="display-font mt-2 text-2xl tracking-tight">
              Use the right glazes for your clay.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Mixing low-fire and mid-fire glazes can ruin a piece — earthenware
              glazes will burn off or run at cone 6, and mid-fire glazes won&apos;t
              mature at cone 06. Always check the cone on the bucket and the
              cone of the clay you&apos;re painting before you start.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              When in doubt, ask a studio tech.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setWarning(null)}
                className="border border-border bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white hover:bg-foreground/85"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
