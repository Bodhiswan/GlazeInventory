"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

import { swatch } from "@/lib/new-layout/colour";
import { coneTag } from "@/lib/new-layout/cone";
import type { NLCombo, NLGlaze } from "@/lib/new-layout/types";
import { usePanel } from "./panel";
import { useNL } from "./provider";
import { ComboCard, Empty, glazeLabel, glazePhoto, Icon, Photo, plural } from "./ui";
import { useUrlState } from "./use-url-state";

export function ShelfView({ myResults, resultGlazes }: { myResults: NLCombo[]; resultGlazes: NLGlaze[] }) {
  const { catalog, shelf, owned, missing, setStatus, state, addPotterCombos, addGlazes } = useNL();
  const { get, update } = useUrlState();
  const { openGlaze, openCombo } = usePanel();
  useEffect(() => { addGlazes(resultGlazes); addPotterCombos(myResults); }, [addGlazes, addPotterCombos, myResults, resultGlazes]);

  const tab = get("t") === "want" ? "wishlist" : "owned";
  const folder = get("folder");
  const ids = useMemo(() => Object.entries(shelf)
    .filter(([, item]) => item.status === tab && (!folder || item.folderIds.includes(folder)))
    .map(([id]) => id), [folder, shelf, tab]);
  const wantCount = Object.values(shelf).filter((item) => item.status === "wishlist").length;

  const counts = useMemo(() => {
    if (!catalog) return null;
    const all = [...myResults, ...catalog.combos];
    const make = all.filter((combo) => !missing(combo).length).length;
    const near = all.filter((combo) => missing(combo).length === 1).length;
    return { make, near };
  }, [catalog, missing, myResults]);

  const rows = ids.map((id) => catalog?.byId.get(id)).filter((glaze): glaze is NLGlaze => Boolean(glaze))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="nl-page-head"><div><h1>My shelf</h1><p>The glazes you own and the ones you want next. Combos update as you change it.</p></div></div>
      <div className="nl-callouts">
        <Link className="nl-callout" href="/combinations?v=make"><span className="big">{counts?.make ?? "–"}</span><span><span className="t">combos you can make now</span><br /><span className="s">Every layer is on your shelf →</span></span></Link>
        <Link className="nl-callout" href="/combinations?v=near"><span className="big">{counts?.near ?? "–"}</span><span><span className="t">combos one glaze away</span><br /><span className="s">See which jar unlocks the most →</span></span></Link>
      </div>

      <div className="nl-studio-card">
        <div className="sc-text">
          {state.studio ? (
            <><b>Studio: {state.studio.name}</b><span>Members open glazeinventory.com/studio/{state.studio.slug} with passcode <b className="nl-num">{state.studio.passcode}</b>.</span></>
          ) : (
            <><b>Studio mode</b><span>Run a studio? Give members a passcode page showing the glazes you have on hand and the combos they can make with them.</span></>
          )}
        </div>
        <div className="nl-actions">
          <Link className="nl-btn" href="/profile?tab=studio">{state.studio ? "Manage studio" : "Set up studio mode"}</Link>
          {state.studio ? <Link className="nl-btn quiet" href={`/studio/${state.studio.slug}`}>Member view</Link> : null}
        </div>
      </div>

      <div className="nl-seg" role="group" aria-label="Shelf list">
        <button type="button" aria-pressed={tab === "owned"} onClick={() => update({ t: null })}>On my shelf <span className="nl-count">{owned.size}</span></button>
        <button type="button" aria-pressed={tab === "wishlist"} onClick={() => update({ t: "want" })}>Wishlist <span className="nl-count">{wantCount}</span></button>
      </div>
      {state.folders.length && tab === "owned" ? (
        <div className="nl-chips" role="group" aria-label="Folders" style={{ marginTop: 12 }}>
          <button type="button" className="nl-chip" aria-pressed={!folder} onClick={() => update({ folder: null })}>All</button>
          {state.folders.map((item) => (
            <button key={item.id} type="button" className="nl-chip" aria-pressed={folder === item.id} onClick={() => update({ folder: folder === item.id ? null : item.id })}>{item.name}</button>
          ))}
        </div>
      ) : null}
      <div style={{ height: 12 }} />

      {!catalog ? <div className="nl-loading">Loading your shelf…</div> : rows.length ? (
        <div className="nl-list">
          {rows.map((glaze) => {
            const combos = catalog.comboCount.get(glaze.id) ?? 0;
            const tag = coneTag(glaze.cone);
            return (
              <div key={glaze.id} className="nl-row">
                <button type="button" className="nl-row-main" onClick={() => openGlaze(glaze.id)}>
                  <span className="nl-mini" style={{ "--sw": swatch(glaze) } as React.CSSProperties}><Photo src={glazePhoto(glaze)} /></span>
                  <span className="nl-rt"><b>{glaze.name}</b><span>{glazeLabel(glaze) || "Your own glaze"}{tag ? ` · ${tag}` : combos ? ` · in ${plural(combos, "combo")}` : ""}</span></span>
                </button>
                <div className="nl-row-actions">
                  {tab === "wishlist"
                    ? <button type="button" className="nl-btn small" onClick={() => void setStatus(glaze.id, "owned")}>Got it</button>
                    : <button type="button" className="nl-btn small quiet" title="Move to wishlist (running low)" onClick={() => void setStatus(glaze.id, "wishlist")}>To wishlist</button>}
                  <button type="button" className="nl-icon-btn" aria-label={`Remove ${glaze.name}`} onClick={() => void setStatus(glaze.id, null)}><Icon name="close" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : folder ? (
        <Empty title="Nothing in this folder" action={<button type="button" className="nl-btn" onClick={() => update({ folder: null })}>Show all</button>}>Open a glaze on your shelf to add it to a folder.</Empty>
      ) : (
        <Empty title={tab === "wishlist" ? "Your wishlist is empty" : "Your shelf is empty"} action={<Link className="nl-btn primary" href="/glazes">Browse glazes</Link>}>
          {tab === "wishlist" ? "Add glazes you plan to buy. Combos that need them show what you would unlock." : "Add the glazes you own to see which combos you can make."}
        </Empty>
      )}

      <section className="nl-section" aria-labelledby="my-results">
        <h2 id="my-results">My results</h2>
        {myResults.length ? (
          <div className="nl-cgrid">{myResults.map((combo) => <ComboCard key={combo.id} combo={combo} onOpen={() => openCombo(combo.id)} />)}</div>
        ) : (
          <Empty title="No results posted yet" action={<Link className="nl-btn primary" href="/contribute">Add result</Link>}>Fired a test tile? Add a photo and the glazes you layered so you can find it again.</Empty>
        )}
      </section>
    </>
  );
}
