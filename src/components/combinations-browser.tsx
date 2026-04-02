"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { PostCard } from "@/components/post-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import type { CombinationPost, VendorCombinationExample } from "@/lib/types";
import { formatGlazeLabel } from "@/lib/utils";

type CombinationsView = "all" | "possible" | "mine";

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

function getLayerRoleLabel(example: VendorCombinationExample, layerOrder: number) {
  if (layerOrder === 0) {
    return "Top glaze";
  }

  if (layerOrder === example.layers.length - 1) {
    return layerOrder > 1 ? "Foundation layer" : "Base glaze";
  }

  return "Middle layer";
}

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
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const possibleExamples = useMemo(
    () => examples.filter((example) => example.viewerOwnsAllGlazes),
    [examples],
  );

  const filteredExamples = useMemo(() => {
    const source = view === "possible" ? possibleExamples : examples;

    return source.filter((example) => {
      if (!normalizedQuery) {
        return true;
      }

      return buildExampleSearchText(example).includes(normalizedQuery);
    });
  }, [examples, normalizedQuery, possibleExamples, view]);

  const filteredMyPosts = useMemo(
    () =>
      myPosts.filter((post) => {
        if (!normalizedQuery) {
          return true;
        }

        const glazeCopy = (post.glazes ?? []).map((glaze) => formatGlazeLabel(glaze).toLowerCase()).join(" ");

        return [post.caption ?? "", post.applicationNotes ?? "", post.firingNotes ?? "", glazeCopy]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [myPosts, normalizedQuery],
  );

  const filteredPublishedPosts = useMemo(
    () =>
      publishedPosts.filter((post) => {
        if (!normalizedQuery) {
          return true;
        }

        const glazeCopy = (post.glazes ?? []).map((glaze) => formatGlazeLabel(glaze).toLowerCase()).join(" ");

        return [post.caption ?? "", post.applicationNotes ?? "", post.firingNotes ?? "", glazeCopy]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, publishedPosts],
  );

  const activeExampleCount = view === "possible" ? possibleExamples.length : examples.length;

  return (
    <div className="space-y-6">
      <Panel className="space-y-4">
        <div className="flex items-center gap-3 border border-foreground/20 bg-white px-3 py-3 sm:px-4 sm:py-4">
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              view === "mine"
                ? "Search your published combinations by glaze, notes, or caption"
                : "Search by glaze code, glaze name, clay body, cone, or Mayco combo keyword"
            }
            className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted/75"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="neutral">
            {view === "mine"
              ? `${filteredMyPosts.length} published result${filteredMyPosts.length === 1 ? "" : "s"}`
              : view === "all"
                ? `${filteredExamples.length + filteredPublishedPosts.length} result${filteredExamples.length + filteredPublishedPosts.length === 1 ? "" : "s"}`
                : `${filteredExamples.length} example${filteredExamples.length === 1 ? "" : "s"}`}
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
              <Link
                href="/auth/sign-in"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Possible combinations
              </Link>
              <Link
                href="/auth/sign-in"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
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
              onClick={() => {
                setQuery("");
              }}
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

      {view === "mine" ? (
        filteredMyPosts.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredMyPosts.map((post) => (
              <div key={post.id} className="space-y-4">
                <PostCard post={post} />
                <div className="flex flex-wrap gap-3">
                  <Link href={`/combinations/${post.pairKey}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Open pair detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )
      ) : view === "all" ? (
        <div className="space-y-8">
          {filteredExamples.length ? (
            <section className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted">Imported reference wall</p>
                <h2 className="display-font mt-2 text-3xl tracking-tight">Mayco combinations</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredExamples.map((example) => (
                  <Link key={example.id} href={`/combinations/examples/${example.id}`}>
                    <Panel className="h-full space-y-4 transition hover:-translate-y-0.5 hover:bg-white">
                      <div className="relative aspect-[4/3] overflow-hidden border border-border bg-panel">
                        <Image
                          src={example.imageUrl}
                          alt={example.title}
                          fill
                          sizes="(min-width: 1280px) 28rem, (min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{example.sourceVendor}</Badge>
                        {example.cone ? <Badge tone="neutral">{example.cone}</Badge> : null}
                        {isGuest ? (
                          <Badge tone="neutral">Sign in to compare with your shelf</Badge>
                        ) : (
                          <Badge tone={example.viewerOwnsAllGlazes ? "success" : "accent"}>
                            {example.viewerOwnsAllGlazes
                              ? "You own every layer"
                              : `${example.viewerOwnedLayerCount}/${example.layers.length} owned`}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h2 className="display-font text-2xl tracking-tight">{example.title}</h2>
                        {example.clayBody ? (
                          <p className="mt-2 text-sm text-muted">{example.clayBody}</p>
                        ) : null}
                      </div>

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
                    </Panel>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {filteredPublishedPosts.length ? (
            <section className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted">Published member results</p>
                <h2 className="display-font mt-2 text-3xl tracking-tight">Community combinations</h2>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {filteredPublishedPosts.map((post) => (
                  <div key={post.id} className="space-y-4">
                    <PostCard post={post} />
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/combinations/${post.pairKey}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Open pair detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {!filteredExamples.length && !filteredPublishedPosts.length ? (
            <Panel>
              <h2 className="display-font text-3xl tracking-tight">No combinations match yet.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                Try a glaze code, glaze name, cone, or clay body to narrow the imported and published combinations.
              </p>
            </Panel>
          ) : null}
        </div>
      ) : filteredExamples.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredExamples.map((example) => (
            <Link key={example.id} href={`/combinations/examples/${example.id}`}>
              <Panel className="h-full space-y-4 transition hover:-translate-y-0.5 hover:bg-white">
                <div className="relative aspect-[4/3] overflow-hidden border border-border bg-panel">
                  <Image
                    src={example.imageUrl}
                    alt={example.title}
                    fill
                    sizes="(min-width: 1280px) 28rem, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{example.sourceVendor}</Badge>
                  {example.cone ? <Badge tone="neutral">{example.cone}</Badge> : null}
                  {isGuest ? (
                    <Badge tone="neutral">Sign in to compare with your shelf</Badge>
                  ) : (
                    <Badge tone={example.viewerOwnsAllGlazes ? "success" : "accent"}>
                      {example.viewerOwnsAllGlazes
                        ? "You own every layer"
                        : `${example.viewerOwnedLayerCount}/${example.layers.length} owned`}
                    </Badge>
                  )}
                </div>

                <div>
                  <h2 className="display-font text-2xl tracking-tight">{example.title}</h2>
                  {example.clayBody ? (
                    <p className="mt-2 text-sm text-muted">{example.clayBody}</p>
                  ) : null}
                </div>

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
              </Panel>
            </Link>
          ))}
        </div>
      ) : (
        <Panel>
          <h2 className="display-font text-3xl tracking-tight">No combinations match yet.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            {view === "possible"
              ? "There is not an imported Mayco example yet that only uses glazes currently on your shelf. Switch back to All combinations or add more glazes to your inventory."
              : "Try a glaze code, glaze name, cone, or clay body to narrow the imported Mayco combinations."}
          </p>
        </Panel>
      )}
    </div>
  );
}
