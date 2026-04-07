"use client";

import { useEffect, useState } from "react";

import type { LightboxImage } from "@/components/image-lightbox";

export type CommunityImage = {
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

export interface UseCommunityImagesProps {
  target: { glazeId: string } | { combinationId: string };
  altPrefix: string;
}

export function useCommunityImages({ target, altPrefix }: UseCommunityImagesProps) {
  const [images, setImages] = useState<CommunityImage[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchCommunityImages(target).then(setImages);
  }, ["glazeId" in target ? target.glazeId : target.combinationId]);

  const lightboxImages: LightboxImage[] = (images ?? []).map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    alt: `${altPrefix} — ${img.label ?? img.cone ?? "firing photo"}`,
    label: img.label,
    cone: img.cone,
    atmosphere: img.atmosphere,
    uploaderName: img.uploaderName,
  }));

  return {
    images,
    lightboxIndex,
    setLightboxIndex,
    lightboxImages,
  };
}
