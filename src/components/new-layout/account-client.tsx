"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { setStudioSharedItemsAction } from "@/app/actions/studios";

export function SubmitButton({ children, pendingText, className = "nl-btn" }: { children: React.ReactNode; pendingText: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="nl-linkrow">
      <input id="studio-url" readOnly value={url} aria-label="Studio link" onFocus={(event) => event.target.select()} />
      <button
        type="button"
        className="nl-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`https://${url}`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            const field = document.getElementById("studio-url") as HTMLInputElement | null;
            field?.focus();
            field?.select();
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Pick which owned glazes appear on the studio page. Saves all at once, like the classic list. */
export function SharedGlazes({ rows }: { rows: { inventoryId: string; name: string; label: string; shared: boolean }[] }) {
  const [checked, setChecked] = useState(() => new Set(rows.filter((row) => row.shared).map((row) => row.inventoryId)));
  const allOn = rows.length > 0 && checked.size === rows.length;
  return (
    <form action={setStudioSharedItemsAction} className="nl-field">
      <label className="nl-share-toggle">
        <input type="checkbox" checked={allOn} onChange={(event) => setChecked(event.target.checked ? new Set(rows.map((row) => row.inventoryId)) : new Set())} />
        Share everything on my shelf
      </label>
      <div className="nl-checklist" role="group" aria-label="Glazes to share">
        {rows.map((row) => (
          <label key={row.inventoryId}>
            <input
              type="checkbox"
              name="shared"
              value={row.inventoryId}
              checked={checked.has(row.inventoryId)}
              onChange={(event) => setChecked((current) => {
                const copy = new Set(current);
                if (event.target.checked) copy.add(row.inventoryId); else copy.delete(row.inventoryId);
                return copy;
              })}
            />
            <span className="nm">{row.name}</span><span className="cd">{row.label}</span>
          </label>
        ))}
      </div>
      <div className="nl-box-head">
        <span className="nl-note nl-num">{checked.size} of {rows.length} shared</span>
        <SubmitButton pendingText="Saving…" className="nl-btn primary">Save shared glazes</SubmitButton>
      </div>
    </form>
  );
}

export function ConfirmDelete({ action, studioName }: { action: () => Promise<void>; studioName: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <button type="button" className="nl-link danger" onClick={() => setConfirming(true)}>Delete studio page</button>;
  return (
    <form action={action} className="nl-field">
      <p style={{ margin: 0 }}><b>Delete the {studioName} studio page?</b> The link and printed QR codes stop working. Your shelf isn&apos;t affected.</p>
      <div className="nl-actions">
        <SubmitButton pendingText="Deleting…" className="nl-btn">Delete studio page</SubmitButton>
        <button type="button" className="nl-btn quiet" autoFocus onClick={() => setConfirming(false)}>Keep it</button>
      </div>
    </form>
  );
}
