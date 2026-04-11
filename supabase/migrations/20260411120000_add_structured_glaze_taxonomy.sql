-- Promote glaze finish + family + brand-line from fuzzy text/runtime-derived
-- values into first-class structured columns.
--
-- Context: prior to this migration, the explorer filters discovered a glaze's
-- finish by regex-matching `finish_notes + description` and its family by
-- looking up `(brand, line)` in a hardcoded TypeScript map. Both approaches
-- are fragile (missed matches, code-driven taxonomy) and make SKU/line/style
-- invisible to the database. This migration:
--
--   1. Creates `glaze_brand_lines` as the canonical brand/line taxonomy with
--      an attached `families` array.
--   2. Seeds it from the TS `brandLineFamilyMap` so existing filters keep
--      working and future contributions can reference real rows.
--   3. Adds `finishes`, `families`, and `brand_line_id` to `glazes`.
--   4. Backfills each commercial glaze's finishes from the existing regex
--      patterns and its families + brand_line_id from the join.

create table if not exists public.glaze_brand_lines (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  line text not null,
  families text[] not null default '{}'::text[],
  product_url text,
  description text,
  created_at timestamptz not null default now(),
  unique (brand, line)
);

create index if not exists glaze_brand_lines_brand_idx
  on public.glaze_brand_lines (brand);

alter table public.glaze_brand_lines enable row level security;

create policy "anyone can read glaze brand lines"
  on public.glaze_brand_lines
  for select
  using (true);

create policy "admins can manage glaze brand lines"
  on public.glaze_brand_lines
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed the brand/line taxonomy. Mirrors the hardcoded map previously kept in
-- `src/lib/glaze-metadata.ts`. Keep the seed idempotent so the migration can
-- safely re-run during local development.
insert into public.glaze_brand_lines (brand, line, families) values
  -- Mayco
  ('Mayco', 'Fundamentals Underglaze', array['Underglaze']),
  ('Mayco', 'E-Z Stroke Translucent Underglazes', array['Translucent underglaze']),
  ('Mayco', 'Stroke & Coat', array['Low-fire gloss color']),
  ('Mayco', 'Speckled Stroke & Coat', array['Low-fire gloss color']),
  ('Mayco', 'Foundations', array['Low-fire gloss color']),
  ('Mayco', 'Low Fire Clear', array['Durable functional']),
  ('Mayco', 'Stoneware Engobes', array['Engobe']),
  ('Mayco', 'Stoneware Clear', array['Durable functional']),
  ('Mayco', 'Stoneware', array['Reactive effects']),
  ('Mayco', 'Stoneware Specialty', array['Reactive effects']),
  ('Mayco', 'Elements and Elements Chunkies', array['Reactive effects']),
  ('Mayco', 'Elements', array['Reactive effects']),
  ('Mayco', 'Elements Chunkies', array['Reactive effects']),
  ('Mayco', 'Jungle Gems', array['Reactive effects']),
  ('Mayco', 'Pottery Cascade', array['Reactive effects']),
  ('Mayco', 'Flux', array['Reactive effects']),
  ('Mayco', 'Classic Crackles', array['Crawl / crackle']),
  ('Mayco', 'Cobblestone', array['Crawl / crackle']),
  ('Mayco', 'Raku', array['Reactive effects']),
  ('Mayco', 'Washes', array['Specialty additive']),
  ('Mayco', 'Designer Liner', array['Underglaze']),
  ('Mayco', 'French Dimensions', array['Specialty additive']),
  ('Mayco', 'Melt Gloop', array['Specialty additive']),
  ('Mayco', 'Bead', array['Specialty additive']),
  ('Mayco', 'Snow Gems', array['Specialty additive']),
  ('Mayco', 'Snowfall', array['Specialty additive']),

  -- AMACO
  ('AMACO', 'Velvet Underglaze', array['Underglaze']),
  ('AMACO', 'Liquid Underglaze', array['Underglaze']),
  ('AMACO', 'Semi-Moist Underglaze', array['Underglaze']),
  ('AMACO', 'Velvet Sprayz', array['Underglaze']),
  ('AMACO', 'Teacher''s Palette Light', array['Low-fire gloss color']),
  ('AMACO', 'Teacher''s Palette', array['Low-fire gloss color']),
  ('AMACO', 'Low Fire Gloss', array['Low-fire gloss color']),
  ('AMACO', 'Low Fire Matte', array['Low-fire matte color']),
  ('AMACO', 'Celadon', array['Celadon', 'Durable functional']),
  ('AMACO', 'Satin Matte', array['Satin / matte functional']),
  ('AMACO', 'High Fire', array['Durable functional']),
  ('AMACO', 'Dipping & Layering', array['Durable functional', 'Reactive effects']),
  ('AMACO', 'Dipping Glazes', array['Durable functional']),
  ('AMACO', 'Opalescent', array['Reactive effects']),
  ('AMACO', 'Potter''s Choice', array['Reactive effects']),
  ('AMACO', 'Potter''s Choice Flux', array['Reactive effects']),
  ('AMACO', 'Cosmos', array['Reactive effects']),
  ('AMACO', 'Kiln Ice', array['Reactive effects', 'Crawl / crackle']),
  ('AMACO', 'Phase Glaze', array['Reactive effects']),
  ('AMACO', 'Crawls', array['Crawl / crackle']),
  ('AMACO', 'Shino', array['Shino', 'Reactive effects']),
  ('AMACO', 'Texturizer', array['Specialty additive']),

  -- Coyote
  ('Coyote', 'Enduro-Color Glazes', array['Durable functional']),
  ('Coyote', 'Vibro-Color Glazes', array['Durable functional']),
  ('Coyote', 'Gloss Glazes', array['Durable functional']),
  ('Coyote', 'Satin Glazes', array['Satin / matte functional']),
  ('Coyote', 'Matt Glazes & Crawl Glazes', array['Satin / matte functional', 'Crawl / crackle']),
  ('Coyote', 'Frank''s Colored Celadon Glazes', array['Celadon']),
  ('Coyote', 'Shino Glazes', array['Shino', 'Reactive effects']),
  ('Coyote', 'Archie''s Glazes', array['Reactive effects']),
  ('Coyote', 'Fantasy Glazes', array['Reactive effects']),
  ('Coyote', 'Copper & Iron Glazes', array['Reactive effects']),
  ('Coyote', 'Mottled Glazes', array['Reactive effects']),
  ('Coyote', 'Texas Two-Step Oilspot Glazes', array['Reactive effects']),

  -- Duncan
  ('Duncan', 'E-Z Stroke® Translucent Underglazes', array['Translucent underglaze']),
  ('Duncan', 'French Dimensions™', array['Specialty additive']),
  ('Duncan', 'Clear Glazes', array['Durable functional']),

  -- Clay Art Center
  ('Clay Art Center', 'Base Glazes', array['Durable functional']),
  ('Clay Art Center', 'Craftsman Glazes', array['Reactive effects']),
  ('Clay Art Center', 'Frost Series Glazes', array['Satin / matte functional']),
  ('Clay Art Center', 'Glossy Series Glazes', array['Durable functional']),
  ('Clay Art Center', 'High Fire Glazes', array['Durable functional']),
  ('Clay Art Center', 'Lead-Free Low Fire Glossy Glazes', array['Low-fire gloss color']),
  ('Clay Art Center', 'Mica Terra Sigillata', array['Engobe']),
  ('Clay Art Center', 'P Series Glazes', array['Durable functional']),
  ('Clay Art Center', 'Rainbow Glazes', array['Reactive effects']),
  ('Clay Art Center', 'Raku Glazes', array['Reactive effects']),
  ('Clay Art Center', 'Satin Matte Glazes', array['Satin / matte functional']),
  ('Clay Art Center', 'Strontium Matte Glazes', array['Reactive effects']),
  ('Clay Art Center', 'Terra Sigillata', array['Engobe']),

  -- Spectrum
  ('Spectrum', '100 Series Crackle Glazes', array['Crawl / crackle']),
  ('Spectrum', '150 Series Metallic Glazes', array['Reactive effects']),
  ('Spectrum', '200 Series Rhinestone Glazes', array['Reactive effects']),
  ('Spectrum', '250 Series Satin Glazes', array['Satin / matte functional']),
  ('Spectrum', '300 Series Majolica Glazes', array['Low-fire gloss color']),
  ('Spectrum', '700 Series Opaque Gloss Glazes', array['Low-fire gloss color']),
  ('Spectrum', '800 Series Semi-Transparent Glazes', array['Low-fire gloss color']),
  ('Spectrum', '850 Series Raku Glazes', array['Reactive effects']),
  ('Spectrum', '900 Series Low Stone Glazes', array['Satin / matte functional']),
  ('Spectrum', '1100 Series Clear Gloss Glazes', array['Durable functional']),
  ('Spectrum', '1100 Series Clear Satin Glazes', array['Satin / matte functional']),
  ('Spectrum', '1100 Series Clear Crackle Glazes', array['Crawl / crackle']),
  ('Spectrum', '1100 Series Opaque Gloss Glazes', array['Durable functional']),
  ('Spectrum', '1100 Series Opaque Satin Glazes', array['Satin / matte functional']),
  ('Spectrum', '1100 Series Metallic Glazes', array['Reactive effects']),
  ('Spectrum', '1100 Series Reactive Glazes', array['Reactive effects']),
  ('Spectrum', '1100 Series Textured Glazes', array['Reactive effects']),
  ('Spectrum', '1200 Series Cone 9/10 Glazes', array['Durable functional']),
  ('Spectrum', '1400 Series Shino Glazes', array['Shino', 'Reactive effects']),
  ('Spectrum', '1420 Series Ash Glazes', array['Reactive effects']),
  ('Spectrum', '1430 Series Floating Glazes', array['Reactive effects']),
  ('Spectrum', '1460 Series Celadon Glazes', array['Celadon']),
  ('Spectrum', '1500 Series NOVA Glazes', array['Reactive effects']),

  -- Speedball
  ('Speedball', 'Underglazes', array['Underglaze']),
  ('Speedball', 'Mid-Fire Glazes', array['Reactive effects']),
  ('Speedball', 'Mid-Fire Flux Glazes', array['Reactive effects']),
  ('Speedball', 'Earthenware Glazes', array['Low-fire gloss color']),

  -- Laguna
  ('Laguna', 'EZ Stroke Low-Fire', array['Underglaze']),
  ('Laguna', 'Silky Underglaze', array['Underglaze']),
  ('Laguna', 'Moroccan Fusion', array['Reactive effects']),
  ('Laguna', 'Moroccan Color', array['Low-fire gloss color']),
  ('Laguna', 'Moroccan Sand Series', array['Reactive effects']),
  ('Laguna', 'Moroccan Sand Clear', array['Durable functional']),
  ('Laguna', 'Laguna Glazes High-Fire (Cone 10)', array['Durable functional']),
  ('Laguna', 'Vintage High-Fire (Cone 10)', array['Durable functional']),
  ('Laguna', 'WC High-Fire (Cone 10)', array['Durable functional']),
  ('Laguna', 'Versa-5', array['Durable functional']),
  ('Laguna', 'SG Studio Glazes', array['Durable functional']),
  ('Laguna', 'Flameware (Cone 10)', array['Durable functional']),
  ('Laguna', 'Crystal Blossom', array['Reactive effects']),
  ('Laguna', 'Watercolor Crackle', array['Crawl / crackle']),
  ('Laguna', 'Watercolor Mystic', array['Reactive effects']),
  ('Laguna', 'Reactive Glazes', array['Reactive effects']),
  ('Laguna', 'Designer Effects - Dry Lake', array['Crawl / crackle']),
  ('Laguna', 'Designer Effects - Metallic', array['Reactive effects']),
  ('Laguna', 'Raku', array['Reactive effects']),

  -- Northcote
  ('Northcote', 'Midfire Glaze', array['Durable functional']),
  ('Northcote', 'Midfire Glaze - Gloss', array['Durable functional']),
  ('Northcote', 'Midfire Glaze - Pearl', array['Satin / matte functional']),
  ('Northcote', 'Midfire Glaze - Chun', array['Reactive effects']),

  -- Penguin Pottery
  ('Penguin Pottery', 'Flux Series', array['Reactive effects']),
  ('Penguin Pottery', 'Opaque Series', array['Durable functional']),
  ('Penguin Pottery', 'Specialty Series', array['Reactive effects']),

  -- Dick Blick Essentials
  ('Dick Blick Essentials', 'Gloss Glazes', array['Low-fire gloss color']),

  -- BOTZ
  ('BOTZ', 'Unidekor', array['Underglaze']),
  ('BOTZ', 'Earthenware', array['Low-fire gloss color']),
  ('BOTZ', 'Stoneware', array['Reactive effects']),
  ('BOTZ', 'Engobes', array['Engobe']),
  ('BOTZ', 'PRO', array['Durable functional', 'Reactive effects']),
  ('BOTZ', 'Ceramic Ink', array['Specialty additive'])
on conflict (brand, line) do update
  set families = excluded.families;

-- ── New structured columns on glazes ────────────────────────────────────────
alter table public.glazes
  add column if not exists finishes text[] not null default '{}'::text[],
  add column if not exists families text[] not null default '{}'::text[],
  add column if not exists brand_line_id uuid references public.glaze_brand_lines (id) on delete set null;

create index if not exists glazes_brand_line_idx on public.glazes (brand_line_id);
create index if not exists glazes_finishes_gin_idx on public.glazes using gin (finishes);
create index if not exists glazes_families_gin_idx on public.glazes using gin (families);

-- ── Backfill: attach brand_line + families via the (brand, line) join ──────
update public.glazes g
set
  brand_line_id = bl.id,
  families = bl.families
from public.glaze_brand_lines bl
where g.brand = bl.brand
  and g.line = bl.line
  and (g.brand_line_id is null or g.families = '{}'::text[]);

-- ── Backfill: derive finishes from existing finish_notes + description ─────
-- Mirrors the keyword list in src/lib/utils.ts:finishKeywords. Uses PostgreSQL
-- word boundaries (\y) and the case-insensitive match operator `~*`.
update public.glazes g
set finishes = coalesce((
  select array_agg(label order by label)
  from (values
    ('\ygloss(y)?\y',      'Glossy'),
    ('\ymatte?\y',          'Matte'),
    ('\ysatin\y',           'Satin'),
    ('\ycrackle\y',         'Crackle'),
    ('\ytransparent\y',     'Transparent'),
    ('\ytranslucent\y',     'Translucent'),
    ('\yopaque\y',          'Opaque'),
    ('\ytextured?\y',       'Textured'),
    ('\ycrystal(s|line)?\y','Crystalline')
  ) as kw(pattern, label)
  where concat_ws(' ', g.finish_notes, g.description) ~* kw.pattern
), array[]::text[])
where g.source_type = 'commercial'
  and g.finishes = '{}'::text[];
