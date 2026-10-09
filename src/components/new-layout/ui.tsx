"use client";
/* eslint-disable @next/next/no-img-element -- vendor photos come from many CDNs; a swatch shows if one fails */

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { comboSwatch, swatch } from "@/lib/new-layout/colour";
import type { NLCombo, NLGlaze } from "@/lib/new-layout/types";
import { storeLinksById } from "@/lib/store-links";
import { useNL } from "./provider";

export const glazeLabel = (glaze: NLGlaze) => `${glaze.brand} ${glaze.code}`.trim();
export const glazePhoto = (glaze: NLGlaze) => glaze.photos[0]?.[0] ?? null;
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en")} ${n === 1 ? one : many}`;

export function comboName(combo: NLCombo, byId: Map<string, NLGlaze>) {
  const names = combo.layers.map((layer) => byId.get(layer.g)).filter((glaze): glaze is NLGlaze => Boolean(glaze))
    .map((glaze) => `${glaze.code} ${glaze.name}`.trim());
  return names.length ? names.join(" over ") : combo.title;
}

/** A photo with the glaze swatch behind it; if the photo fails, the swatch stays. */
export function Photo({ src, alt = "" }: { src: string | null; alt?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return null;
  return <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedSrc(src)} />;
}

export function Icon({ name }: { name: "glaze" | "combos" | "shelf" | "plus" | "close" | "search" | "up" | "down" | "user" }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;
  switch (name) {
    case "glaze": return <svg {...common}><path d="M8 3h8M9 3v4.5c0 .8-.4 1.5-1 2A6.5 6.5 0 0 0 5.5 15c0 3.6 2.9 6 6.5 6s6.5-2.4 6.5-6A6.5 6.5 0 0 0 16 9.5c-.6-.5-1-1.2-1-2V3" /><path d="M6 14.5c2.2-1 4-1 6 0s3.8 1 6 0" /></svg>;
    case "combos": return <svg {...common}><path d="M3 9.5 12 5l9 4.5-9 4.5z" /><path d="m3 14.5 9 4.5 9-4.5" /></svg>;
    case "shelf": return <svg {...common}><path d="M3 20h18M3 12h18M5 12V5h4v7M10 12V7h4v5M16 12V4h3v8M6 20v-5h3v5M12 20v-6h4v6" /></svg>;
    case "plus": return <svg {...common} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>;
    case "close": return <svg {...common} strokeWidth={2}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case "search": return <svg {...common} strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "up": return <svg {...common} strokeWidth={2}><path d="m6 15 6-6 6 6" /></svg>;
    case "down": return <svg {...common} strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>;
    case "user": return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>;
  }
}

/** One search box per screen. Typing updates the URL after a short pause. */
export function SearchBox({ id, label, placeholder, value, onChange }: {
  id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  // Follow outside changes (Back, "Clear all") unless the person is typing.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (!focused) setText(value);
  }
  const timer = useRef<number | undefined>(undefined);
  const push = (next: string) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => onChange(next.trim()), 160); };
  return (
    <div className="nl-search" role="search">
      <Icon name="search" />
      <label className="nl-sr" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => { setText(event.target.value); push(event.target.value); }}
        onKeyDown={(event) => { if (event.key === "Escape" && text) { setText(""); onChange(""); } }}
      />
      {text ? (
        <button type="button" className="nl-clear-q" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { setText(""); onChange(""); document.getElementById(id)?.focus(); }}>✕</button>
      ) : null}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="nl-empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function GlazeCard({ glaze, onOpen, hideStatus }: { glaze: NLGlaze; onOpen: () => void; hideStatus?: boolean }) {
  const { status } = useNL();
  const state = hideStatus ? null : status(glaze.id);
  return (
    <article className="nl-card">
      <button type="button" className="nl-card-main" onClick={onOpen}>
        <div className="nl-thumb" style={{ "--sw": swatch(glaze) } as React.CSSProperties}>
          <Photo src={glazePhoto(glaze)} />
          {state ? <span className={`nl-badge ${state}`}>{state === "owned" ? "✓ On shelf" : "Wishlist"}</span> : null}
        </div>
        <div className="nl-card-text">
          <span className="meta">{glazeLabel(glaze)}</span>
          <span className="name">{glaze.name}</span>
          {glaze.ft.length ? <span className="meta">{glaze.ft.slice(0, 3).join(" · ")}</span> : null}
        </div>
      </button>
    </article>
  );
}

export function LayerRows({ combo, showState }: { combo: NLCombo; showState: boolean }) {
  const { catalog, status } = useNL();
  if (!catalog) return null;
  return (
    <div className="nl-layers">
      {combo.layers.map((layer, i) => {
        const glaze = catalog.byId.get(layer.g);
        if (!glaze) return null;
        const state = status(glaze.id);
        return (
          <div key={`${layer.g}-${i}`}>
            <div className="nl-lrow">
              <span className="nl-dot" style={{ background: swatch(glaze) }} />
              <span className="ln"><b>{glaze.code}</b> {glaze.name}</span>
              {showState ? <span className={`nl-state ${state ?? "miss"}`}>{state === "owned" ? "Have" : state === "wishlist" ? "Want" : "Need"}</span> : null}
            </div>
            {i < combo.layers.length - 1 ? <div className="nl-lrow"><span className="over">{(layer.to ?? "over").toLowerCase()}</span></div> : null}
          </div>
        );
      })}
    </div>
  );
}

export function ComboCard({ combo, onOpen, member }: { combo: NLCombo; onOpen: () => void; member?: boolean }) {
  const { catalog, savedCombos } = useNL();
  if (!catalog) return null;
  const badge = member ? null : combo.potter?.mine ? "Your result" : combo.potter ? "Potter's result" : savedCombos.has(combo.id) ? "Saved" : null;
  return (
    <button type="button" className="nl-ccard" onClick={onOpen} aria-label={comboName(combo, catalog.byId)}>
      <div className="nl-thumb" style={{ "--sw": comboSwatch(combo, catalog.byId) } as React.CSSProperties}>
        <Photo src={combo.image} />
        {badge ? <span className="nl-badge">{badge}</span> : null}
      </div>
      <div className="nl-ccard-body">
        <LayerRows combo={combo} showState={!member} />
        <span className="nl-src">
          {combo.potter ? `${combo.potter.mine ? "You" : combo.potter.name} · ${combo.potter.date}` : `${combo.vendor} test tile${combo.clay ? ` · ${combo.clay}` : ""}`}
        </span>
      </div>
    </button>
  );
}

// ---------- Buy this glaze ----------

const REGION_NAMES: Record<string, string> = { AUS: "Australia", USA: "United States", UK: "United Kingdom" };

function viewerRegion() {
  if (typeof navigator === "undefined") return null;
  const match = (navigator.language || "").match(/-(AU|NZ|GB|UK|US|CA)$/i);
  if (!match) return null;
  const code = match[1].toUpperCase();
  return code === "AU" || code === "NZ" ? "AUS" : code === "GB" || code === "UK" ? "UK" : "USA";
}

const noSubscribe = () => () => {};

export function BuyList({ glaze }: { glaze: NLGlaze }) {
  const region = useSyncExternalStore(noSubscribe, viewerRegion, () => null);
  const stores = glaze.buy
    .map((id) => storeLinksById.get(id))
    .filter((store): store is NonNullable<typeof store> => Boolean(store))
    .sort((a, b) => Number(b.region === region) - Number(a.region === region));
  if (!stores.length) return null;
  const query = { code: glaze.code || null, name: glaze.name, brand: glaze.brand || null };
  const track = (storeId: string, storeName: string, url: string) => {
    // Fire-and-forget, like the classic dropdown; never block the link.
    void fetch("/api/track-buy-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ glazeId: glaze.id, storeId, storeName, url }),
      keepalive: true,
    }).catch(() => undefined);
  };
  return (
    <section className="nl-box" aria-labelledby={`buy-${glaze.id}`}>
      <div className="nl-box-head"><h3 id={`buy-${glaze.id}`}>Buy this glaze</h3><span className="nl-note">{plural(stores.length, "store")}</span></div>
      <div className="nl-stores">
        {stores.map((store) => {
          const url = store.buildUrl(query);
          return (
            <a key={store.id} className="nl-store" href={url} target="_blank" rel="noopener noreferrer" onClick={() => track(store.id, store.name, url)}>
              <span className="rg" title={REGION_NAMES[store.region]}>{store.region}</span>
              <span className="sn">{store.name}{store.region === region ? <span className="nl-near">Near you</span> : null}</span>
              <span aria-hidden="true">↗</span>
            </a>
          );
        })}
      </div>
      <p className="nl-note">Opens the store&apos;s search for {glaze.code || glaze.name}. Stock and prices are on their site.</p>
    </section>
  );
}
