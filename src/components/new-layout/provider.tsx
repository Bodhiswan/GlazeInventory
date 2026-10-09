"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { toggleFavouriteInlineAction } from "@/app/actions/glazes";
import {
  setGlazeInventoryStateAction,
  updateGlazeInventoryAmountAction,
  updateInventoryItemFoldersAction,
  updateInventoryItemNotesAction,
} from "@/app/actions/inventory";
import { compareFlow, flowPosition, type FlowPosition } from "@/lib/new-layout/colour";
import type { NLCatalog, NLCombo, NLFillLevel, NLGlaze, NLShelfItem } from "@/lib/new-layout/types";
import type { NLViewerState } from "@/lib/new-layout/viewer-state";

type ShelfEntry = NLShelfItem & { inventoryId: string | null };
type Status = "owned" | "wishlist" | null;

export interface NLCatalogIndex {
  glazes: NLGlaze[];
  combos: NLCombo[];
  byId: Map<string, NLGlaze>;
  combosByGlaze: Map<string, NLCombo[]>;
  comboCount: Map<string, number>;
  flow: Map<string, FlowPosition>;
  /** Glaze IDs in default colour-wheel order. */
  flowOrder: string[];
}

interface Toast { id: number; message: string; undo?: () => void }

interface NLContextValue {
  state: NLViewerState;
  catalog: NLCatalogIndex | null;
  catalogError: boolean;
  shelf: Record<string, ShelfEntry>;
  status: (glazeId: string) => Status;
  owned: Set<string>;
  missing: (combo: NLCombo) => NLCombo["layers"];
  setStatus: (glazeId: string, status: Status, options?: { quiet?: boolean }) => Promise<void>;
  setFill: (glazeId: string, fill: NLFillLevel) => Promise<void>;
  setNote: (glazeId: string, note: string) => Promise<boolean>;
  setFolders: (glazeId: string, folderIds: string[]) => Promise<void>;
  savedGlazes: Set<string>;
  savedCombos: Set<string>;
  toggleSaved: (type: "glaze" | "combination", id: string) => Promise<void>;
  potterCombos: NLCombo[];
  addPotterCombos: (combos: NLCombo[]) => void;
  /** Glazes outside the Cone 6 catalogue that a page needs to show (e.g. layers of a Cone 10 result). */
  addGlazes: (glazes: NLGlaze[]) => void;
  findCombo: (id: string) => NLCombo | undefined;
  toast: (message: string, undo?: () => void) => void;
  /** Returns false (and sends the person to sign in) when there's no account to save to. */
  requireAccount: () => boolean;
}

const NLContext = createContext<NLContextValue | null>(null);

export function useNL() {
  const value = useContext(NLContext);
  if (!value) throw new Error("useNL must be used inside <NLProvider>");
  return value;
}

let catalogPromise: Promise<NLCatalog> | null = null;
function loadCatalog() {
  catalogPromise ??= fetch("/api/catalog/cone6").then((response) => {
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    return response.json() as Promise<NLCatalog>;
  });
  catalogPromise.catch(() => { catalogPromise = null; });
  return catalogPromise;
}

function indexCatalog(catalog: NLCatalog, extraGlazes: NLGlaze[]): NLCatalogIndex {
  const byId = new Map<string, NLGlaze>();
  for (const glaze of catalog.glazes) byId.set(glaze.id, glaze);
  for (const glaze of extraGlazes) if (!byId.has(glaze.id)) byId.set(glaze.id, glaze);
  const combosByGlaze = new Map<string, NLCombo[]>();
  const comboCount = new Map<string, number>();
  for (const combo of catalog.combos) {
    for (const layer of combo.layers) {
      const list = combosByGlaze.get(layer.g) ?? [];
      list.push(combo);
      combosByGlaze.set(layer.g, list);
      comboCount.set(layer.g, (comboCount.get(layer.g) ?? 0) + 1);
    }
  }
  const flow = new Map(catalog.glazes.map((glaze) => [glaze.id, flowPosition(glaze)]));
  const flowOrder = catalog.glazes
    .map((glaze) => glaze.id)
    .sort((a, b) => compareFlow(flow.get(a)!, flow.get(b)!) || a.localeCompare(b));
  return { glazes: catalog.glazes, combos: catalog.combos, byId, combosByGlaze, comboCount, flow, flowOrder };
}

export function NLProvider({ initial, children }: { initial: NLViewerState; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState(initial);
  const [shelf, setShelf] = useState<Record<string, ShelfEntry>>(initial.shelf);
  const [savedGlazes, setSavedGlazes] = useState(() => new Set(initial.savedGlazes));
  const [savedCombos, setSavedCombos] = useState(() => new Set(initial.savedCombos));
  const [rawCatalog, setRawCatalog] = useState<NLCatalog | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [potterCombos, setPotterCombos] = useState<NLCombo[]>([]);
  const [pageGlazes, setPageGlazes] = useState<NLGlaze[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Server re-renders (after an action revalidates) bring fresh data; adopt it.
  const [seenInitial, setSeenInitial] = useState(initial);
  if (initial !== seenInitial) {
    setSeenInitial(initial);
    setState(initial);
    setShelf(initial.shelf);
    setSavedGlazes(new Set(initial.savedGlazes));
    setSavedCombos(new Set(initial.savedCombos));
  }

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((catalog) => { if (!cancelled) setRawCatalog(catalog); })
      .catch(() => { if (!cancelled) setCatalogError(true); });
    return () => { cancelled = true; };
  }, []);

  const catalog = useMemo(
    () => (rawCatalog ? indexCatalog(rawCatalog, [...state.extraGlazes, ...pageGlazes]) : null),
    [pageGlazes, rawCatalog, state.extraGlazes],
  );

  const toast = useCallback((message: string, undo?: () => void) => {
    const id = ++toastId.current;
    setToasts([{ id, message, undo }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), undo ? 6000 : 3500);
  }, []);

  const requireAccount = useCallback(() => {
    if (state.viewer && !state.viewer.readOnly) return true;
    if (state.viewer?.readOnly) {
      toast("This is a preview without accounts, so changes can't be saved.");
      return false;
    }
    router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(pathname + window.location.search)}`);
    return false;
  }, [pathname, router, state.viewer, toast]);

  const status = useCallback((glazeId: string): Status => shelf[glazeId]?.status ?? null, [shelf]);
  const owned = useMemo(() => new Set(Object.entries(shelf).filter(([, item]) => item.status === "owned").map(([id]) => id)), [shelf]);
  const missing = useCallback((combo: NLCombo) => combo.layers.filter((layer) => !owned.has(layer.g)), [owned]);

  // Undo needs the newest setStatus, which isn't declared yet inside its own callback.
  const setStatusRef = useRef<NLContextValue["setStatus"] | null>(null);
  const setStatus = useCallback(async (glazeId: string, next: Status, options: { quiet?: boolean } = {}) => {
    if (!requireAccount()) return;
    const previous = shelf[glazeId] ?? null;
    if ((previous?.status ?? null) === next) return;
    const name = catalog?.byId.get(glazeId)?.name ?? "This glaze";
    setShelf((current) => {
      const copy = { ...current };
      if (next) copy[glazeId] = { ...(previous ?? { inventoryId: null, fill: "full", quantity: 1, note: "", sharedWithStudio: false, folderIds: [] }), status: next };
      else delete copy[glazeId];
      return copy;
    });
    const result = await setGlazeInventoryStateAction({ glazeId, status: next ?? "none" });
    if (!result.success) {
      setShelf((current) => {
        const copy = { ...current };
        if (previous) copy[glazeId] = previous; else delete copy[glazeId];
        return copy;
      });
      toast(result.message);
      return;
    }
    setShelf((current) => (current[glazeId] ? { ...current, [glazeId]: { ...current[glazeId], inventoryId: result.inventoryId } } : current));
    if (options.quiet) return;
    const message = next === "owned" ? `${name} is on your shelf.` : next === "wishlist" ? `${name} added to your wishlist.` : `Removed ${name}.`;
    toast(message, () => { void setStatusRef.current?.(glazeId, previous?.status ?? null, { quiet: true }); });
  }, [catalog, requireAccount, shelf, toast]);
  useEffect(() => { setStatusRef.current = setStatus; }, [setStatus]);

  const setFill = useCallback(async (glazeId: string, fill: NLFillLevel) => {
    if (!requireAccount()) return;
    const previous = shelf[glazeId];
    if (!previous) return;
    setShelf((current) => ({ ...current, [glazeId]: { ...previous, fill } }));
    const result = await updateGlazeInventoryAmountAction({ glazeId, fillLevel: fill, quantity: previous.quantity });
    if (!result.success) {
      setShelf((current) => ({ ...current, [glazeId]: previous }));
      toast(result.message);
    }
  }, [requireAccount, shelf, toast]);

  const setNote = useCallback(async (glazeId: string, note: string) => {
    const entry = shelf[glazeId];
    if (!entry?.inventoryId || !requireAccount()) return false;
    const result = await updateInventoryItemNotesAction({ inventoryId: entry.inventoryId, personalNote: note });
    if (!result.success) { toast(result.message); return false; }
    setShelf((current) => (current[glazeId] ? { ...current, [glazeId]: { ...current[glazeId], note } } : current));
    return true;
  }, [requireAccount, shelf, toast]);

  const setFolders = useCallback(async (glazeId: string, folderIds: string[]) => {
    const entry = shelf[glazeId];
    if (!entry?.inventoryId || !requireAccount()) return;
    const previous = entry.folderIds;
    setShelf((current) => ({ ...current, [glazeId]: { ...entry, folderIds } }));
    const result = await updateInventoryItemFoldersAction({ inventoryId: entry.inventoryId, folderIds });
    if (!result.success) {
      setShelf((current) => ({ ...current, [glazeId]: { ...entry, folderIds: previous } }));
      toast(result.message);
    }
  }, [requireAccount, shelf, toast]);

  const toggleSaved = useCallback(async (type: "glaze" | "combination", id: string) => {
    if (!requireAccount()) return;
    const setter = type === "glaze" ? setSavedGlazes : setSavedCombos;
    const flip = (on: boolean) => setter((current) => { const copy = new Set(current); if (on) copy.add(id); else copy.delete(id); return copy; });
    const wasSaved = (type === "glaze" ? savedGlazes : savedCombos).has(id);
    flip(!wasSaved);
    const result = await toggleFavouriteInlineAction(type, id);
    if (result.error) { flip(wasSaved); toast("Couldn't save that. Try again."); return; }
    flip(result.favourited);
    toast(result.favourited ? "Saved." : "Removed from saved.");
  }, [requireAccount, savedCombos, savedGlazes, toast]);

  const addPotterCombos = useCallback((combos: NLCombo[]) => {
    setPotterCombos((current) => {
      const known = new Set(current.map((combo) => combo.id));
      const fresh = combos.filter((combo) => !known.has(combo.id));
      return fresh.length ? [...current, ...fresh] : current;
    });
  }, []);

  const addGlazes = useCallback((glazes: NLGlaze[]) => {
    if (!glazes.length) return;
    setPageGlazes((current) => {
      const known = new Set(current.map((glaze) => glaze.id));
      const fresh = glazes.filter((glaze) => !known.has(glaze.id));
      return fresh.length ? [...current, ...fresh] : current;
    });
  }, []);

  const findCombo = useCallback((id: string) => potterCombos.find((combo) => combo.id === id) ?? catalog?.combos.find((combo) => combo.id === id), [catalog, potterCombos]);

  const value: NLContextValue = {
    state, catalog, catalogError, shelf, status, owned, missing, setStatus, setFill, setNote, setFolders,
    savedGlazes, savedCombos, toggleSaved, potterCombos, addPotterCombos, addGlazes, findCombo, toast, requireAccount,
  };

  return (
    <NLContext.Provider value={value}>
      {children}
      {toasts.map((item) => (
        <div key={item.id} className="nl-toast" role="status" aria-live="polite">
          <span>{item.message}</span>
          {item.undo ? (
            <button type="button" onClick={() => { item.undo?.(); setToasts([]); }}>Undo</button>
          ) : null}
        </div>
      ))}
    </NLContext.Provider>
  );
}
