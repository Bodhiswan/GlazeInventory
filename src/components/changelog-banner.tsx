"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const CHANGELOG_KEY = "glaze-library-changelog-v1";

const CHANGES = [
  {
    category: "New",
    items: [
      "Contribute section — publish combinations and add custom glazes from a single hub in the header.",
      "Custom glazes now appear in the Library and are searchable and filterable like catalog glazes.",
      "Color and finish tag pickers on the custom glaze form — tags feed directly into the Library filters.",
    ],
  },
  {
    category: "Fixed",
    items: [
      "Combinations can now be published with any catalog glaze, not just AMACO and Coyote.",
      "Custom glazes can be used as layers when publishing a combination.",
    ],
  },
];

export function ChangelogBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHANGELOG_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(CHANGELOG_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="border border-foreground/15 bg-panel px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">What&apos;s new</p>
          <p className="text-sm font-medium text-foreground">Recent updates to Glaze Inventory</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="mt-0.5 shrink-0 text-muted transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {CHANGES.map((section) => (
          <div key={section.category} className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {section.category}
            </p>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-5 text-foreground/80">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={dismiss}
          className="text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
        >
          Got it, dismiss
        </button>
      </div>
    </div>
  );
}
