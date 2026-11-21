import Link from "next/link";

import { COLOR_SWATCH, swatch } from "@/lib/new-layout/colour";
import type { CollectionSummary } from "@/lib/new-layout/collections";
import type { NLCombo, NLGlaze } from "@/lib/new-layout/types";
import { Photo } from "./ui";

/**
 * Server-rendered tiles and link lists for the browse pages. Unlike the library's
 * cards (which open a side panel), these are plain links, so search engines and
 * people without JavaScript can follow them.
 */

export function GlazeTile({ glaze, note }: { glaze: NLGlaze; note?: string }) {
  const label = `${glaze.brand} ${glaze.code}`.trim();
  return (
    <article className="nl-card">
      <Link className="nl-card-main" href={`/glazes/${glaze.id}`}>
        <div className="nl-thumb" style={{ "--sw": swatch(glaze) } as React.CSSProperties}>
          <Photo src={glaze.photos[0]?.[0] ?? null} alt={`${label} ${glaze.name} glaze, fired`} />
        </div>
        <div className="nl-card-text">
          <span className="meta">{label}</span>
          <span className="name">{glaze.name}</span>
          {note || glaze.ft.length ? <span className="meta">{note ?? glaze.ft.slice(0, 3).join(" · ")}</span> : null}
        </div>
      </Link>
    </article>
  );
}

export function ComboTile({ combo, byId }: { combo: NLCombo; byId: Map<string, NLGlaze> }) {
  const layers = combo.layers.map((layer) => byId.get(layer.g)).filter((glaze): glaze is NLGlaze => Boolean(glaze));
  const name = layers.length ? layers.map((glaze) => `${glaze.code} ${glaze.name}`.trim()).join(" over ") : combo.title;
  return (
    <Link className="nl-ccard" href={`/combinations/examples/${combo.id}`}>
      <div className="nl-thumb"><Photo src={combo.image} alt={`${name}, fired combination`} /></div>
      <div className="nl-ccard-body">
        <span className="nl-ccard-name">{name}</span>
        <span className="nl-src">{combo.vendor} test tile</span>
      </div>
    </Link>
  );
}

export function CollectionLinks({ collections, showCount = true }: { collections: CollectionSummary[]; showCount?: boolean }) {
  return (
    <ul className="nl-browse-list">
      {collections.map((collection) => (
        <li key={collection.slug}>
          <Link className="nl-chip" href={`/cone-6-glazes/${collection.slug}`}>
            {collection.colour ? <span className="nl-dot" style={{ background: COLOR_SWATCH[collection.colour] }} /> : null}
            {collection.label}
            {/* Colour matching is generous (a teal counts as a blue), so a count there would overstate. */}
            {showCount && !collection.colour ? <span className="nl-muted nl-num">{collection.count}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Safe JSON-LD script tag ("<" is escaped so catalogue text can't close the tag). */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
