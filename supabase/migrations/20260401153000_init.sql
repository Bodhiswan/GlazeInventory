create extension if not exists "pgcrypto";

create type public.glaze_source_type as enum ('commercial', 'nonCommercial');
create type public.inventory_status as enum ('owned', 'archived');
create type public.post_visibility as enum ('members');
create type public.post_status as enum ('published', 'hidden', 'reported');
create type public.report_status as enum ('open', 'resolved');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null,
  avatar_url text,
  studio_name text,
  location text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.glazes (
  id uuid primary key default gen_random_uuid(),
  source_type public.glaze_source_type not null,
  name text not null,
  brand text,
  line text,
  code text,
  cone text,
  atmosphere text,
  finish_notes text,
  color_notes text,
  recipe_notes text,
  created_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  glaze_id uuid not null references public.glazes (id) on delete cascade,
  status public.inventory_status not null default 'owned',
  personal_notes text,
  created_at timestamptz not null default now(),
  unique (user_id, glaze_id)
);

create table public.combination_pairs (
  id uuid primary key default gen_random_uuid(),
  glaze_a_id uuid not null references public.glazes (id) on delete cascade,
  glaze_b_id uuid not null references public.glazes (id) on delete cascade,
  pair_key text not null unique,
  created_at timestamptz not null default now(),
  check (glaze_a_id <> glaze_b_id)
);

create table public.combination_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.profiles (id) on delete cascade,
  combination_pair_id uuid not null references public.combination_pairs (id) on delete cascade,
  image_path text not null,
  caption text,
  application_notes text,
  firing_notes text,
  visibility public.post_visibility not null default 'members',
  status public.post_status not null default 'published',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.combination_posts (id) on delete cascade,
  reported_by_user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (post_id, reported_by_user_id)
);

create index inventory_user_status_idx on public.inventory_items (user_id, status);
create index glazes_created_by_idx on public.glazes (created_by_user_id);
create index posts_pair_status_idx on public.combination_posts (combination_pair_id, status, created_at desc);
create index reports_post_status_idx on public.reports (post_id, status, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Guest Potter'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.glazes enable row level security;
alter table public.inventory_items enable row level security;
alter table public.combination_pairs enable row level security;
alter table public.combination_posts enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

create policy "profiles can view their row"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "profiles can update themselves"
on public.profiles
for update
using (id = auth.uid() or public.is_admin());

create policy "members can view catalog and their custom glazes"
on public.glazes
for select
using (created_by_user_id is null or created_by_user_id = auth.uid() or public.is_admin());

create policy "members can create their custom glazes"
on public.glazes
for insert
with check (created_by_user_id = auth.uid());

create policy "members can update their custom glazes"
on public.glazes
for update
using (created_by_user_id = auth.uid() or public.is_admin());

create policy "members manage their inventory"
on public.inventory_items
for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "members can view all combination pairs"
on public.combination_pairs
for select
using (auth.role() = 'authenticated');

create policy "members can create combination pairs"
on public.combination_pairs
for insert
with check (auth.role() = 'authenticated');

create policy "members can view published or reported posts"
on public.combination_posts
for select
using (
  auth.role() = 'authenticated'
  and visibility = 'members'
  and status <> 'hidden'
);

create policy "members can create their own posts"
on public.combination_posts
for insert
with check (author_user_id = auth.uid());

create policy "authors and admins can update posts"
on public.combination_posts
for update
using (author_user_id = auth.uid() or public.is_admin());

create policy "members can create reports"
on public.reports
for insert
with check (reported_by_user_id = auth.uid());

create policy "members can view their reports and admins can view all"
on public.reports
for select
using (reported_by_user_id = auth.uid() or public.is_admin());

create policy "admins can resolve reports"
on public.reports
for update
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('glaze-posts', 'glaze-posts', true)
on conflict (id) do nothing;

create policy "authenticated users can upload glaze photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'glaze-posts');

create policy "authenticated users can view glaze photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'glaze-posts');

create policy "owners and admins can update glaze photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'glaze-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);
