"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { comboSwatch, COLOR_SWATCH, namedPalette, swatch } from "@/lib/new-layout/colour";
import { isCone6 } from "@/lib/new-layout/cone";
import type { NLCombo, NLFillLevel, NLGlaze } from "@/lib/new-layout/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useNL } from "./provider";
import { BuyList, comboName, glazeLabel, Photo, plural } from "./ui";

/** Member view of a studio page: no shelf controls, links stay inside the studio. */
export interface MemberContext {
  slug: string;
  glazeIds: Set<string>;
  comboIds: Set<string>;
}

const FILL_TEXT: Record<NLFillLevel, string> = { full: "Full", half: "About half", low: "Running low" };

/** Read-only: the newest comments from the classic site. */
function Comments({ kind, id }: { kind: "glaze" | "combination"; id: string }) {
  const [comments, setComments] = useState<{ id: string; body: string; author: string; date: string }[]>([]);
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    const columns = "id, body, created_at, author:profiles(display_name)";
    const query = kind === "glaze"
      ? supabase.from("glaze_comments").select(columns).eq("glaze_id", id)
      : supabase.from("combination_comments").select(columns).eq("example_id", id);
    query
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setComments((data as unknown as { id: string; body: string; created_at: string; author: { display_name?: string } | { display_name?: string }[] | null }[]).map((row) => {
          const author = Array.isArray(row.author) ? row.author[0] : row.author;
          return { id: row.id, body: row.body, author: author?.display_name ?? "A potter", date: new Date(row.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) };
        }));
      });
    return () => { cancelled = true; };
  }, [kind, id]);
  if (!comments.length) return null;
  return (
    <section aria-labelledby={`comments-${id}`} className="nl-comments">
      <h3 id={`comments-${id}`}>What potters said</h3>
      {comments.map((comment) => (
        <div key={comment.id} className="nl-comment"><b>{comment.author}</b> <span className="nl-muted">· {comment.date}</span><br />{comment.body}</div>
      ))}
    </section>
  );
}

function NoteEditor({ glazeId, initial }: { glazeId: string; initial: string }) {
  const { setNote } = useNL();
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState("");
  const timer = useRef<number | undefined>(undefined);
  return (
    <div className="nl-field">
      <div className="nl-box-head">
        <label htmlFor={`note-${glazeId}`}>My notes <span className="nl-muted">(private)</span></label>
        <span className="nl-note" aria-live="polite">{status}</span>
      </div>
      <textarea
        id={`note-${glazeId}`}
        className="nl-textarea"
        maxLength={500}
        value={value}
        placeholder="Clay body, coats, where it ran, what to try next…"
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          setStatus("Saving…");
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(async () => setStatus((await setNote(glazeId, next)) ? "Saved" : ""), 700);
        }}
      />
    </div>
  );
}

export function GlazeDetail({ glaze, member, onOpenCombo, titleTag = "h2" }: {
  glaze: NLGlaze;
  member?: MemberContext;
  onOpenCombo: (id: string) => void;
  titleTag?: "h1" | "h2";
}) {
  const { catalog, shelf, status, setStatus, setFill, setFolders, state, savedGlazes, toggleSaved, owned } = useNL();
  // The panel remounts this per glaze (key={glaze.id}), so the photo index starts at 0.
  const [photoIndex, setPhotoIndex] = useState(0);
  const current = status(glaze.id);
  const entry = shelf[glaze.id];
  const allCombos = catalog?.combosByGlaze.get(glaze.id) ?? [];
  const combos = member ? allCombos.filter((combo) => member.comboIds.has(combo.id)) : allCombos;
  const canMake = combos.filter((combo) => combo.layers.every((layer) => owned.has(layer.g))).length;
  const photo = glaze.photos[photoIndex] ?? glaze.photos[0];
  const Title = titleTag;
  const combosHref = member ? `/studio/${member.slug}/combinations?with=${glaze.id}` : `/combinations?with=${glaze.id}`;

  return (
    <>
      <div className="nl-gallery">
        <div className="nl-hero" style={{ "--sw": swatch(glaze) } as React.CSSProperties}><Photo src={photo?.[0] ?? null} alt={`${glaze.name}, ${photo?.[1] ?? "photo"}`} /></div>
        {photo ? (
          <div className="nl-caption">
            <span className={`nl-photo-tag ${photo[1] === "Cone 6" ? "c6" : ""}`}>{photo[1]}</span>
            {glaze.photos.length > 1 ? <span className="nl-note">{plural(glaze.photos.length, "photo")}</span> : null}
          </div>
        ) : null}
        {glaze.photos.length > 1 ? (
          <div className="nl-thumbs" role="group" aria-label="Photos">
            {glaze.photos.map(([url, label], i) => (
              <button key={url} type="button" aria-pressed={i === photoIndex} aria-label={`Photo ${i + 1}: ${label}`} onClick={() => setPhotoIndex(i)}>
                <span style={{ "--sw": swatch(glaze) } as React.CSSProperties}><Photo src={url} /></span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <div className="nl-eyebrow">{glazeLabel(glaze)}{glaze.line ? ` · ${glaze.line}` : ""}</div>
        <Title id="nl-panel-title" tabIndex={-1}>{glaze.name}</Title>
      </div>

      <div className="nl-facts">
        <span className="nl-fact">{glaze.cone6 ? "Cone 6 · oxidation" : glaze.cone ?? "Cone not recorded"}</span>
        {glaze.ft.slice(0, 4).map((finish) => <span key={finish} className="nl-fact">{finish}</span>)}
      </div>

      {glaze.pal.length ? (
        <div className="nl-field">
          <span className="lab">Colours in the photo</span>
          <div className="nl-palbar" role="img" aria-label={namedPalette(glaze).map(([label, weight]) => `${label} ${Math.round(weight * 100)}%`).join(", ")}>
            {glaze.pal.map(([hex, weight]) => <span key={hex} style={{ background: hex, flex: weight }} title={`${hex} · ${Math.round(weight * 100)}%`} />)}
          </div>
          <div className="nl-facts">
            {namedPalette(glaze).map(([label, weight]) => (
              <span key={label} className="nl-fact"><span className="nl-dot" style={{ background: COLOR_SWATCH[label] ?? "#d8c6b8" }} />{label}{weight ? <span className="nl-muted nl-num"> {Math.round(weight * 100)}%</span> : null}</span>
            ))}
          </div>
        </div>
      ) : null}

      {member ? null : (
        <>
          <div className="nl-field">
            <span className="lab" id={`shelf-${glaze.id}`}>On my shelf?</span>
            <div className="nl-seg" role="radiogroup" aria-labelledby={`shelf-${glaze.id}`}>
              {([["owned", "I have it"], ["wishlist", "Wishlist"], [null, "Not on shelf"]] as const).map(([value, text]) => (
                <button key={text} type="button" role="radio" aria-checked={current === value} onClick={() => void setStatus(glaze.id, value)}>{text}</button>
              ))}
            </div>
          </div>
          {current === "owned" && entry ? (
            <div className="nl-field">
              <span className="lab" id={`fill-${glaze.id}`}>How much is left?</span>
              <div className="nl-seg" role="radiogroup" aria-labelledby={`fill-${glaze.id}`}>
                {(Object.keys(FILL_TEXT) as NLFillLevel[]).map((fill) => (
                  <button key={fill} type="button" role="radio" aria-checked={entry.fill === fill} onClick={() => void setFill(glaze.id, fill)}>{FILL_TEXT[fill]}</button>
                ))}
              </div>
            </div>
          ) : null}
          {current && entry?.inventoryId ? <NoteEditor key={glaze.id} glazeId={glaze.id} initial={entry.note} /> : null}
          {current === "owned" && entry?.inventoryId && state.folders.length ? (
            <div className="nl-field">
              <span className="lab">Folders</span>
              <div className="nl-chips">
                {state.folders.map((folder) => {
                  const on = entry.folderIds.includes(folder.id);
                  return (
                    <button key={folder.id} type="button" className="nl-chip" aria-pressed={on}
                      onClick={() => void setFolders(glaze.id, on ? entry.folderIds.filter((id) => id !== folder.id) : [...entry.folderIds, folder.id])}>
                      {folder.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="nl-actions">
            <button type="button" className="nl-btn" aria-pressed={savedGlazes.has(glaze.id)} onClick={() => void toggleSaved("glaze", glaze.id)}>
              {savedGlazes.has(glaze.id) ? "♥ Saved" : "♡ Save glaze"}
            </button>
          </div>
        </>
      )}

      <BuyList glaze={glaze} />

      {glaze.desc ? <p className="nl-desc">{glaze.desc}</p> : null}

      <section aria-labelledby={`gc-${glaze.id}`}>
        <div className="nl-page-head" style={{ marginBottom: 10 }}>
          <h3 id={`gc-${glaze.id}`}>{member ? "Combos you can make here" : "Combos with this glaze"}</h3>
          {combos.length ? <Link className="nl-link" href={combosHref}>See all {combos.length}</Link> : null}
        </div>
        {combos.length ? (
          <>
            <p className="nl-note" style={{ marginBottom: 10 }}>
              {member ? "Every glaze in these is on hand at the studio." : canMake ? `You can make ${plural(canMake, "of these", "of these")} today.` : "Add more glazes to your shelf to make these."}
            </p>
            <div className="nl-strip">
              {combos.slice(0, 6).map((combo) => (
                <button key={combo.id} type="button" aria-label={catalog ? comboName(combo, catalog.byId) : combo.title} onClick={() => onOpenCombo(combo.id)}>
                  <div className="nl-thumb" style={{ "--sw": catalog ? comboSwatch(combo, catalog.byId) : undefined } as React.CSSProperties}><Photo src={combo.image} /></div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="nl-note">{member ? "No vendor combos use only this studio's glazes yet." : "No tested combos yet. Be the first to post one."}</p>
        )}
      </section>

      <Comments kind="glaze" id={glaze.id} />

      {member ? null : (
        <div className="nl-actions">
          <Link className="nl-btn primary" href={`/contribute?glaze=${glaze.id}`}>Add my result with this glaze</Link>
        </div>
      )}
    </>
  );
}

export function ComboDetail({ combo, member, onOpenGlaze, titleTag = "h2" }: {
  combo: NLCombo;
  member?: MemberContext;
  onOpenGlaze: (id: string) => void;
  titleTag?: "h1" | "h2";
}) {
  const { catalog, status, setStatus, missing, savedCombos, toggleSaved } = useNL();
  if (!catalog) return null;
  const Title = titleTag;
  const apply = [...combo.layers].reverse();
  const need = missing(combo);
  const saved = savedCombos.has(combo.id);
  const firingKnown = combo.layers.every((layer) => isCone6(catalog.byId.get(layer.g)?.cone));
  return (
    <>
      <div className="nl-hero" style={{ "--sw": comboSwatch(combo, catalog.byId) } as React.CSSProperties}><Photo src={combo.image} alt={comboName(combo, catalog.byId)} /></div>
      <div>
        <div className="nl-eyebrow">{combo.cone ?? "Cone 6"} · {combo.potter ? `posted by ${combo.potter.mine ? "you" : combo.potter.name}, ${combo.potter.date}` : `${combo.vendor} test tile`}</div>
        <Title id="nl-panel-title" tabIndex={-1}>{comboName(combo, catalog.byId)}</Title>
      </div>
      <p className="nl-note">
        {member ? "Every glaze for this combo is on hand at the studio." : need.length ? `You need ${plural(need.length, "more glaze")} for this one.` : "You have every glaze for this combo."}
      </p>
      <section aria-labelledby={`apply-${combo.id}`}>
        <h3 id={`apply-${combo.id}`} style={{ marginBottom: 10 }}>Apply in this order</h3>
        <ol className="nl-steps">
          {apply.map((layer, i) => {
            const glaze = catalog.byId.get(layer.g);
            if (!glaze) return null;
            const state = status(glaze.id);
            return (
              <li key={`${layer.g}-${i}`} className="nl-step">
                <span className="k">{i + 1}</span>
                <button type="button" className="nl-row-main" style={{ minHeight: 40 }} onClick={() => onOpenGlaze(glaze.id)}>
                  <span className="nl-mini" style={{ "--sw": swatch(glaze) } as React.CSSProperties}><Photo src={glaze.photos[0]?.[0] ?? null} /></span>
                  <span className="st"><b>{glaze.name}</b><span>{glazeLabel(glaze)} · {i === 0 ? "base coat" : "top coat"}</span></span>
                </button>
                {member ? null : state === "owned" ? <span className="nl-state owned">Have</span>
                  : state === "wishlist" ? <span className="nl-state wishlist">On wishlist</span>
                  : <button type="button" className="nl-btn small" onClick={() => void setStatus(glaze.id, "wishlist")}>＋ Wishlist</button>}
              </li>
            );
          })}
        </ol>
      </section>
      <dl className="nl-kv">
        {combo.clay ? <><dt>Clay</dt><dd>{combo.clay}</dd></> : null}
        {combo.notes ? <><dt>Applied</dt><dd>{combo.notes}</dd></> : null}
        {combo.firing ? <><dt>Kiln</dt><dd>{combo.firing}</dd></> : null}
        <dt>Firing</dt><dd>{combo.cone ?? (firingKnown ? "Cone 6, oxidation" : "Cone 6")}</dd>
      </dl>
      <p className="nl-note">This is a recorded result. Your clay, application and kiln can change the finish.</p>
      <div className="nl-actions">
        {member || combo.potter?.mine ? null : (
          <button type="button" className={`nl-btn ${saved ? "" : "primary"}`} aria-pressed={saved} onClick={() => void toggleSaved("combination", combo.id)}>
            {saved ? "✓ Saved" : "Save combo"}
          </button>
        )}
        {combo.url ? <a className="nl-btn quiet" href={combo.url} target="_blank" rel="noopener noreferrer">View on {combo.vendor} site ↗</a> : null}
      </div>
      {combo.potter ? null : <Comments kind="combination" id={combo.id} />}
    </>
  );
}
