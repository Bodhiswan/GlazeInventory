"use client";

import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
import type { CommunityImage } from "./use-community-images";

export function CommunityImageGrid({
  images,
  altPrefix,
  lightboxIndex,
  lightboxImages,
  onOpenLightbox,
  onCloseLightbox,
}: {
  images: CommunityImage[];
  altPrefix: string;
  lightboxIndex: number | null;
  lightboxImages: LightboxImage[];
  onOpenLightbox: (index: number) => void;
  onCloseLightbox: () => void;
}) {
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
              onClick={() => onOpenLightbox(i)}
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
          onClose={onCloseLightbox}
        />
      ) : null}
    </>
  );
}
