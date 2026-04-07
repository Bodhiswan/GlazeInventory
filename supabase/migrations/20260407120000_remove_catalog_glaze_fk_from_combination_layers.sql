-- user_combination_example_layers.glaze_id stores catalog UUIDs
-- (the semantic identifier used in URLs and the static catalog JSON).
-- In local dev the DB assigns different UUIDs to the same glazes, causing
-- FK violations when users try to publish combinations. Since catalog glazes
-- are never deleted, the cascade-delete behaviour this FK provides is meaningless,
-- and the column is better treated as a plain reference ID rather than a DB FK.

alter table public.user_combination_example_layers
  drop constraint user_combination_example_layers_glaze_id_fkey;
