-- Moderation queue state for user submissions.
-- pending = awaiting review, approved = reviewed OK, rejected = reviewed bad.

ALTER TABLE public.user_combination_examples
  ADD COLUMN IF NOT EXISTS moderation_state text NOT NULL DEFAULT 'pending';

ALTER TABLE public.community_firing_images
  ADD COLUMN IF NOT EXISTS moderation_state text NOT NULL DEFAULT 'pending';

ALTER TABLE public.glazes
  ADD COLUMN IF NOT EXISTS moderation_state text;

-- Only non-commercial (user-added) glazes need moderation.
UPDATE public.glazes
  SET moderation_state = 'pending'
  WHERE source_type = 'nonCommercial' AND moderation_state IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_combination_examples_moderation_state
  ON public.user_combination_examples (moderation_state);

CREATE INDEX IF NOT EXISTS idx_community_firing_images_moderation_state
  ON public.community_firing_images (moderation_state);

CREATE INDEX IF NOT EXISTS idx_glazes_moderation_state
  ON public.glazes (moderation_state)
  WHERE moderation_state IS NOT NULL;
