import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { GuideToc } from "@/components/guide/guide-toc";
import { GuideTocMobile } from "@/components/guide/guide-toc";

import { GUIDE_PARTS, getGuidePart } from "../guide-data";
import { ApplicationContent, applicationToc } from "./application-content";
import { FoundationsContent, foundationsToc } from "./foundations-content";
import { LayeringContent, layeringToc } from "./layering-content";
import {
  TroubleshootingContent,
  troubleshootingToc,
} from "./troubleshooting-content";

/* ── Content registry ── */

const CONTENT: Record<
  string,
  {
    toc: { id: string; label: string; level: 2 | 3 }[];
    Component: React.ComponentType;
  }
> = {
  application: { toc: applicationToc, Component: ApplicationContent },
  foundations: { toc: foundationsToc, Component: FoundationsContent },
  layering: { toc: layeringToc, Component: LayeringContent },
  troubleshooting: {
    toc: troubleshootingToc,
    Component: TroubleshootingContent,
  },
};

/* ── Static params ── */

export function generateStaticParams() {
  return GUIDE_PARTS.filter((p) => p.status === "live").map((p) => ({
    slug: p.slug,
  }));
}

/* ── Metadata ── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const part = getGuidePart(slug);
  if (!part || part.status !== "live") return {};

  return {
    title: `${part.title} — The Complete Guide to Glazing Pottery`,
    description: part.description,
    alternates: { canonical: `/guides/glazing-pottery/${slug}` },
  };
}

/* ── Prev / Next navigation ── */

function getPrevNext(slug: string) {
  const liveParts = GUIDE_PARTS.filter((p) => p.status === "live");
  const idx = liveParts.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? liveParts[idx - 1] : null,
    next: idx < liveParts.length - 1 ? liveParts[idx + 1] : null,
  };
}

/* ── Page ── */

export default async function GuideSubpage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const part = getGuidePart(slug);
  if (!part || part.status !== "live") notFound();

  const entry = CONTENT[slug];
  if (!entry) notFound();

  const { toc, Component } = entry;
  const { prev, next } = getPrevNext(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    name: `${part.title} — The Complete Guide to Glazing Pottery`,
    description: part.description,
    author: { "@type": "Organization", name: "Glaze Library" },
    publisher: { "@type": "Organization", name: "Glaze Library" },
    isPartOf: {
      "@type": "Article",
      name: "The Complete Guide to Glazing Pottery",
      url: "/guides/glazing-pottery",
    },
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-[13px] text-muted">
        <Link
          href="/guides/glazing-pottery"
          className="underline hover:text-foreground"
        >
          Glazing Pottery Guide
        </Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">Part {part.number}</span>
      </nav>

      <PageHeader
        eyebrow={`Part ${part.number}`}
        title={part.title}
        description={part.description}
      />

      {/* Mobile TOC */}
      <GuideTocMobile items={toc} />

      {/* Main layout: content + sticky sidebar TOC */}
      <div className="flex gap-10">
        <article className="min-w-0 max-w-3xl flex-1 space-y-10">
          <Component />
        </article>

        <aside className="hidden w-56 shrink-0 lg:block">
          <GuideToc items={toc} />
        </aside>
      </div>

      {/* Prev / Next navigation */}
      <nav className="flex items-center justify-between border-t border-border pt-6">
        {prev ? (
          <Link
            href={`/guides/glazing-pottery/${prev.slug}`}
            className="group flex flex-col gap-1"
          >
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
              ← Previous
            </span>
            <span className="text-sm group-hover:text-foreground text-muted">
              Part {prev.number}: {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/guides/glazing-pottery/${next.slug}`}
            className="group flex flex-col items-end gap-1"
          >
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
              Next →
            </span>
            <span className="text-sm group-hover:text-foreground text-muted">
              Part {next.number}: {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
