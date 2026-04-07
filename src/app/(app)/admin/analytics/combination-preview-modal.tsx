"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

import { adminGetCombinationPreviewAction } from "@/app/actions/combinations";

type CombinationPreview = Awaited<ReturnType<typeof adminGetCombinationPreviewAction>>;

export function CombinationPreviewModal({
  comboId,
  children,
}: {
  comboId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CombinationPreview>(null);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    if (!data) {
      setLoading(true);
      const result = await adminGetCombinationPreviewAction(comboId);
      setData(result);
      setLoading(false);
    }
  }, [comboId, data]);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <div
        className="cursor-pointer"
        onClick={() => void handleOpen()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && void handleOpen()}
      >
        {children}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#2d1c16]/35 p-2 sm:items-center sm:p-4"
          onClick={handleClose}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden border border-border bg-background sm:mt-[4vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Member combination</p>
                <h3 className="truncate text-lg font-semibold leading-tight text-foreground">
                  {loading ? "Loading…" : (data?.title ?? "Combination")}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-white text-foreground transition hover:-translate-y-px"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
              {loading ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted">Loading…</div>
              ) : !data ? (
                <p className="text-sm text-muted">Could not load combination details.</p>
              ) : (
                <div className="space-y-4">
                  {/* Images */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.postFiringImageUrl ? (
                      <div className="space-y-1">
                        <div className="overflow-hidden border border-border bg-panel">
                          <Image
                            src={data.postFiringImageUrl}
                            alt={data.title}
                            width={400}
                            height={300}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Post-firing</p>
                      </div>
                    ) : null}
                    {data.preFiringImageUrl ? (
                      <div className="space-y-1">
                        <div className="overflow-hidden border border-border bg-panel">
                          <Image
                            src={data.preFiringImageUrl}
                            alt={`${data.title} (pre-firing)`}
                            width={400}
                            height={300}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Pre-firing</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                      {data.cone}
                    </span>
                    {data.atmosphere ? (
                      <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                        {data.atmosphere}
                      </span>
                    ) : null}
                    <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                      {data.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted">
                    <span className="font-semibold text-foreground">By:</span> {data.authorName}
                  </p>

                  {/* Layers */}
                  {data.layers.length ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                        Layers ({data.layers.length})
                      </p>
                      <div className="divide-y divide-border border border-border">
                        {data.layers.map((layer, i) => (
                          <div key={layer.id} className="flex items-center gap-3 px-3 py-2">
                            <span className="w-4 shrink-0 text-right text-[10px] tabular-nums text-muted">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">
                                {layer.glazeName ?? layer.glazeId}
                              </p>
                              {layer.glazeBrand ? (
                                <p className="text-[10px] text-muted">{layer.glazeBrand}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Notes */}
                  {data.notes ? (
                    <p className="text-sm leading-6 text-foreground/90">{data.notes}</p>
                  ) : null}
                  {data.glazingProcess ? (
                    <p className="text-sm leading-6 text-muted">
                      <span className="font-semibold text-foreground">Process:</span> {data.glazingProcess}
                    </p>
                  ) : null}
                  {data.kilnNotes ? (
                    <p className="text-sm leading-6 text-muted">
                      <span className="font-semibold text-foreground">Kiln:</span> {data.kilnNotes}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
