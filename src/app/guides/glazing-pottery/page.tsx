import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { getBaseUrl } from "@/lib/env";

import { GUIDE_PARTS } from "./guide-data";

export const metadata: Metadata = {
  title: "The Complete Guide to Glazing Pottery",
  description:
    "A deeply-referenced, comprehensive guide to ceramic glaze application, layering, decorative techniques, troubleshooting, and international traditions.",
  alternates: { canonical: "/guides/glazing-pottery" },
};

function GuideJsonLd() {
  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    name: "The Complete Guide to Glazing Pottery",
    description:
      "A deeply-referenced, comprehensive guide to ceramic glaze application, layering, decorative techniques, troubleshooting, and international traditions.",
    author: { "@type": "Organization", name: "Glaze Library" },
    publisher: { "@type": "Organization", name: "Glaze Library" },
    mainEntityOfPage: `${baseUrl}/guides/glazing-pottery`,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function GlazingPotteryGuidePage() {
  return (
    <div className="space-y-8">
      <GuideJsonLd />

      <PageHeader
        eyebrow="Guide"
        title="The Complete Guide to Glazing Pottery"
        description="A deeply-referenced guide to glaze application, layering, surface techniques, troubleshooting, and international ceramic traditions. Built from books, manufacturer data, academic research, and practitioner knowledge."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDE_PARTS.map((part) => (
          <GuidePartCard key={part.slug} part={part} />
        ))}
      </div>

      <Panel className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          About this guide
        </p>
        <p className="text-sm leading-7 text-muted">
          Every factual claim in this guide is backed by a specific reference —
          book and page number, manufacturer document, academic paper, or museum
          source. Content was researched in parallel by multiple AI models
          (Claude, GPT, Grok) and arbitrated by the Glaze Library team. Where
          advice varies by cone range, clay body, or kiln type, we say so.
        </p>
        <p className="text-sm leading-7 text-muted">
          This is a living document. New sections and deeper coverage are added
          regularly. If you spot an error or know a source we should include,{" "}
          <Link href="/auth/sign-in" className="underline hover:text-foreground">
            let us know
          </Link>
          .
        </p>
      </Panel>
    </div>
  );
}

function GuidePartCard({
  part,
}: {
  part: (typeof GUIDE_PARTS)[number];
}) {
  const isLive = part.status === "live";

  const content = (
    <Panel
      className={`flex h-full flex-col gap-3 transition-colors ${
        isLive ? "hover:bg-tile-hover" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
          Part {part.number}
        </span>
        {!isLive ? (
          <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
            Coming soon
          </span>
        ) : null}
      </div>
      <h2 className="display-font text-lg leading-tight tracking-tight">
        {part.title}
      </h2>
      <p className="mt-auto text-[13px] leading-6 text-muted">
        {part.description}
      </p>
    </Panel>
  );

  if (!isLive) return content;

  return (
    <Link
      href={`/guides/glazing-pottery/${part.slug}`}
      className="no-underline"
    >
      {content}
    </Link>
  );
}
