"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LightboxImage {
  id: string;
  imageUrl: string;
  alt: string;
  label?: string | null;
  cone?: string | null;
  atmosphere?: string | null;
  uploaderName?: string | null;
}

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() => initialIndex % Math.max(images.length, 1));

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length, setIndex]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length, setIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  const image = images[index];
  if (!image) return null;

  const tags = [image.label, image.cone, image.atmosphere].filter(Boolean) as string[];
  const unique = [...new Set(tags)];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-screen w-full max-w-4xl flex-col items-center px-4 py-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-white/20 bg-black/50 text-white transition hover:bg-black/70"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <img
          src={image.imageUrl}
          alt={image.alt}
          className="max-h-[75vh] w-auto max-w-full object-contain shadow-2xl"
          draggable={false}
        />

        {/* Caption */}
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          {unique.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {unique.map((tag) => (
                <span key={tag} className="border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/80">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {image.uploaderName ? (
            <p className="text-xs text-white/50">Contributed by {image.uploaderName}</p>
          ) : null}
        </div>

        {/* Prev / Next */}
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/50 text-white transition hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/50 text-white transition hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Dots */}
            <div className="mt-3 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(() => i)}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/30"}`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

