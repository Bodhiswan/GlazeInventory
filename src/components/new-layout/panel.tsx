"use client";

import { useCallback, useEffect, useRef } from "react";

import { ComboDetail, GlazeDetail, type MemberContext } from "./details";
import { useNL } from "./provider";
import { Icon } from "./ui";
import { useUrlState } from "./use-url-state";

// True when the open panel was pushed onto history in this visit, so Back/close can pop it.
let openedByPush = false;

export function usePanel() {
  const { update } = useUrlState();
  const openGlaze = useCallback((id: string) => {
    openedByPush = true;
    update({ glaze: id, combo: null }, { push: true, keepPage: true });
  }, [update]);
  const openCombo = useCallback((id: string) => {
    openedByPush = true;
    update({ combo: id, glaze: null }, { push: true, keepPage: true });
  }, [update]);
  const close = useCallback(() => {
    if (openedByPush) {
      openedByPush = false;
      window.history.back();
      return;
    }
    update({ glaze: null, combo: null }, { keepPage: true });
  }, [update]);
  return { openGlaze, openCombo, close };
}

/** The slide-in detail panel. Its contents follow `?glaze=` / `?combo=` in the URL. */
export function PanelHost({ member }: { member?: MemberContext }) {
  const { get } = useUrlState();
  const { catalog, findCombo } = useNL();
  const { openGlaze, openCombo, close } = usePanel();
  const panelRef = useRef<HTMLElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const glazeId = get("glaze");
  const comboId = get("combo");
  const glaze = glazeId && catalog ? catalog.byId.get(glazeId) : undefined;
  const combo = comboId ? findCombo(comboId) : undefined;
  const open = Boolean(glaze || combo);
  const key = glaze?.id ?? combo?.id ?? "";

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      if (lastFocus.current instanceof HTMLElement && document.contains(lastFocus.current)) lastFocus.current.focus();
      lastFocus.current = null;
      return;
    }
    if (!lastFocus.current) lastFocus.current = document.activeElement;
    document.body.style.overflow = "hidden";
    const body = panelRef.current?.querySelector(".nl-panel-body");
    if (body) body.scrollTop = 0;
    (panelRef.current?.querySelector<HTMLElement>("#nl-panel-title"))?.focus({ preventScroll: true });
  }, [open, key]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea, [tabindex='-1']")]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;
  return (
    <>
      <div className="nl-scrim" onClick={close} />
      <aside ref={panelRef} className="nl-panel" role="dialog" aria-modal="true" aria-labelledby="nl-panel-title">
        <div className="nl-panel-top">
          <span className="nl-eyebrow">{glaze ? "Glaze" : combo?.potter ? "Potter's result" : "Combination"}</span>
          <button type="button" className="nl-btn quiet" onClick={close} aria-label="Close panel"><Icon name="close" />Close</button>
        </div>
        <div className="nl-panel-body">
          {glaze ? <GlazeDetail key={glaze.id} glaze={glaze} member={member} onOpenCombo={openCombo} />
            : combo ? <ComboDetail key={combo.id} combo={combo} member={member} onOpenGlaze={openGlaze} /> : null}
        </div>
      </aside>
    </>
  );
}
