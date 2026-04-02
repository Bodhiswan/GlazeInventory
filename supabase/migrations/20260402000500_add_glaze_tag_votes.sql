create table if not exists public.glaze_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.glaze_tag_votes (
  id uuid primary key default gen_random_uuid(),
  glaze_id uuid not null references public.glazes (id) on delete cascade,
  tag_id uuid not null references public.glaze_tags (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (glaze_id, tag_id, user_id)
);

create index if not exists glaze_tag_votes_glaze_idx on public.glaze_tag_votes (glaze_id, created_at desc);
create index if not exists glaze_tag_votes_tag_idx on public.glaze_tag_votes (tag_id, created_at desc);
create index if not exists glaze_tag_votes_user_idx on public.glaze_tag_votes (user_id, created_at desc);

alter table public.glaze_tags enable row level security;
alter table public.glaze_tag_votes enable row level security;

create policy "members can view glaze tags"
on public.glaze_tags
for select
using (auth.role() = 'authenticated');

create policy "members can view glaze tag votes"
on public.glaze_tag_votes
for select
using (auth.role() = 'authenticated');

create policy "members can vote on commercial glaze tags"
on public.glaze_tag_votes
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.glazes
    where id = glaze_id
      and source_type = 'commercial'
  )
);

create policy "members can remove their glaze tag votes"
on public.glaze_tag_votes
for delete
using (user_id = auth.uid() or public.is_admin());

insert into public.glaze_tags (slug, label, category, description)
values
  ('glossy', 'Glossy', 'Surface', 'Finishes with a glossy or reflective surface.'),
  ('satin', 'Satin', 'Surface', 'Lands between matte and glossy with a soft sheen.'),
  ('matte', 'Matte', 'Surface', 'Finishes with a dry or low-sheen matte surface.'),
  ('transparent', 'Transparent', 'Opacity', 'Lets the clay body or underglaze show through clearly.'),
  ('translucent', 'Translucent', 'Opacity', 'Lets some underlying color show through while softening it.'),
  ('opaque', 'Opaque', 'Opacity', 'Covers the body or underlayers with little transparency.'),
  ('stable', 'Stable', 'Movement', 'Stays where it is applied and does not move much in the kiln.'),
  ('runny', 'Runny', 'Movement', 'Moves or flows a lot in the kiln.'),
  ('thin-coat-friendly', 'Thin Coat Friendly', 'Application', 'Looks good even when applied on the thinner side.'),
  ('thick-coat-friendly', 'Thick Coat Friendly', 'Application', 'Develops best when applied generously.'),
  ('easy-to-layer', 'Easy To Layer', 'Application', 'Usually layers well with other glazes.'),
  ('hard-to-apply', 'Hard To Apply', 'Application', 'Can be fussy, inconsistent, or difficult to apply well.'),
  ('breaks-on-edges', 'Breaks On Edges', 'Visual', 'Breaks over texture or edges and reveals variation there.'),
  ('variegated', 'Variegated', 'Visual', 'Shows multiple colors, pooling, or movement in one finish.'),
  ('crystalline', 'Crystalline', 'Visual', 'Develops crystal growth or crystal-like blooms.'),
  ('textured', 'Textured', 'Visual', 'Creates a tactile, foamy, cratered, or visibly textured surface.')
on conflict (slug) do update
set
  label = excluded.label,
  category = excluded.category,
  description = excluded.description;
