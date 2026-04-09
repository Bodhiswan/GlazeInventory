"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";

import {
  submitGuideErrorReportAction,
  type GuideErrorReportState,
} from "@/app/actions/guides";
import { SubmitButton } from "@/components/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TocItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

const INITIAL_STATE: GuideErrorReportState = {
  status: "idle",
};

export function GuideErrorReport({
  guideSlug,
  guideTitle,
  toc,
}: Readonly<{
  guideSlug: string;
  guideTitle: string;
  toc: TocItem[];
}>) {
  const [open, setOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(toc[0]?.id ?? "");
  const [state, formAction] = useActionState(
    submitGuideErrorReportAction,
    INITIAL_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const selectedSection =
    toc.find((item) => item.id === selectedSectionId) ?? toc[0] ?? null;

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    setSelectedSectionId(toc[0]?.id ?? "");
  }, [state.status, toc]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Report an error
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[1px]"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-error-report-title"
            className="fixed inset-x-3 top-16 z-50 mx-auto max-w-xl border border-border bg-background p-5 shadow-lg sm:top-20"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  Guide feedback
                </p>
                <h2
                  id="guide-error-report-title"
                  className="mt-2 text-lg font-semibold text-foreground"
                >
                  Report an error in this guide
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Pick the section that looks wrong, then leave a short note for
                  the admin team.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Close report form"
                onClick={() => setOpen(false)}
                className="h-9 w-9 px-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form ref={formRef} action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="guideSlug" value={guideSlug} />
              <input type="hidden" name="guideTitle" value={guideTitle} />
              <input
                type="hidden"
                name="sectionId"
                value={selectedSection?.id ?? ""}
              />
              <input
                type="hidden"
                name="sectionLabel"
                value={selectedSection?.label ?? ""}
              />
              <input
                type="hidden"
                name="pagePath"
                value={`/guides/glazing-pottery/${guideSlug}`}
              />

              {state.status === "success" ? (
                <FormBanner variant="success">{state.message}</FormBanner>
              ) : null}

              {state.status === "error" ? (
                <FormBanner variant="error">{state.message}</FormBanner>
              ) : null}

              <label className="block space-y-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Section
                </span>
                <Select
                  value={selectedSectionId}
                  onChange={(event) => setSelectedSectionId(event.target.value)}
                >
                  {toc.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.level === 3 ? `↳ ${item.label}` : item.label}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Note
                </span>
                <Textarea
                  name="note"
                  required
                  minLength={8}
                  maxLength={1000}
                  placeholder="What looks wrong, unclear, or misleading here?"
                  className="min-h-28"
                />
              </label>

              <div className="flex items-start gap-2 border border-border bg-panel/40 px-3 py-3 text-xs leading-5 text-muted">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                <p>
                  This sends the section name and your note to the admin
                  analytics dashboard so the guide can be corrected.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <SubmitButton pendingText="Sending..." size="sm">
                  Send report
                </SubmitButton>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
