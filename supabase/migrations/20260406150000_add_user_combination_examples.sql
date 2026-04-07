-- User-generated combination examples (parallel to vendor_combination_examples)

create table public.user_combination_examples (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  post_firing_image_path text not null,
  pre_firing_image_path text,
  cone text not null,
  atmosphere text not null default 'oxidation',
  glazing_process text,
  notes text,
  kiln_notes text,
  visibility public.post_visibility not null default 'members',
  status public.post_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_combination_example_layers (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references public.user_combination_examples (id) on delete cascade,
  glaze_id uuid not null references public.glazes (id) on delete cascade,
  layer_order integer not null check (layer_order between 1 and 4),
  created_at timestamptz not null default now(),
  unique (example_id, layer_order)
);

-- Indexes
create index user_combination_examples_author_idx
on public.user_combination_examples (author_user_id, status, created_at desc);

create index user_combination_examples_status_idx
on public.user_combination_examples (status, created_at desc);

create index user_combination_example_layers_example_idx
on public.user_combination_example_layers (example_id, layer_order);

create index user_combination_example_layers_glaze_idx
on public.user_combination_example_layers (glaze_id);

-- Updated-at trigger
create or replace function public.set_updated_at_user_combination_examples()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_user_combination_examples_updated_at
before update on public.user_combination_examples
for each row execute procedure public.set_updated_at_user_combination_examples();

-- RLS
alter table public.user_combination_examples enable row level security;
alter table public.user_combination_example_layers enable row level security;

-- Members can view published user examples
create policy "members can view published user combination examples"
on public.user_combination_examples
for select
to authenticated
using (status = 'published' or author_user_id = auth.uid() or public.is_admin());

-- Authors can create their own examples
create policy "authors can create user combination examples"
on public.user_combination_examples
for insert
to authenticated
with check (author_user_id = auth.uid());

-- Authors and admins can update examples
create policy "authors and admins can update user combination examples"
on public.user_combination_examples
for update
to authenticated
using (author_user_id = auth.uid() or public.is_admin());

-- Authors and admins can delete examples
create policy "authors and admins can delete user combination examples"
on public.user_combination_examples
for delete
to authenticated
using (author_user_id = auth.uid() or public.is_admin());

-- Layer policies (read follows parent, write via cascade)
create policy "members can view user combination example layers"
on public.user_combination_example_layers
for select
to authenticated
using (true);

create policy "authors can create user combination example layers"
on public.user_combination_example_layers
for insert
to authenticated
with check (
  exists (
    select 1 from public.user_combination_examples
    where id = example_id and author_user_id = auth.uid()
  )
);

create policy "authors can delete user combination example layers"
on public.user_combination_example_layers
for delete
to authenticated
using (
  exists (
    select 1 from public.user_combination_examples
    where id = example_id and author_user_id = auth.uid()
  )
);

-- Allow public/anon reads for published user examples (matches vendor pattern)
create policy "public can view published user combination examples"
on public.user_combination_examples
for select
to anon
using (status = 'published');

create policy "public can view user combination example layers"
on public.user_combination_example_layers
for select
to anon
using (true);

-- Storage bucket for user combination images
insert into storage.buckets (id, name, public)
values ('user-combination-images', 'user-combination-images', true)
on conflict (id) do nothing;

create policy "authenticated users can upload combination images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-combination-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "anyone can view combination images"
on storage.objects for select
to public
using (bucket_id = 'user-combination-images');

create policy "users can delete own combination images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-combination-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
