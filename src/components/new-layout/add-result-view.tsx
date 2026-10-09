"use client";
/* eslint-disable @next/next/no-img-element -- local previews of the person's own photos */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { submitContributionAction } from "@/app/actions/contribute";
import {
  getContributionImageBucket,
  MAX_CONTRIBUTION_IMAGE_BYTES,
  MAX_CONTRIBUTION_IMAGE_COUNT,
  sanitizeContributionImageName,
} from "@/lib/contribution-images";
import { matchesSearch, swatch } from "@/lib/new-layout/colour";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useNL } from "./provider";
import { Empty, glazeLabel, glazePhoto, Icon, Photo } from "./ui";

const CLAYS = ["White stoneware", "Buff stoneware", "Speckled buff", "Porcelain", "Red / brown stoneware", "Other"];

type Picked = { file: File; preview: string };

/** Add a firing result in three steps: photos, glazes in the order applied, details. */
export function AddResultView({ userId, preselect, disabled }: { userId: string; preselect: string | null; disabled: boolean }) {
  const router = useRouter();
  const { catalog, owned } = useNL();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<Picked[]>([]);
  // Application order: base coat first. Sent to the server top layer first.
  const [layers, setLayers] = useState<string[]>(() => (preselect ? [preselect] : []));
  const [query, setQuery] = useState("");
  const [clay, setClay] = useState(CLAYS[0]);
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [kiln, setKiln] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => () => photos.forEach((photo) => URL.revokeObjectURL(photo.preview)), [photos]);

  const picks = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim();
    const pool = q ? catalog.glazes.filter((glaze) => matchesSearch(glaze.s, q)) : [...owned].map((id) => catalog.byId.get(id)).filter((glaze) => glaze !== undefined);
    return pool.filter((glaze) => !layers.includes(glaze.id)).slice(0, 8);
  }, [catalog, layers, owned, query]);

  const addFiles = (files: FileList | File[]) => {
    const next: Picked[] = [];
    for (const file of [...files]) {
      if (!file.type.startsWith("image/")) { setError("That file isn't an image. Choose a JPG or PNG."); continue; }
      if (file.size > MAX_CONTRIBUTION_IMAGE_BYTES) { setError("Each photo must be under 8 MB."); continue; }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    if (next.length) setError(null);
    setPhotos((current) => [...current, ...next].slice(0, MAX_CONTRIBUTION_IMAGE_COUNT));
  };

  const move = (index: number, by: number) => setLayers((current) => {
    const copy = [...current];
    [copy[index], copy[index + by]] = [copy[index + by], copy[index]];
    return copy;
  });

  const next = () => {
    if (step === 1 && !photos.length) { setError("Add at least one photo of your tile."); return; }
    if (step === 2 && !layers.length) { setError("Add at least one glaze."); return; }
    setError(null);
    setStep(step + 1);
  };

  const submit = () => {
    setError(null);
    const topFirst = [...layers].reverse();
    const data = new FormData();
    data.append("coneValue", "Cone 6");
    data.append("atmosphere", "oxidation");
    topFirst.forEach((id) => data.append("glazeIds", id));
    if (topFirst.length >= 2) {
      if (method.trim()) data.append("glazingProcess", method.trim());
      if (notes.trim()) data.append("notes", notes.trim());
      if (kiln.trim()) data.append("kilnNotes", kiln.trim());
      data.append("clayBody", clay);
    } else if (notes.trim()) {
      data.append("label", notes.trim().slice(0, 80));
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) { setError("Photo uploads aren't available right now. Please try again later."); return; }
      const bucket = getContributionImageBucket(topFirst.length);
      const uploaded: string[] = [];
      const cleanUp = async () => { if (uploaded.length) await supabase.storage.from(bucket).remove(uploaded); };
      try {
        for (const { file } of photos) {
          const path = `${userId}/${crypto.randomUUID()}-${sanitizeContributionImageName(file.name)}`;
          const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
          if (uploadError) { setError(`Couldn't upload your photo: ${uploadError.message}`); await cleanUp(); return; }
          uploaded.push(path);
          data.append("uploadedImagePaths", path);
        }
        const result = await submitContributionAction(data);
        if ("error" in result) { await cleanUp(); setError(result.error); return; }
        router.push(result.redirectTo);
      } catch {
        await cleanUp();
        setError("We couldn't post your result. Your details are still here, so please try again.");
      }
    });
  };

  if (disabled) {
    return <Empty title="Posting is turned off for your account" action={<Link className="nl-btn" href="/profile?tab=chats">Message us</Link>}>Your account can&apos;t post results right now. Send us a message if you think this is a mistake.</Empty>;
  }

  const titles = ["Add photos of your tile", "Which glazes did you use?", "Firing details"];
  return (
    <div className="nl-detail-page">
      <div className="nl-eyebrow">Add a result · step {step} of 3</div>
      <div className="nl-progress" aria-hidden="true">{[1, 2, 3].map((n) => <span key={n} className={n <= step ? "on" : ""} />)}</div>
      <h1 tabIndex={-1}>{titles[step - 1]}</h1>

      {step === 1 ? (
        <>
          <label
            className={`nl-drop ${dragOver ? "over" : ""}`}
            htmlFor="nl-photos"
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => { event.preventDefault(); setDragOver(false); addFiles(event.dataTransfer.files); }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 17-5-5-8 7" /></svg>
            <span><b>{photos.length ? "Add another photo" : "Choose photos of your tile"}</b><br /><span className="nl-muted">or drop them here · up to {MAX_CONTRIBUTION_IMAGE_COUNT}, 8 MB each</span></span>
          </label>
          <input className="nl-sr" type="file" id="nl-photos" accept="image/*" multiple onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
          {photos.length ? (
            <div className="nl-photos">
              {photos.map((photo, i) => (
                <figure key={photo.preview}>
                  <img src={photo.preview} alt={`Photo ${i + 1}`} />
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((current) => current.filter((_, j) => j !== i))}>✕</button>
                </figure>
              ))}
            </div>
          ) : null}
          <p className="nl-note">Results are shared with other potters. A clear photo in daylight shows the colour best.</p>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className="nl-field">
            <span className="lab">Layers, in the order you applied them</span>
            {layers.length ? (
              <ol className="nl-steps">
                {layers.map((id, i) => {
                  const glaze = catalog?.byId.get(id);
                  if (!glaze) return null;
                  return (
                    <li key={id} className="nl-step">
                      <span className="k">{i + 1}</span>
                      <span className="nl-mini" style={{ "--sw": swatch(glaze) } as React.CSSProperties}><Photo src={glazePhoto(glaze)} /></span>
                      <span className="st"><b>{glaze.name}</b><span>{glazeLabel(glaze)} · {i === 0 ? "base coat" : `over layer ${i}`}</span></span>
                      <span className="nl-step-acts">
                        <button type="button" className="nl-icon-btn" disabled={i === 0} aria-label={`Move ${glaze.name} earlier`} onClick={() => move(i, -1)}><Icon name="up" /></button>
                        <button type="button" className="nl-icon-btn" disabled={i === layers.length - 1} aria-label={`Move ${glaze.name} later`} onClick={() => move(i, 1)}><Icon name="down" /></button>
                        <button type="button" className="nl-icon-btn" aria-label={`Remove ${glaze.name}`} onClick={() => setLayers((current) => current.filter((item) => item !== id))}><Icon name="close" /></button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="nl-note">No glazes yet. Search below and tap to add, starting with the base coat.</p>}
          </div>
          {layers.length < 4 ? (
            <div className="nl-field">
              <label htmlFor="pick-q">Add a glaze</label>
              <input id="pick-q" className="nl-input" autoComplete="off" placeholder="Name or code, e.g. SW-402" value={query} onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && picks[0]) { event.preventDefault(); setLayers((current) => [...current, picks[0].id]); setQuery(""); } }} />
              <div className="nl-picker">
                {!query.trim() && picks.length ? <span className="nl-note">From your shelf</span> : null}
                {picks.map((glaze) => (
                  <button key={glaze.id} type="button" className="nl-pick" onClick={() => { setLayers((current) => [...current, glaze.id]); setQuery(""); }}>
                    <span className="nl-mini" style={{ "--sw": swatch(glaze) } as React.CSSProperties} />
                    <span className="pt"><b>{glaze.name}</b><span>{glazeLabel(glaze)}</span></span>
                  </button>
                ))}
                {query.trim() && !picks.length ? <span className="nl-note">No glaze matches “{query}”.</span> : null}
              </div>
            </div>
          ) : <p className="nl-note">That&apos;s the most layers a result can have.</p>}
        </>
      ) : null}

      {step === 3 ? (
        <>
          <div className="nl-facts"><span className="nl-fact">Cone 6 · oxidation</span><span className="nl-fact">{layers.length === 1 ? "1 glaze" : `${layers.length} layers`}</span></div>
          {layers.length >= 2 ? (
            <>
              <div className="nl-field"><label htmlFor="clay">Clay body</label>
                <select id="clay" value={clay} onChange={(event) => setClay(event.target.value)}>{CLAYS.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="nl-field"><label htmlFor="method">How you applied it <span className="nl-muted">(optional)</span></label>
                <input id="method" className="nl-input" value={method} onChange={(event) => setMethod(event.target.value)} placeholder="e.g. Dipped 3 s, then brushed 2 coats" /></div>
              <div className="nl-field"><label htmlFor="notes">Notes <span className="nl-muted">(optional)</span></label>
                <textarea id="notes" className="nl-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Where it ran, how thick, what you'd change" /></div>
              <div className="nl-field"><label htmlFor="kiln">Kiln notes <span className="nl-muted">(optional)</span></label>
                <input id="kiln" className="nl-input" value={kiln} onChange={(event) => setKiln(event.target.value)} placeholder="e.g. Slow cool, top shelf" /></div>
            </>
          ) : (
            <div className="nl-field"><label htmlFor="notes">Photo label <span className="nl-muted">(optional)</span></label>
              <input id="notes" className="nl-input" maxLength={80} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="e.g. 3 coats on speckled buff" /></div>
          )}
        </>
      ) : null}

      {error ? <p className="nl-error" role="alert">{error}</p> : null}
      <div className="nl-form-foot">
        {step > 1 ? <button type="button" className="nl-btn quiet" disabled={pending} onClick={() => { setError(null); setStep(step - 1); }}>Back</button> : <Link className="nl-btn quiet" href="/combinations">Cancel</Link>}
        {step < 3
          ? <button type="button" className="nl-btn primary" onClick={next}>Continue</button>
          : <button type="button" className="nl-btn primary" disabled={pending} onClick={submit}>{pending ? "Posting…" : "Post result"}</button>}
      </div>
    </div>
  );
}
