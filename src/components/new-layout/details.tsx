"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { comboSwatch, COLOR_SWATCH, namedPalette, swatch } from "@/lib/new-layout/colour";
import { isCone6 } from "@/lib/new-layout/cone";
import type { NLCombo, NLFillLevel, NLGlaze } from "@/lib/new-layout/types";
import { addCombinationCommentInlineAction, addGlazeCommentInlineAction } from "@/app/actions/community";
import { getEngagementAction, type Engagement, type EngagementComment } from "@/app/actions/engagement";
import { useNL } from "./provider";
import { BuyList, comboName, glazeLabel, Photo, plural } from "./ui";

/** Member view of a studio page: no shelf controls, links stay inside the studio. */
export interface MemberContext {
  slug: string;
  glazeIds: Set<string>;
  comboIds: Set<string>;
}

const FILL_TEXT: Record<NLFillLevel, string> = { full: "Full", half: "About half", low: "Running low" };

type Kind = "glaze" | "combination";

/**
 * Likes and comments for one glaze or combination. `liked` is the viewer's own
 * like, which the provider flips straight away, so the count follows it without
 * waiting for the server.
 */
function useEngagement(kind: Kind, id: string, liked: boolean) {
  const [loaded, setLoaded] = useState<{ key: string; data: Engagement; likedThen: boolean } | null>(null);
  const likedRef = useRef(liked);
  useEffect(() => { likedRef.current = liked; }, [liked]);
  const key = `${kind}:${id}`;
  useEffect(() => {
    let cancelled = false;
    getEngagementAction(kind, id)
      .then((data) => { if (!cancelled) setLoaded({ key: `${kind}:${id}`, data, likedThen: likedRef.current }); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [kind, id]);
  const current = loaded?.key === key ? loaded : null;
  return {
    likes: Math.max(0, (current?.data.likes ?? 0) + Number(liked) - Number(current?.likedThen ?? liked)),
    comments: current?.data.comments ?? [],
    addComment: (comment: EngagementComment) =>
      setLoaded((value) => (value ? { ...value, data: { ...value.data, comments: [comment, ...value.data.comments] } } : value)),
  };
}

function LikeButton({ kind, id, likes }: { kind: Kind; id: string; likes: number }) {
  const { savedGlazes, savedCombos, toggleSaved } = useNL();
  const liked = (kind === "glaze" ? savedGlazes : savedCombos).has(id);
  return (
    <button type="button" className={`nl-btn ${liked ? "" : "primary"}`} aria-pressed={liked} onClick={() => void toggleSaved(kind, id)}>
      {liked ? "♥ Liked" : "♡ Like"}{likes ? <span className="nl-like-count">{likes.toLocaleString("en")}</span> : null}
    </button>
  );
}

/** Comments with a box to add one. Guests are sent to sign in when they post. */
function Comments({ kind, id, comments, onAdd, readOnly }: {
  kind: Kind;
  id: string;
  comments: EngagementComment[];
  onAdd: (comment: EngagementComment) => void;
  readOnly?: boolean;
}) {
  const { state, requireAccount, toast } = useNL();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (readOnly && !comments.length) return null;

  async function post(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (text.length < 2) { setError("Write a few words first."); return; }
    if (!requireAccount()) return;
    setBusy(true);
    setError("");
    const result = await (kind === "glaze" ? addGlazeCommentInlineAction(id, text) : addCombinationCommentInlineAction(id, text))
      .catch(() => ({ error: "Couldn't post that. Try again." } as { error?: string; authorName?: string }));
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    onAdd({
      id: `new-${Date.now()}`,
      body: text,
      authorId: state.viewer?.id ?? "",
      author: result.authorName ?? state.viewer?.name ?? "You",
      date: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
    });
    setBody("");
    toast("Comment posted.");
  }

  return (
    <section aria-labelledby={`comments-${id}`} className="nl-comments">
      <h3 id={`comments-${id}`}>Comments{comments.length ? <span className="nl-muted"> · {comments.length}</span> : null}</h3>
      {readOnly ? null : (
        <form className="nl-comment-form" onSubmit={post}>
          <label className="nl-sr" htmlFor={`comment-box-${id}`}>Add a comment</label>
          <textarea id={`comment-box-${id}`} className="nl-textarea" value={body} maxLength={1000} placeholder={kind === "glaze" ? "How has this glaze behaved for you?" : "Ask a question or say what you think"}
            onChange={(event) => { setBody(event.target.value); setError(""); }} />
          {error ? <p className="nl-note" role="alert" style={{ color: "var(--nl-warn, #9a3b2a)" }}>{error}</p> : null}
          <div className="nl-actions"><button type="submit" className="nl-btn small" disabled={busy}>{busy ? "Posting…" : "Post comment"}</button></div>
        </form>
      )}
      {comments.map((comment) => (
        <div key={comment.id} className="nl-comment">
          {comment.authorId ? <Link className="nl-comment-author" href={`/potters/${comment.authorId}`}>{comment.author}</Link> : <b>{comment.author}</b>}{" "}
          <span className="nl-muted">· {comment.date}</span><br />{comment.body}
        </div>
      ))}
      {!comments.length ? <p className="nl-note">No comments yet. Be the first.</p> : null}
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
  const { catalog, shelf, status, setStatus, setFill, setFolders, state, savedGlazes, owned } = useNL();
  // The panel remounts this per glaze (key={glaze.id}), so the photo index starts at 0.
  const [photoIndex, setPhotoIndex] = useState(0);
  const engagement = useEngagement("glaze", glaze.id, savedGlazes.has(glaze.id));
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
            <LikeButton kind="glaze" id={glaze.id} likes={engagement.likes} />
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

      <Comments kind="glaze" id={glaze.id} comments={engagement.comments} onAdd={engagement.addComment} readOnly={Boolean(member)} />

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
  const { catalog, status, setStatus, missing, savedCombos } = useNL();
  const engagement = useEngagement("combination", combo.id, savedCombos.has(combo.id));
  if (!catalog) return null;
  const Title = titleTag;
  const apply = [...combo.layers].reverse();
  const need = missing(combo);
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
        {member ? null : combo.potter?.mine ? (
          <span className="nl-note">♥ {plural(engagement.likes, "like")} on your result</span>
        ) : (
          <LikeButton kind="combination" id={combo.id} likes={engagement.likes} />
        )}
        {combo.potter && !member ? <Link className="nl-btn quiet" href={`/potters/${combo.potter.id}`}>{combo.potter.mine ? "Your portfolio" : combo.potter.name === "Unknown" ? "More from this potter" : `More from ${combo.potter.name}`}</Link> : null}
        {combo.url ? <a className="nl-btn quiet" href={combo.url} target="_blank" rel="noopener noreferrer">View on {combo.vendor} site ↗</a> : null}
      </div>
      {/* Only potters' results take comments; brand test tiles have nowhere to store them. */}
      {combo.potter ? <Comments kind="combination" id={combo.id} comments={engagement.comments} onAdd={engagement.addComment} readOnly={Boolean(member)} /> : null}
    </>
  );
}
