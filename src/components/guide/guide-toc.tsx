"use client";

import { useEffect, useState } from "react";

export type TocItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

export function GuideToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Table of contents"
      className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        On this page
      </p>
      <ul className="mt-3 flex flex-col gap-1.5 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block border-l-2 py-0.5 text-[13px] leading-5 transition-colors ${
                item.level === 3 ? "pl-6" : "pl-3"
              } ${
                activeId === item.id
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Mobile-friendly collapsible TOC */
export function GuideTocMobile({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border bg-panel p-4 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted"
      >
        <span>On this page</span>
        <span className="text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className={`block text-sm text-muted hover:text-foreground ${
                  item.level === 3 ? "pl-4" : ""
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
