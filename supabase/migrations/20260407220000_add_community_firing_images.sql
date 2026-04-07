-- ── community_firing_images ──────────────────────────────────────────────────
-- Stores member-contributed firing photos for any glaze or combination
-- in the library. Separate from vendor-imported glaze_firing_images.

create table if not exists public.community_firing_images (
  id uuid primary key default gen_random_uuid(),
  -- Target: either a glaze OR a combination (exactly one must be set)
  glaze_id       uuid references public.glazes(id) on delete cascade,
  combination_id uuid,
  combination_type text check (combination_type in ('vendor', 'user')),
  -- Image
  image_url      text not null,
  storage_path   text not null,
  -- Metadata
  label          text,
  cone           text,
  atmosphere     text,
  -- Ownership
  uploader_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  -- At least one target must be set
  constraint community_firing_images_has_target check (
    (glaze_id is not null) <> (combination_id is not null)
  )
);

create index if not exists community_firing_images_glaze_idx on public.community_firing_images (glaze_id) where glaze_id is not null;
create index if not exists community_firing_images_combo_idx on public.community_firing_images (combination_id) where combination_id is not null;

alter table public.community_firing_images enable row level security;

create policy "members can view community firing images"
on public.community_firing_images for select
using (auth.role() = 'authenticated');

create policy "members can insert their own community firing images"
on public.community_firing_images for insert
to authenticated
with check (uploader_user_id = auth.uid());

create policy "uploaders and admins can delete community firing images"
on public.community_firing_images for delete
to authenticated
using (uploader_user_id = auth.uid() or public.is_admin());

-- ── Storage bucket ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('community-firing-images', 'community-firing-images', true)
on conflict (id) do nothing;

create policy "authenticated users can upload community firing images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'community-firing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "anyone can view community firing images"
on storage.objects for select
using (bucket_id = 'community-firing-images');

create policy "uploaders can delete their community firing images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'community-firing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
