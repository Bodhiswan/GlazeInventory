-- Replace separate post_firing_image_path / pre_firing_image_path columns with a
-- generic image_paths text[] that supports 1–5 images with no pre/post distinction.

ALTER TABLE user_combination_examples
  ADD COLUMN image_paths text[] NOT NULL DEFAULT '{}';

-- Migrate existing rows: first slot = post-firing, second slot = pre-firing (if present)
UPDATE user_combination_examples
SET image_paths = CASE
  WHEN pre_firing_image_path IS NOT NULL AND pre_firing_image_path <> ''
  THEN ARRAY[post_firing_image_path, pre_firing_image_path]
  ELSE ARRAY[post_firing_image_path]
END
WHERE post_firing_image_path IS NOT NULL AND post_firing_image_path <> '';

ALTER TABLE user_combination_examples
  DROP COLUMN post_firing_image_path,
  DROP COLUMN pre_firing_image_path;
