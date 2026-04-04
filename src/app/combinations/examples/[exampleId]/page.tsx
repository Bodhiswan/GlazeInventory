import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getVendorCombinationExample, requireViewer } from "@/lib/data";
import type { VendorCombinationExample } from "@/lib/types";
import { formatGlazeLabel, formatGlazeMeta } from "@/lib/utils";

function getLayerRoleLabel(example: VendorCombinationExample, layerOrder: number) {
  if (layerOrder === 0) {
    return "Top glaze";
  }

  if (layerOrder === example.layers.length - 1) {
    return layerOrder > 1 ? "Foundation layer" : "Base glaze";
  }

  return "Middle layer";
}

export default async function VendorCombinationExamplePage({
  params,
}: {
  params: Promise<{ exampleId: string }>;
}) {
  const viewer = await requireViewer();
  const { exampleId } = await params;
  const example = await getVendorCombinationExample(viewer.profile.id, exampleId);

  if (!example) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Combination example"
        title={example.title}
        description={`Imported from ${example.sourceVendor}. Layer order, source photos, and glaze links are preserved here so you can move from inspiration to a test tile faster.`}
        actions={
          <>
            <a
              href={example.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost" })}
            >
              Open source
            </a>
            <Link href="/combinations" className={buttonVariants({ variant: "secondary" })}>
              Back to combinations
            </Link>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Panel className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{example.sourceVendor}</Badge>
              {example.cone ? <Badge tone="neutral">{example.cone}</Badge> : null}
              {example.clayBody ? <Badge tone="neutral">{example.clayBody}</Badge> : null}
              <Badge tone={example.viewerOwnsAllGlazes ? "success" : "accent"}>
                {example.viewerOwnsAllGlazes
                  ? "You own every layer"
                  : `${example.viewerOwnedLayerCount}/${example.layers.length} layers owned`}
              </Badge>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden border border-border bg-panel">
              <Image
                src={example.imageUrl}
                alt={example.title}
                fill
                sizes="(min-width: 1280px) 52rem, 100vw"
                className="object-cover"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {example.applicationNotes ? (
                <div className="border border-border bg-panel px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Application</p>
                  <p className="mt-2 text-sm leading-6 text-foreground/90">{example.applicationNotes}</p>
                </div>
              ) : null}
              {example.firingNotes ? (
                <div className="border border-border bg-panel px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Firing</p>
                  <p className="mt-2 text-sm leading-6 text-foreground/90">{example.firingNotes}</p>
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Ordered layers</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">What goes where</h2>
          </div>

          {example.layers.map((layer) => {
            const previewImage = layer.sourceImageUrl ?? layer.glaze?.imageUrl ?? null;

            return (
              <Panel key={layer.id} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      {getLayerRoleLabel(example, layer.layerOrder)}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {layer.glaze ? formatGlazeLabel(layer.glaze) : [layer.glazeCode, layer.glazeName].filter(Boolean).join(" ")}
                    </h3>
                    {layer.glaze ? (
                      <p className="mt-2 text-sm text-muted">{formatGlazeMeta(layer.glaze)}</p>
                    ) : null}
                  </div>
                  {layer.connectorToNext ? <Badge tone="neutral">{layer.connectorToNext}</Badge> : null}
                </div>

                {previewImage ? (
                  <div className="relative aspect-square overflow-hidden border border-border bg-panel">
                    <Image
                      src={previewImage}
                      alt={layer.glaze ? formatGlazeLabel(layer.glaze) : layer.glazeName}
                      fill
                      sizes="(min-width: 1280px) 28rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {layer.glaze ? (
                    <Link href={`/glazes/${layer.glaze.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Open glaze page
                    </Link>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}
