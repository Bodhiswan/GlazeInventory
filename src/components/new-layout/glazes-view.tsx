"use client";

import { useEffect, useMemo, useRef } from "react";

import { colourAwareQuery, colourScore, COLOR_GROUPS, COLOR_SWATCH, COLOURS, compactText, FINISH_GROUPS, FINISHES, matchesSearch, matchesSmart, normText } from "@/lib/new-layout/colour";
import type { NLGlaze } from "@/lib/new-layout/types";
import type { MemberContext } from "./details";
import { usePanel } from "./panel";
import { useNL } from "./provider";
import { Empty, GlazeCard, plural, SearchBox } from "./ui";
import { useUrlState } from "./use-url-state";

const PAGE = 48;

/** The glaze library. With `member`, it shows only a studio's shared glazes and hides shelf controls. */
export function GlazesView({ initialGlazes, member }: { initialGlazes: NLGlaze[]; member?: MemberContext }) {
  const { catalog, catalogError, status, savedGlazes, state } = useNL();
  const { get, list, update } = useUrlState();
  const { openGlaze } = usePanel();
  const brandMenu = useRef<HTMLDetailsElement>(null);

  const q = get("q"), colours = list("c"), finishes = list("f"), brands = list("b");
  const onShelf = !member && get("s") === "1";
  const savedOnly = !member && get("saved") === "1";
  const sort = get("sort");
  const shown = Math.max(PAGE, Number(get("n")) || PAGE);

  const base = useMemo(() => {
    if (!catalog) return null;
    return member ? [...member.glazeIds].map((id) => catalog.byId.get(id)).filter((glaze): glaze is NLGlaze => Boolean(glaze)) : catalog.glazes;
  }, [catalog, member]);

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const glaze of base ?? []) counts.set(glaze.brand, (counts.get(glaze.brand) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [base]);

  // Same pipeline as the classic explorer: filter by chips and text, then rank by true photo colour.
  const results = useMemo(() => {
    if (!catalog || !base) return null;
    const { colours: queryColours, text } = colourAwareQuery(q);
    const filtered = base.filter((glaze) =>
      matchesSmart(glaze.ct, colours, COLOR_GROUPS) &&
      matchesSmart(glaze.ft, finishes, FINISH_GROUPS) &&
      (!brands.length || brands.includes(glaze.brand)) &&
      (!onShelf || status(glaze.id)) &&
      (!savedOnly || savedGlazes.has(glaze.id)) &&
      (!text || matchesSearch(glaze.s, text)));
    const rankBy = colours.length ? colours : queryColours;
    if (sort === "combos") return filtered.sort((a, b) => (catalog.comboCount.get(b.id) ?? 0) - (catalog.comboCount.get(a.id) ?? 0));
    if (sort === "brand") return filtered.sort((a, b) => a.brand.localeCompare(b.brand) || a.code.localeCompare(b.code, undefined, { numeric: true }));
    if (sort === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (text || rankBy.length) {
      const exact = (glaze: NLGlaze) => matchesSearch(`${normText(glaze.code)} ${normText(glaze.name)} ${compactText(glaze.code)} ${compactText(glaze.name)}`, text);
      return filtered
        .map((glaze) => ({ glaze, score: colourScore(glaze, rankBy), exact: text ? exact(glaze) : false }))
        .sort((a, b) => (Math.abs(b.score - a.score) > 0.0001 ? b.score - a.score : 0) || Number(b.exact) - Number(a.exact) || a.glaze.name.localeCompare(b.glaze.name))
        .map((item) => item.glaze);
    }
    const order = new Map(catalog.flowOrder.map((id, i) => [id, i]));
    return filtered.sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9));
  }, [base, brands, catalog, colours, finishes, onShelf, q, savedGlazes, savedOnly, sort, status]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (brandMenu.current?.open && !brandMenu.current.contains(event.target as Node)) brandMenu.current.open = false;
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const toggle = (key: string, current: string[], value: string) =>
    update({ [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
  const active = colours.length + finishes.length + brands.length + Number(onShelf) + Number(savedOnly) + Number(Boolean(q));
  const rankNote = (() => {
    if (sort) return "";
    const by = colours.length ? colours : colourAwareQuery(q).colours;
    if (by.length) return `Closest ${by.join(" + ").toLowerCase()} first, judged from each glaze's photo.`;
    return q ? "" : "Arranged by colour, from the glaze photos.";
  })();
  const total = base?.length ?? initialGlazes.length;
  const list_ = results ?? initialGlazes;

  return (
    <>
      <div className="nl-page-head">
        <div>
          <h1>{member ? "Glazes on hand" : "Cone 6 glazes"}</h1>
          <p>{member ? `${plural(total, "Cone 6 glaze")} at the studio. Tap a tile for notes and combos you can make here.` : `${total.toLocaleString("en")} commercial midfire glazes from ${brandCounts.length || 18} brands.`}</p>
        </div>
      </div>
      <SearchBox id="q" label="Search" placeholder="Search name, code, brand or colour" value={q} onChange={(value) => update({ q: value })} />
      <div className="nl-filters">
        <div className="nl-frow">
          <span className="nl-flabel" id="lab-c">Colour</span>
          <div className="nl-chips" role="group" aria-labelledby="lab-c">
            {COLOURS.map((colour) => (
              <button key={colour} type="button" className="nl-chip" aria-pressed={colours.includes(colour)} onClick={() => toggle("c", colours, colour)}>
                <span className="nl-dot" style={{ background: COLOR_SWATCH[colour] }} />{colour}
              </button>
            ))}
          </div>
        </div>
        <div className="nl-frow">
          <span className="nl-flabel" id="lab-f">Finish</span>
          <div className="nl-chips" role="group" aria-labelledby="lab-f">
            {FINISHES.map((finish) => (
              <button key={finish} type="button" className="nl-chip" aria-pressed={finishes.includes(finish)} onClick={() => toggle("f", finishes, finish)}>{finish}</button>
            ))}
          </div>
        </div>
        <div className="nl-frow">
          <span className="nl-flabel">More</span>
          <div className="nl-tools">
            <details className="nl-dd" ref={brandMenu}>
              <summary className="nl-chip" aria-pressed={brands.length ? true : undefined}>Brand{brands.length ? ` · ${brands.length}` : ""} <span aria-hidden="true">▾</span></summary>
              <div className="nl-dd-menu" role="group" aria-label="Brands">
                {brandCounts.map(([brand, count]) => (
                  <label key={brand}>
                    <input type="checkbox" checked={brands.includes(brand)} onChange={() => toggle("b", brands, brand)} />{brand}<span className="n">{count}</span>
                  </label>
                ))}
              </div>
            </details>
            {member ? null : (
              <>
                <label className="nl-toggle"><input type="checkbox" checked={onShelf} onChange={(event) => update({ s: event.target.checked ? "1" : null })} />Only my shelf</label>
                {state.viewer ? <label className="nl-toggle"><input type="checkbox" checked={savedOnly} onChange={(event) => update({ saved: event.target.checked ? "1" : null })} />Saved</label> : null}
              </>
            )}
            <label className="nl-sr" htmlFor="sort">Sort</label>
            <select id="sort" className="nl-select" value={sort} onChange={(event) => update({ sort: event.target.value || null })}>
              <option value="">Sort: colour &amp; best match</option>
              <option value="combos">Sort: most combos</option>
              <option value="brand">Sort: brand &amp; code</option>
              <option value="name">Sort: name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="nl-resultbar" aria-live="polite">
        <span><strong>{(results?.length ?? total).toLocaleString("en")}</strong> {(results?.length ?? total) === 1 ? "glaze" : "glazes"}</span>
        {rankNote ? <span className="nl-muted">{rankNote}</span> : null}
        {active ? <button type="button" className="nl-link" onClick={() => update({ q: null, c: null, f: null, b: null, s: null, saved: null })}>Clear all filters</button> : null}
      </div>

      {catalogError ? (
        <Empty title="Couldn't load the glaze list" action={<button type="button" className="nl-btn" onClick={() => window.location.reload()}>Try again</button>}>Check your connection, then try again.</Empty>
      ) : list_.length ? (
        <>
          <div className="nl-grid">
            {list_.slice(0, shown).map((glaze) => (
              <GlazeCard key={glaze.id} glaze={glaze} hideStatus={Boolean(member)} onOpen={() => openGlaze(glaze.id)} />
            ))}
          </div>
          {results && results.length > shown ? (
            <div className="nl-more">
              <button type="button" className="nl-btn" onClick={() => update({ n: String(shown + PAGE) }, { keepPage: true })}>
                Show {Math.min(PAGE, results.length - shown)} more <span className="nl-muted">· {(results.length - shown).toLocaleString("en")} left</span>
              </button>
            </div>
          ) : null}
        </>
      ) : results ? (
        <Empty title="No glazes match" action={<button type="button" className="nl-btn" onClick={() => update({ q: null, c: null, f: null, b: null, s: null, saved: null })}>Clear all filters</button>}>
          Try fewer filters, or search by the code printed on the jar, like “PC-20”.
        </Empty>
      ) : (
        <div className="nl-loading">Loading Cone 6 glazes…</div>
      )}
    </>
  );
}
