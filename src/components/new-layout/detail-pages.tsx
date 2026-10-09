"use client";

import Link from "next/link";
import { useEffect } from "react";

import type { NLCombo, NLGlaze } from "@/lib/new-layout/types";
import { ComboDetail, GlazeDetail } from "./details";
import { usePanel } from "./panel";
import { useNL } from "./provider";

/** Full-page glaze view for /glazes/[id] (shared links and search engines). */
export function GlazePage({ glaze }: { glaze: NLGlaze }) {
  const { addGlazes } = useNL();
  const { openCombo } = usePanel();
  useEffect(() => { if (!glaze.cone6 || glaze.custom) addGlazes([glaze]); }, [addGlazes, glaze]);
  return (
    <div className="nl-detail-page">
      <Link className="nl-link" href="/glazes">← All Cone 6 glazes</Link>
      <GlazeDetail glaze={glaze} titleTag="h1" onOpenCombo={openCombo} />
    </div>
  );
}

/** Full-page combo view for /combinations/examples/[id]. */
export function ComboPage({ combo, glazes }: { combo: NLCombo; glazes: NLGlaze[] }) {
  const { addGlazes, catalog } = useNL();
  const { openGlaze } = usePanel();
  useEffect(() => addGlazes(glazes), [addGlazes, glazes]);
  return (
    <div className="nl-detail-page">
      <Link className="nl-link" href="/combinations">← All combinations</Link>
      {catalog ? <ComboDetail combo={combo} titleTag="h1" onOpenGlaze={openGlaze} /> : <h1>{combo.title}</h1>}
    </div>
  );
}
