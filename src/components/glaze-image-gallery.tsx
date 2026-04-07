"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { GlazeFiringImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type GalleryItem = {
  id: string;
  imageUrl: string;
  alt: string;
  label?: string | null;
  cone?: string | null;
  atmosphere?: string | null;
};

function normalizeImageUrl(value: string) {
  return value.trim().toLowerCase();
}

function inferImageMetadata(imageUrl: string, firingImages: GlazeFiringImage[]) {
  const normalizedUrl = normalizeImageUrl(imageUrl);
  const matchingFiringImage = firingImages.find(
    (image) => normalizeImageUrl(image.imageUrl) === normalizedUrl,
  );

  if (matchingFiringImage) {
    return {
      label: matchingFiringImage.label,
      cone: matchingFiringImage.cone,
      atmosphere: matchingFiringImage.atmosphere,
    };
  }

  if (/_cone10\./i.test(imageUrl)) {
    return { label: "Cone 10", cone: "Cone 10", atmosphere: null };
  }

  if (/_cone06\./i.test(imageUrl)) {
    return { label: "Cone 06", cone: "Cone 06", atmosphere: null };
  }

  if (/_cone6\./i.test(imageUrl)) {
    return { label: "Cone 6", cone: "Cone 6", atmosphere: null };
  }

  if (/_reduction\./i.test(imageUrl)) {
    return { label: "Reduction", cone: null, atmosphere: "Reduction" };
  }

  if (/_oxidation\./i.test(imageUrl)) {
    return { label: "Oxidation", cone: null, atmosphere: "Oxidation" };
  }

  return { label: null, cone: null, atmosphere: null };
}

function getDisplayTags(item: GalleryItem) {
  const values = [item.label, item.cone, item.atmosphere]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  return values.filter((value, index) => values.findIndex((candidate) => candidate === value) === index);
}

function getThumbnailCaption(item: GalleryItem) {
  return item.cone ?? item.atmosphere ?? item.label ?? "Image";
}

export function GlazeImageGallery({
  baseImageUrl,
  baseImageAlt,
  baseImageLabel,
  firingImages,
  initialImageUrl,
}: {
  baseImageUrl?: string | null;
  baseImageAlt: string;
  baseImageLabel?: string;
  firingImages: GlazeFiringImage[];
  initialImageUrl?: string | null;
}) {
  const items = useMemo(() => {
    const ordered: GalleryItem[] = [];
    const seen = new Set<string>();

    if (baseImageUrl && !seen.has(baseImageUrl)) {
      const inferredMetadata = inferImageMetadata(baseImageUrl, firingImages);

      ordered.push({
        id: "catalog-image",
        imageUrl: baseImageUrl,
        alt: baseImageAlt,
        label: baseImageLabel ?? inferredMetadata.label,
        cone: inferredMetadata.cone,
        atmosphere: inferredMetadata.atmosphere,
      });
      seen.add(baseImageUrl);
    }

    for (const image of firingImages) {
      if (seen.has(image.imageUrl)) {
        continue;
      }

      ordered.push({
        id: image.id,
        imageUrl: image.imageUrl,
        alt: `${baseImageAlt} ${image.label}`,
        label: image.label,
        cone: image.cone,
        atmosphere: image.atmosphere,
      });
      seen.add(image.imageUrl);
    }

    return ordered;
  }, [baseImageAlt, baseImageLabel, baseImageUrl, firingImages]);

  const initialIndex = Math.max(
    0,
    items.findIndex((item) => item.imageUrl === initialImageUrl),
  );
  const [selectedIndex, setSelectedIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!items.length) {
    return null;
  }

  const selectedItem = items[selectedIndex] ?? items[0];
  const selectedTags = getDisplayTags(selectedItem);

  const lightboxImages: LightboxImage[] = items.map((item) => ({
    id: item.id,
    imageUrl: item.imageUrl,
    alt: item.alt,
    label: item.label,
    cone: item.cone,
    atmosphere: item.atmosphere,
  }));

  return (
    <div className="space-y-4">
      {lightboxOpen ? (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={selectedIndex}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="w-full overflow-hidden border border-border bg-panel transition hover:opacity-90"
        aria-label="View full size"
      >
        <img
          src={selectedItem.imageUrl}
          alt={selectedItem.alt}
          className="aspect-square w-full bg-white object-contain"
        />
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={`${selectedItem.id}-${tag}`} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
        {items.length > 1 ? (
          <div className="flex gap-2">
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={() => setSelectedIndex((current) => (current - 1 + items.length) % items.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={() => setSelectedIndex((current) => (current + 1) % items.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "min-w-[96px] overflow-hidden border border-border bg-panel p-1 transition hover:border-foreground/20",
                index === selectedIndex ? "border-foreground" : "",
              )}
            >
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="h-[76px] w-[76px] bg-white object-contain"
              />
              <span className="block px-1 pb-1 pt-2 text-center text-[11px] font-medium text-foreground">
                {getThumbnailCaption(item)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
