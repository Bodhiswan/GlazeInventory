"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { colourAwareQuery, colourScore, comboMatches, comboMatchesPair } from "@/lib/new-layout/colour";
import type { NLCombo } from "@/lib/new-layout/types";
import type { MemberContext } from "./details";
import { usePanel } from "./panel";
import { useNL } from "./provider";
import { ComboCard, Empty, glazeLabel, SearchBox } from "./ui";
import { useUrlState } from "./use-url-state";

const PAGE = 36;
type View = "all" | "make" | "near" | "saved" | "potters";

/** Combinations. With `member`, only combos a studio can fully make, with no shelf states. */
export function CombosView({ potterCombos, member }: { potterCombos: NLCombo[]; member?: MemberContext }) {
  const { catalog, catalogError, missing, savedCombos, addPotterCombos, toast } = useNL();
  const { get, update } = useUrlState();
  const { openCombo } = usePanel();
  const [secondOpen, setSecondOpen] = useState(false);

  useEffect(() => { addPotterCombos(potterCombos); }, [addPotterCombos, potterCombos]);

  // Results posted through the classic flow land on /combinations?view=mine&result=<id>.
  useEffect(() => {
    if (get("view") !== "mine" && !get("result")) return;
    const result = get("result");
    update({ view: null, published: null, result: null, v: "saved", combo: result || null }, { keepPage: true });
    if (get("published")) toast("Result published. It's under Saved & mine.");
  }, [get, toast, update]);

  const viewParam = member ? "all" : get("v") || "all";
  const view = viewParam as View;
  const q = get("q"), q2 = get("q2"), withId = get("with");
  const shown = Math.max(PAGE, Number(get("n")) || PAGE);
  const withGlaze = withId && catalog ? catalog.byId.get(withId) : undefined;
  const showSecond = secondOpen || Boolean(q2);

  // Left to the React Compiler to memoise; a manual useMemo here couldn't be preserved.
  const data = (() => {
    if (!catalog) return null;
    const all = member ? catalog.combos.filter((combo) => member.comboIds.has(combo.id)) : [...potterCombos, ...catalog.combos];
    const lists: Partial<Record<View, NLCombo[]>> = member ? { all } : {
      all,
      make: all.filter((combo) => !missing(combo).length),
      near: all.filter((combo) => missing(combo).length === 1),
      saved: all.filter((combo) => savedCombos.has(combo.id) || combo.potter?.mine),
      potters: potterCombos,
    };
    const counts = Object.fromEntries(Object.entries(lists).map(([key, list]) => [key, list.length])) as Partial<Record<View, number>>;
    const current = viewParam as View;
    let out = lists[current] ?? all;
    if (withId) out = out.filter((combo) => combo.layers.some((layer) => layer.g === withId));
    const first = colourAwareQuery(q), second = colourAwareQuery(q2);
    if (second.text) out = out.filter((combo) => comboMatchesPair(combo, catalog.byId, first.text, second.text));
    else if (first.text) out = out.filter((combo) => comboMatches(combo, catalog.byId, first.text));
    const colours = [...new Set([...first.colours, ...second.colours])];
    if (colours.length) {
      // Rank by the closest-matching layer, using the same photo-colour score as glazes.
      const score = (combo: NLCombo) => Math.max(...combo.layers.map((layer) => {
        const glaze = catalog.byId.get(layer.g);
        return glaze ? colourScore(glaze, colours) : 0;
      }));
      out = out.map((combo) => [combo, score(combo)] as const).sort((a, b) => b[1] - a[1]).map(([combo]) => combo);
    } else if (current === "all" && !member) {
      out = [...out].sort((a, b) => Number(Boolean(b.potter)) - Number(Boolean(a.potter)) || missing(a).length - missing(b).length);
    }
    return { counts, results: out };
  })();
  const results = data?.results ?? null;

  const hint = q && q2 ? "Combos that use both glazes." : ({
    make: "Every layer in these combos is already on your shelf.",
    near: "Buy one more jar to make any of these. The missing glaze is marked.",
    saved: "Combos you saved and results you posted.",
    potters: "Results posted by potters using Glaze Inventory.",
  } as Partial<Record<View, string>>)[view];

  const tabs: [View, string][] = [["all", "All"], ["make", "I can make"], ["near", "One glaze away"], ["saved", "Saved & mine"]];
  if (potterCombos.length) tabs.push(["potters", "From potters"]);

  return (
    <>
      <div className="nl-page-head">
        <div>
          <h1>{member ? "Combos you can make here" : "Cone 6 combinations"}</h1>
          <p>{member ? "Vendor test tiles where every layer is a glaze the studio has on hand." : `${(catalog?.combos.length ?? 1349).toLocaleString("en")} layered test tiles from Mayco, AMACO and Coyote, plus results from potters, matched against your shelf.`}</p>
        </div>
      </div>
      <SearchBox id="q" label="Search" placeholder="Search combos by glaze name, code or colour" value={q} onChange={(value) => update({ q: value })} />
      <div className="nl-second">
        {showSecond ? (
          <>
            <div><SearchBox id="q2" label="Second glaze" placeholder="Second glaze, e.g. SW-402 or Dark Flux" value={q2} onChange={(value) => update({ q2: value })} /></div>
            <button type="button" className="nl-link" onClick={() => { setSecondOpen(false); update({ q2: null }); }}>Remove second glaze</button>
          </>
        ) : (
          <button type="button" className="nl-link" onClick={() => { setSecondOpen(true); window.setTimeout(() => document.getElementById("q2")?.focus(), 0); }}>＋ Add a second glaze</button>
        )}
      </div>
      <div className="nl-filters">
        {member ? null : (
          <div className="nl-seg" role="group" aria-label="Which combos">
            {tabs.map(([key, text]) => (
              <button key={key} type="button" aria-pressed={view === key} onClick={() => update({ v: key === "all" ? null : key })}>
                {text} <span className="nl-count">{(data?.counts[key] ?? 0).toLocaleString("en")}</span>
              </button>
            ))}
          </div>
        )}
        {withGlaze ? (
          <div><span className="nl-withchip">With {glazeLabel(withGlaze)} {withGlaze.name}<button type="button" aria-label="Show combos with any glaze" onClick={() => update({ with: null })}>✕</button></span></div>
        ) : null}
      </div>

      <div className="nl-resultbar" aria-live="polite">
        <span><strong>{(results?.length ?? 0).toLocaleString("en")}</strong> {results?.length === 1 ? "combo" : "combos"}</span>
        {hint ? <span className="nl-muted">{hint}</span> : null}
        {q || q2 || withId ? <button type="button" className="nl-link" onClick={() => { setSecondOpen(false); update({ q: null, q2: null, with: null }); }}>Clear search</button> : null}
      </div>

      {catalogError ? (
        <Empty title="Couldn't load the combos" action={<button type="button" className="nl-btn" onClick={() => window.location.reload()}>Try again</button>}>Check your connection, then try again.</Empty>
      ) : !results ? (
        <div className="nl-loading">Loading combinations…</div>
      ) : results.length ? (
        <>
          <div className="nl-cgrid">
            {results.slice(0, shown).map((combo) => <ComboCard key={combo.id} combo={combo} member={Boolean(member)} onOpen={() => openCombo(combo.id)} />)}
          </div>
          {results.length > shown ? (
            <div className="nl-more">
              <button type="button" className="nl-btn" onClick={() => update({ n: String(shown + PAGE) }, { keepPage: true })}>Show more <span className="nl-muted">· {(results.length - shown).toLocaleString("en")} left</span></button>
            </div>
          ) : null}
        </>
      ) : member && !q && !q2 && !withId ? (
        <Empty title="No complete combos yet">None of the vendor test tiles use only glazes this studio has shared. Check back as the library grows.</Empty>
      ) : view === "make" ? (
        <Empty title="Nothing you can make yet" action={<Link className="nl-btn" href="/glazes">Browse glazes</Link>}>Mark the glazes you own as “I have it” and matching combos show up here.</Empty>
      ) : view === "saved" ? (
        <Empty title="No saved combos" action={<Link className="nl-btn primary" href="/contribute">Add result</Link>}>Open any combo and choose Save, or post your own firing result.</Empty>
      ) : (
        <Empty title="No combos match" action={<button type="button" className="nl-btn" onClick={() => update({ q: null, q2: null, with: null })}>Clear search</button>}>Try a glaze code like “SW-116”, or clear the search.</Empty>
      )}
    </>
  );
}
