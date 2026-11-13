"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { NLCombo, NLGlaze } from "@/lib/new-layout/types";
import type { NLPotter } from "@/lib/new-layout/viewer-state";
import { usePanel } from "./panel";
import { useNL } from "./provider";
import { ComboCard, Empty, plural } from "./ui";

/** A member's public portfolio: everything they have posted, opened in the usual combo panel. */
export function PortfolioView({ potter, combos, glazes }: { potter: NLPotter; combos: NLCombo[]; glazes: NLGlaze[] }) {
  const { catalog, addPotterCombos, addGlazes, state, toast } = useNL();
  const { openCombo } = usePanel();
  const [copied, setCopied] = useState(false);
  const mine = state.viewer?.id === potter.id;

  // The panel looks combos and glazes up in the provider, so hand it this portfolio's.
  useEffect(() => { addPotterCombos(combos); }, [addPotterCombos, combos]);
  useEffect(() => { addGlazes(glazes); }, [addGlazes, glazes]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <>
      <div className="nl-page-head">
        <div>
          <div className="nl-eyebrow">Portfolio{potter.studio ? ` · ${potter.studio}` : ""}</div>
          <h1>{mine ? "Your portfolio" : potter.name}</h1>
          <p>{mine ? "Everything you have posted, as other potters see it." : `Firing results posted by ${potter.name}.`}</p>
        </div>
        <div className="nl-actions">
          <button type="button" className="nl-btn" onClick={() => void share()}>{copied ? "Link copied" : "Copy link"}</button>
          {mine ? <Link className="nl-btn primary" href="/contribute">Add result</Link> : null}
        </div>
      </div>

      <dl className="nl-potter-stats" style={{ marginBottom: 18 }}>
        <div><dd>{combos.length.toLocaleString("en")}</dd><dt>{combos.length === 1 ? "result" : "results"}</dt></div>
        <div><dd>{potter.likes.toLocaleString("en")}</dd><dt>{potter.likes === 1 ? "like" : "likes"}</dt></div>
      </dl>

      {!combos.length ? (
        <Empty title={mine ? "Nothing posted yet" : "No results yet"} action={mine ? <Link className="nl-btn primary" href="/contribute">Add result</Link> : <Link className="nl-btn" href="/combinations">Browse combinations</Link>}>
          {mine ? "Post a firing result and it shows up here for other potters to like and comment on." : `${potter.name} hasn't posted a firing result yet.`}
        </Empty>
      ) : !catalog ? (
        <div className="nl-loading">Loading {plural(combos.length, "result")}…</div>
      ) : (
        <div className="nl-cgrid">
          {combos.map((combo) => <ComboCard key={combo.id} combo={combo} onOpen={() => openCombo(combo.id)} />)}
        </div>
      )}
    </>
  );
}
