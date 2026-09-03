export const MAX_CONTRIBUTION_IMAGE_COUNT = 5;
export const MAX_CONTRIBUTION_IMAGE_BYTES = 8 * 1024 * 1024;

export type ContributionImageBucket =
  | "community-firing-images"
  | "user-combination-images";

export function getContributionImageBucket(glazeCount: number): ContributionImageBucket {
  return glazeCount >= 2 ? "user-combination-images" : "community-firing-images";
}

export function sanitizeContributionImageName(fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "-");
  return sanitized || "photo";
}

export function isOwnedContributionImagePath(path: string, userId: string): boolean {
  const prefix = `${userId}/`;
  if (!path.startsWith(prefix) || path.length > 512) return false;

  const fileName = path.slice(prefix.length);
  return (
    fileName.length > 0 &&
    !fileName.includes("..") &&
    !fileName.includes("/") &&
    !fileName.includes("\\") &&
    /^[a-zA-Z0-9.-]+$/.test(fileName)
  );
}
