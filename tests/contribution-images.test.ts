import assert from "node:assert/strict";
import test from "node:test";

import {
  getContributionImageBucket,
  isOwnedContributionImagePath,
  sanitizeContributionImageName,
} from "../src/lib/contribution-images";

const userId = "cecbf3ac-4e86-4418-922f-ede52499fbaa";

test("routes single-glaze and combination photos to the correct buckets", () => {
  assert.equal(getContributionImageBucket(1), "community-firing-images");
  assert.equal(getContributionImageBucket(2), "user-combination-images");
  assert.equal(getContributionImageBucket(4), "user-combination-images");
});

test("sanitizes image names for storage paths", () => {
  assert.equal(sanitizeContributionImageName("my fired tile (1).jpg"), "my-fired-tile--1-.jpg");
  assert.equal(sanitizeContributionImageName("🔥"), "--");
  assert.equal(sanitizeContributionImageName(""), "photo");
});

test("accepts only flat image paths owned by the contributing user", () => {
  assert.equal(
    isOwnedContributionImagePath(
      `${userId}/123e4567-e89b-12d3-a456-426614174000-fired-tile.jpg`,
      userId,
    ),
    true,
  );
  assert.equal(
    isOwnedContributionImagePath(
      "89ef27dc-73a4-4160-9b11-8ff017f6de59/123-photo.jpg",
      userId,
    ),
    false,
  );
  assert.equal(isOwnedContributionImagePath(`${userId}/../photo.jpg`, userId), false);
  assert.equal(isOwnedContributionImagePath(`${userId}/nested/photo.jpg`, userId), false);
});
