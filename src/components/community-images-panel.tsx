"use client";

import { useEffect, useState } from "react";

import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";

type CommunityImage = {
  id: string;
  imageUrl: string;
  label: string | null;
  cone: string | null;
  atmosphere: string | null;
  uploaderName: string | null;
};

async function fetchCommunityImages(target: { glazeId: string } | { combinationId: string }): Promise<CommunityImage[]> {
  const params = new URLSearchParams(
    "glazeId" in target
      ? { glazeId: target.glazeId }
      : { combinationId: target.combinationId },
  );
  const res = await fetch(`/api/community-firing-images?${params.toString()}`);
  if (!res.ok) return [];
  return res.json() as Promise<CommunityImage[]>;
}

export function CommunityImagesPanel({
  target,
  altPrefix,
}: {
  target: { glazeId: string } | { combinationId: string };
  altPrefix: string;
}) {
  const [images, setImages] = useState<CommunityImage[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchCommunityImages(target).then(setImages);
  }, ["glazeId" in target ? target.glazeId : target.combinationId]);

  if (!images || images.length === 0) return null;

  const lightboxImages: LightboxImage[] = images.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    alt: `${altPrefix} — ${img.label ?? img.cone ?? "firing photo"}`,
    label: img.label,
    cone: img.cone,
    atmosphere: img.atmosphere,
    uploaderName: img.uploaderName,
  }));

  return (
    <>
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
          Community photos ({images.length})
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group overflow-hidden border border-border bg-panel transition hover:border-foreground/30"
            >
              <img
                src={img.imageUrl}
                alt={`${altPrefix} firing photo`}
                className="aspect-square w-full object-cover transition group-hover:opacity-90"
                loading="lazy"
              />
              {(img.cone || img.atmosphere) ? (
                <p className="truncate px-1 pb-1 pt-0.5 text-center text-[9px] text-muted">
                  {[img.cone, img.atmosphere].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null ? (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}
