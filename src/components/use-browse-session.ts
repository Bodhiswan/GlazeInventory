"use client";

import { useEffect, useRef } from "react";

/** Keep each browser tab's place without sharing personal selections between users. */
export function useBrowseSession<T>(key: string, state: T, restore: (state: T) => void) {
  const latest = useRef(state);
  const restoreCallback = useRef(restore);
  const restoring = useRef(false);
  useEffect(() => { latest.current = state; restoreCallback.current = restore; });
  useEffect(() => {
    const storageKey = `glaze-browse-v2:${key}:${window.location.pathname}${window.location.search}`;
    let ready = false;
    let scroll = window.scrollY;
    let frame = 0;
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      if (saved?.state) {
        restoring.current = true;
        restoreCallback.current(saved.state);
        scroll = Number.isFinite(saved.scroll) ? saved.scroll : 0;
      }
    } catch { /* Storage is optional; browsing must work when it is unavailable. */ }
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (restoring.current) window.scrollTo(0, scroll);
        restoring.current = false;
        ready = true;
      });
    });
    const rememberScroll = () => { if (ready) scroll = window.scrollY; };
    const save = () => {
      if (!ready) return;
      try { sessionStorage.setItem(storageKey, JSON.stringify({ state: latest.current, scroll })); } catch {}
    };
    window.addEventListener("scroll", rememberScroll, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      save();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", rememberScroll);
      window.removeEventListener("pagehide", save);
    };
  }, [key]);
  return restoring;
}
