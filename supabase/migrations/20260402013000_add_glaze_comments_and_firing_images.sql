create table if not exists public.glaze_firing_images (
  id uuid primary key default gen_random_uuid(),
  glaze_id uuid not null references public.glazes (id) on delete cascade,
  label text not null,
  cone text,
  atmosphere text,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (glaze_id, label)
);

create table if not exists public.glaze_comments (
  id uuid primary key default gen_random_uuid(),
  glaze_id uuid not null references public.glazes (id) on delete cascade,
  author_user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists glaze_firing_images_glaze_idx on public.glaze_firing_images (glaze_id, sort_order, created_at desc);
create index if not exists glaze_comments_glaze_idx on public.glaze_comments (glaze_id, created_at desc);

alter table public.glaze_firing_images enable row level security;
alter table public.glaze_comments enable row level security;

create policy "members can view glaze firing images"
on public.glaze_firing_images
for select
using (auth.role() = 'authenticated');

create policy "admins can manage glaze firing images"
on public.glaze_firing_images
for all
using (public.is_admin())
with check (public.is_admin());

create policy "members can view glaze comments"
on public.glaze_comments
for select
using (auth.role() = 'authenticated');

create policy "members can create glaze comments"
on public.glaze_comments
for insert
with check (author_user_id = auth.uid());

create policy "authors and admins can delete glaze comments"
on public.glaze_comments
for delete
using (author_user_id = auth.uid() or public.is_admin());
