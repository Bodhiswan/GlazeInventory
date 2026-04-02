"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import type { CombinationPost, VendorCombinationExample } from "@/lib/types";
import { formatGlazeLabel } from "@/lib/utils";

type CombinationsView = "all" | "possible" | "mine";

/* ---------------------------------------------------------------------------
 * Unified tile type — wraps both Mayco examples and published posts so
 * they render identically in the compact grid.
 * ------------------------------------------------------------------------ */
type TileKind = "example" | "post";

interface CombinationTile {
  id: string;
  kind: TileKind;
  imageUrl: string | null;
  title: string;
  subtitle: string | null;
  cone: string | null;
  badgeTone: "success" | "accent" | "neutral";
  badgeLabel: string;
  searchText: string;
  /* original payloads for the detail modal */
  example: VendorCombinationExample | null;
  post: CombinationPost | null;
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */

function buildExampleSearchText(example: VendorCombinationExample) {
  return [
    example.sourceVendor,
    example.sourceCollection,
    example.title,
    example.cone,
    example.atmosphere,
    example.clayBody,
    example.applicationNotes,
    example.firingNotes,
    ...example.layers.flatMap((layer) => [
      layer.glazeCode,
      layer.glazeName,
      layer.glaze ? formatGlazeLabel(layer.glaze) : null,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildPostSearchText(post: CombinationPost) {
  const glazeCopy = (post.glazes ?? []).map((glaze) => formatGlazeLabel(glaze).toLowerCase()).join(" ");
  return [post.caption ?? "", post.applicationNotes ?? "", post.firingNotes ?? "", glazeCopy]
    .join(" ")
    .toLowerCase();
}

function getLayerRoleLabel(example: VendorCombinationExample, layerOrder: number) {
  if (layerOrder === 0) return "Top glaze";
  if (layerOrder === example.layers.length - 1) return layerOrder > 1 ? "Foundation layer" : "Base glaze";
  return "Middle layer";
}

function exampleToTile(example: VendorCombinationExample, isGuest: boolean): CombinationTile {
  return {
    id: `example-${example.id}`,
    kind: "example",
    imageUrl: example.imageUrl,
    title: example.title,
    subtitle: example.sourceVendor,
    cone: example.cone ?? null,
    badgeTone: isGuest ? "neutral" : example.viewerOwnsAllGlazes ? "success" : "accent",
    badgeLabel: isGuest
      ? "Sign in to compare"
      : example.viewerOwnsAllGlazes
        ? "All owned"
        : `${example.viewerOwnedLayerCount}/${example.layers.length} owned`,
    searchText: buildExampleSearchText(example),
    example,
    post: null,
  };
}

function postToTile(post: CombinationPost, label: string): CombinationTile {
  const imageSrc = typeof post.imagePath === "string" && post.imagePath.trim() ? post.imagePath : null;
  const glazeNames = (post.glazes ?? []).map((g) => formatGlazeLabel(g)).join(" + ");

  return {
    id: `post-${post.id}`,
    kind: "post",
    imageUrl: imageSrc,
    title: glazeNames || "Glaze combination",
    subtitle: label,
    cone: null,
    badgeTone: "neutral",
    badgeLabel: label,
    searchText: buildPostSearchText(post),
    example: null,
    post,
  };
}

/* ---------------------------------------------------------------------------
 * Detail modal for a Mayco example
 * ------------------------------------------------------------------------ */

function ExampleDetail({ example }: { example: VendorCombinationExample }) {
  return (
    <div className="space-y-5">
      <div className="mx-auto w-full max-w-[400px] overflow-hidden border border-border bg-panel">
        <Image
          src={example.imageUrl}
          alt={example.title}
          width={400}
          height={300}
          sizes="(min-width: 640px) 400px, 100vw"
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="neutral">{example.sourceVendor}</Badge>
        {example.cone ? <Badge tone="neutral">{example.cone}</Badge> : null}
        {example.atmosphere ? <Badge tone="neutral">{example.atmosphere}</Badge> : null}
      </div>

      {example.clayBody ? (
        <div className="text-sm text-muted">
          <span className="font-semibold text-foreground">Clay body:</span> {example.clayBody}
        </div>
      ) : null}

      <div className="grid gap-3">
        {example.layers.map((layer) => (
          <div key={layer.id} className="border border-border bg-panel px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              {getLayerRoleLabel(example, layer.layerOrder)}
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {layer.glaze ? formatGlazeLabel(layer.glaze) : [layer.glazeCode, layer.glazeName].filter(Boolean).join(" ")}
            </p>
            {layer.connectorToNext ? (
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                {layer.connectorToNext} next layer
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {example.applicationNotes ? (
        <p className="text-sm leading-6 text-muted">
          <span className="font-semibold text-foreground">Application:</span> {example.applicationNotes}
        </p>
      ) : null}

      {example.firingNotes ? (
        <p className="text-sm leading-6 text-muted">
          <span className="font-semibold text-foreground">Firing:</span> {example.firingNotes}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={`/combinations/examples/${example.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full sm:w-auto" })}
        >
          Open full example page
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Detail modal for a published post
 * ------------------------------------------------------------------------ */

function PostDetail({ post }: { post: CombinationPost }) {
  const imageSrc = typeof post.imagePath === "string" && post.imagePath.trim() ? post.imagePath : null;

  return (
    <div className="space-y-5">
      {imageSrc ? (
        <div className="mx-auto w-full max-w-[400px] overflow-hidden border border-border bg-panel">
          <img
            src={imageSrc}
            alt={post.caption ?? "Published glaze combination"}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="text-sm text-muted">
        <span className="font-semibold text-foreground">By:</span> {post.authorName}
      </div>

      {post.glazes?.length ? (
        <div className="grid gap-3">
          {post.glazes.map((glaze) => (
            <div key={glaze.id} className="border border-border bg-panel px-3 py-3">
              <p className="font-semibold text-foreground">{formatGlazeLabel(glaze)}</p>
              {(glaze.communityTags ?? []).filter((t) => t.voteCount > 0).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(glaze.communityTags ?? [])
                    .filter((t) => t.voteCount > 0)
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .slice(0, 3)
                    .map((tag) => (
                      <Badge key={`${glaze.id}-${tag.slug}`} tone="neutral" className="normal-case tracking-[0.08em]">
                        {tag.label} {tag.voteCount}
                      </Badge>
                    ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {post.caption ? <p className="text-sm leading-6 text-foreground/90">{post.caption}</p> : null}

      {post.applicationNotes ? (
        <p className="text-sm leading-6 text-muted">
          <span className="font-semibold text-foreground">Application:</span> {post.applicationNotes}
        </p>
      ) : null}

      {post.firingNotes ? (
        <p className="text-sm leading-6 text-muted">
          <span className="font-semibold text-foreground">Firing:</span> {post.firingNotes}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={`/combinations/${post.pairKey}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full sm:w-auto" })}
        >
          Open pair detail
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main browser component
 * ------------------------------------------------------------------------ */

export function CombinationsBrowser({
  examples,
  publishedPosts,
  myPosts,
  isGuest,
  initialView = "all",
}: {
  examples: VendorCombinationExample[];
  publishedPosts: CombinationPost[];
  myPosts: CombinationPost[];
  isGuest: boolean;
  initialView?: CombinationsView;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<CombinationsView>(initialView);
  const [activeTileId, setActiveTileId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  /* --- build unified tile lists ----------------------------------------- */

  const exampleTiles = useMemo(
    () => examples.map((e) => exampleToTile(e, isGuest)),
    [examples, isGuest],
  );

  const possibleExampleTiles = useMemo(
    () => exampleTiles.filter((t) => t.example?.viewerOwnsAllGlazes),
    [exampleTiles],
  );

  const communityPostTiles = useMemo(
    () => publishedPosts.map((p) => postToTile(p, "Community")),
    [publishedPosts],
  );

  const myPostTiles = useMemo(
    () => myPosts.map((p) => postToTile(p, "Mine")),
    [myPosts],
  );

  /* --- apply search & view filter --------------------------------------- */

  const activeTiles = useMemo(() => {
    let tiles: CombinationTile[];

    if (view === "mine") {
      tiles = myPostTiles;
    } else if (view === "possible") {
      tiles = possibleExampleTiles;
    } else {
      tiles = [...exampleTiles, ...communityPostTiles];
    }

    if (!normalizedQuery) return tiles;
    return tiles.filter((tile) => tile.searchText.includes(normalizedQuery));
  }, [view, normalizedQuery, exampleTiles, possibleExampleTiles, communityPostTiles, myPostTiles]);

  const activeTile = useMemo(
    () => activeTiles.find((t) => t.id === activeTileId) ?? null,
    [activeTiles, activeTileId],
  );

  const activeExampleCount = view === "possible" ? possibleExampleTiles.length : exampleTiles.length;

  return (
    <div className="space-y-6">
      {/* search + view tabs */}
      <Panel className="space-y-4">
        <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-3 sm:px-4 sm:py-4">
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              view === "mine"
                ? "Search your published combinations by glaze, notes, or caption"
                : "Search by glaze code, glaze name, clay body, cone, or keyword"
            }
            className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="neutral">
            {activeTiles.length} result{activeTiles.length === 1 ? "" : "s"}
          </Badge>
          <Link
            href="/combinations"
            aria-current={view === "all" ? "page" : undefined}
            className={buttonVariants({
              variant: view === "all" ? "primary" : "ghost",
              size: "sm",
            })}
            onClick={() => setView("all")}
          >
            All combinations
          </Link>
          {isGuest ? (
            <>
              <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Possible combinations
              </Link>
              <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                My combinations
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/combinations?view=possible"
                aria-current={view === "possible" ? "page" : undefined}
                className={buttonVariants({
                  variant: view === "possible" ? "primary" : "ghost",
                  size: "sm",
                })}
                onClick={() => setView("possible")}
              >
                Possible combinations
              </Link>
              <Link
                href="/combinations?view=mine"
                aria-current={view === "mine" ? "page" : undefined}
                className={buttonVariants({
                  variant: view === "mine" ? "primary" : "ghost",
                  size: "sm",
                })}
                onClick={() => setView("mine")}
              >
                My combinations
              </Link>
            </>
          )}
          {query.trim() ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Clear search
            </button>
          ) : null}
        </div>

        {!isGuest && view === "possible" ? (
          <p className="text-sm leading-6 text-muted">
            Showing imported Mayco examples where every matched glaze is already on your shelf.
            {activeExampleCount
              ? " These are the combinations you can test right now."
              : " Add more glazes to your inventory or switch back to All combinations for broader inspiration."}
          </p>
        ) : null}

        {!isGuest && view === "mine" ? (
          <p className="text-sm leading-6 text-muted">
            Showing only the combinations you published. Use this tab as your own running archive
            of fired tests and notes.
          </p>
        ) : null}
      </Panel>

      {/* tile grid */}
      {activeTiles.length ? (
        <div className="overflow-hidden border border-border bg-panel">
          <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              {view === "all" ? "All combinations" : view === "possible" ? "Possible combinations" : "My combinations"}
            </p>
            <Badge tone="neutral">{activeTiles.length}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1.5 min-[420px]:grid-cols-3 sm:gap-2 sm:p-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {activeTiles.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => setActiveTileId(tile.id)}
                className="group relative z-0 overflow-visible border border-border bg-white text-left transition-transform duration-200 hover:z-20 hover:scale-[1.02] focus-visible:z-20 focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/20"
                style={{ contentVisibility: "auto", containIntrinsicSize: "220px" }}
              >
                <div className="space-y-1.5 p-1.5 sm:p-2">
                  <div className="relative overflow-hidden border border-border bg-panel">
                    {tile.imageUrl ? (
                      <img
                        src={tile.imageUrl}
                        alt={tile.title}
                        className="aspect-square w-full object-cover bg-white transition duration-200"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-xs uppercase tracking-[0.18em] text-muted">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {tile.subtitle ? (
                      <p className="text-[9px] uppercase tracking-[0.18em] text-muted sm:text-[10px]">
                        {tile.subtitle}
                      </p>
                    ) : null}
                    <h4 className="line-clamp-2 text-[13px] font-semibold leading-5 text-foreground sm:text-sm">
                      {tile.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {tile.cone ? <Badge tone="neutral">{tile.cone}</Badge> : null}
                    <Badge tone={tile.badgeTone}>{tile.badgeLabel}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : view === "mine" && !myPosts.length ? (
        <Panel>
          <h2 className="display-font text-3xl tracking-tight">No published combinations yet.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Publish a result to start your own combinations archive here. Once you add photos and
            notes, this tab becomes the quickest way to revisit what you have already tested.
          </p>
          <div className="mt-5">
            <Link href="/publish" className={buttonVariants({})}>
              Publish your first result
            </Link>
          </div>
        </Panel>
      ) : (
        <Panel>
          <h2 className="display-font text-3xl tracking-tight">No combinations match yet.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            {view === "possible"
              ? "There is not an imported Mayco example yet that only uses glazes currently on your shelf. Switch back to All combinations or add more glazes to your inventory."
              : "Try a glaze code, glaze name, cone, or clay body to narrow the results."}
          </p>
        </Panel>
      )}

      {/* detail modal overlay */}
      {activeTile ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#2d1c16]/35 p-2 sm:items-center sm:p-4"
          onClick={() => setActiveTileId(null)}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden border border-border bg-background sm:mt-[6vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
              <div>
                {activeTile.subtitle ? (
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{activeTile.subtitle}</p>
                ) : null}
                <h3 className="mt-1 text-2xl font-semibold text-foreground">{activeTile.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTileId(null)}
                className="inline-flex h-10 w-10 items-center justify-center border border-border bg-white text-foreground transition hover:-translate-y-px"
                aria-label="Close combination details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
              {activeTile.example ? (
                <ExampleDetail example={activeTile.example} />
              ) : activeTile.post ? (
                <PostDetail post={activeTile.post} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
