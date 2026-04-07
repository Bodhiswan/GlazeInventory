"use client";

import { CommunityImageGrid } from "@/components/community-images/community-image-grid";
import { useCommunityImages } from "@/components/community-images/use-community-images";

export function CommunityImagesPanel({
  target,
  altPrefix,
}: {
  target: { glazeId: string } | { combinationId: string };
  altPrefix: string;
}) {
  const { images, lightboxIndex, setLightboxIndex, lightboxImages } = useCommunityImages({
    target,
    altPrefix,
  });

  if (!images || images.length === 0) return null;

  return (
    <CommunityImageGrid
      images={images}
      altPrefix={altPrefix}
      lightboxIndex={lightboxIndex}
      lightboxImages={lightboxImages}
      onOpenLightbox={setLightboxIndex}
      onCloseLightbox={() => setLightboxIndex(null)}
    />
  );
}
