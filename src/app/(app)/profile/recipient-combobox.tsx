"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function RecipientCombobox({ names }: { names: string[] }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q
      ? names.filter((n) => n.toLowerCase().includes(q))
      : names;
    return list.slice(0, 20);
  }, [value, names]);

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(n: string) {
    setValue(n);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        name="recipientName"
        required
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            if (open && filtered[highlight]) {
              e.preventDefault();
              pick(filtered[highlight]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Start typing a display name…"
        className="w-full border border-border bg-background px-2 py-1"
      />
      {open && filtered.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border border-border bg-background shadow-md"
          role="listbox"
        >
          {filtered.map((n, i) => (
            <li
              key={n}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(n);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`cursor-pointer px-2 py-1 text-sm ${
                i === highlight ? "bg-panel text-foreground" : "text-foreground/80"
              }`}
            >
              {n}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
