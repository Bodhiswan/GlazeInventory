-- glaze_ratings.glaze_id and glaze_comments.glaze_id store catalog UUIDs
-- (the semantic identifier used in URLs and the static catalog JSON).
-- In local dev the DB assigns different UUIDs to the same glazes, causing
-- FK violations when users try to rate or comment. Since catalog glazes are
-- never deleted, the cascade-delete behaviour this FK provides is meaningless,
-- and the column is better treated as a plain reference ID rather than a DB FK.

alter table public.glaze_ratings
  drop constraint glaze_ratings_glaze_id_fkey;

alter table public.glaze_comments
  drop constraint glaze_comments_glaze_id_fkey;
