import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionLinks, ComboTile, GlazeTile, JsonLd } from "@/components/new-layout/browse";
import { getBaseUrl } from "@/lib/env";
import { getCone6Catalog } from "@/lib/new-layout/catalog";
import { COLLECTION_PAGE_SIZE, getCollection, getComboCount, type Collection } from "@/lib/new-layout/collections";

const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const plural = (count: number, one: string, many = `${one}s`) => `${count.toLocaleString("en")} ${count === 1 ? one : many}`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Glazes not found" };
  const image = collection.glazes.map((glaze) => glaze.photos[0]?.[0]).find((url) => url?.startsWith("http"));
  return {
    title: collection.metaTitle,
    description: collection.metaDescription,
    alternates: { canonical: `/cone-6-glazes/${collection.slug}` },
    openGraph: {
      title: collection.metaTitle,
      description: collection.metaDescription,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

/** A sentence or two of facts about the list, worked out from the catalogue. */
function describe(collection: Collection) {
  const { facts, count } = collection;
  const sentences: string[] = [];
  const brands = facts.brands;
  if (collection.kind === "brand" || collection.kind === "line") {
    const colours = facts.colours.slice(0, 3).map(([label]) => label.toLowerCase());
    if (colours.length) sentences.push(`${plural(count, "glaze")}, mostly ${list(colours)} in the fired photos.`);
    else sentences.push(`${plural(count, "glaze")}.`);
  } else if (brands.length > 1) {
    const what = collection.colour
      ? `${plural(count, "glaze")} with ${collection.colour.toLowerCase()} or a neighbouring shade in the fired photo or the maker's description,`
      : plural(count, "glaze");
    sentences.push(`${what} from ${plural(brands.length, "brand")}, most of them from ${list(brands.slice(0, 3).map(([brand, n]) => `${brand} (${n})`))}.`);
  } else {
    sentences.push(`${plural(count, "glaze")} from ${brands[0]?.[0] ?? "one brand"}.`);
  }
  const finishes = facts.finishes.slice(0, 3).map(([label, n]) => `${label.toLowerCase()} (${n})`);
  if (collection.kind !== "finish" && finishes.length) sentences.push(`The makers most often describe them as ${list(finishes)}.`);
  if (facts.withCombos && collection.slug !== "best-for-layering") {
    sentences.push(`${facts.withCombos === count ? "All of them appear" : `${facts.withCombos.toLocaleString("en")} of them appear`} in at least one manufacturer layering combination.`);
  }
  return sentences.join(" ");
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/cone-6-glazes/${collection.slug}`;
  const shown = collection.glazes.slice(0, COLLECTION_PAGE_SIZE);
  const remaining = collection.count - shown.length;
  const byId = new Map(getCone6Catalog().glazes.map((glaze) => [glaze.id, glaze]));
  const layering = collection.slug === "best-for-layering" || collection.slug === "reactive";

  return (
    <div className="nl-browse">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Cone 6 glazes", item: `${baseUrl}/glazes` },
              { "@type": "ListItem", position: 2, name: "Browse", item: `${baseUrl}/cone-6-glazes` },
              { "@type": "ListItem", position: 3, name: collection.title, item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: collection.title,
            description: collection.metaDescription,
            url,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: collection.count,
              itemListElement: shown.slice(0, 30).map((glaze, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: `${glaze.brand} ${glaze.code} ${glaze.name}`.replace(/\s+/g, " ").trim(),
                url: `${baseUrl}/glazes/${glaze.id}`,
              })),
            },
          },
        ]}
      />

      <div className="nl-browse-head">
        <ol className="nl-crumbs" aria-label="Breadcrumb">
          <li><Link href="/glazes">Cone 6 glazes</Link></li>
          <li><Link href="/cone-6-glazes">Browse</Link></li>
          <li aria-current="page">{collection.label}</li>
        </ol>
        <h1>{collection.title}</h1>
        <p>{collection.blurb}</p>
        <p className="nl-muted">{describe(collection)}</p>
      </div>

      <section className="nl-browse-section" aria-label={collection.title}>
        <p className="nl-note">
          {remaining > 0 ? `Showing ${shown.length} of ${collection.count.toLocaleString("en")}. ` : ""}{collection.orderNote}
        </p>
        <div className="nl-grid">
          {shown.map((glaze) => (
            <GlazeTile key={glaze.id} glaze={glaze} note={layering ? plural(getComboCount(glaze.id), "combination") : undefined} />
          ))}
        </div>
        <div className="nl-browse-more">
          <Link className="nl-btn" href={collection.libraryHref}>
            {remaining > 0 ? `See all ${collection.count.toLocaleString("en")} in the library` : "Open these in the library"}
          </Link>
          <span className="nl-note">Filter further, mark what&apos;s on your shelf, and see which combinations you can make.</span>
        </div>
      </section>

      {collection.combos.length ? (
        <section className="nl-browse-section" aria-labelledby="browse-combos">
          <h2 id="browse-combos">Combinations that use these glazes</h2>
          <p className="nl-muted">
            {plural(collection.comboTotal, "manufacturer test tile")} in the library layer at least one of these glazes with another.
            A few to start with:
          </p>
          <div className="nl-cgrid">
            {collection.combos.map((combo) => <ComboTile key={combo.id} combo={combo} byId={byId} />)}
          </div>
          <div className="nl-browse-more">
            <Link className="nl-btn" href="/combinations">Browse all Cone 6 combinations</Link>
          </div>
        </section>
      ) : null}

      <section className="nl-browse-section" aria-labelledby="browse-tips">
        <h2 id="browse-tips">Before you pick one</h2>
        <ul className="nl-tips">
          <li>Check the cone on the jar against your clay and your kiln. Everything on this page is rated for cone 5–6 (midfire), which is not the same as cone 06.</li>
          <li>The photos are the makers&apos; own test tiles, fired in an electric kiln. Your clay body, thickness and firing will shift the result, so fire a test tile first.</li>
          <li>For mugs, bowls and plates, read the label for food-contact guidance, and remember that layering two glazes can change it.</li>
        </ul>
        <p>
          <Link className="nl-link" href="/guides/glazing-pottery/choosing-a-glaze">How to choose a glaze: the full guide</Link>
        </p>
      </section>

      {collection.related.length ? (
        <section className="nl-browse-section" aria-labelledby="browse-related">
          <h2 id="browse-related">Related</h2>
          <CollectionLinks collections={collection.related} />
          <p><Link className="nl-link" href="/cone-6-glazes">All colours, finishes, types and brands</Link></p>
        </section>
      ) : null}
    </div>
  );
}
