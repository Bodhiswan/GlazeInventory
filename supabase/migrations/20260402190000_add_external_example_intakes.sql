create type public.external_example_privacy_mode as enum ('anonymous', 'attributed', 'none');
create type public.external_example_review_status as enum ('queued', 'approved', 'rejected', 'duplicate', 'published');

alter table public.combination_posts
add column if not exists display_author_name text;

create table public.external_example_intakes (
  id uuid primary key default gen_random_uuid(),
  source_platform text not null check (source_platform in ('facebook')),
  group_label text not null,
  source_url text not null,
  raw_caption text,
  raw_author_display_name text,
  raw_source_timestamp text,
  captured_by_user_id uuid not null references public.profiles (id) on delete restrict,
  privacy_mode public.external_example_privacy_mode not null default 'anonymous',
  review_status public.external_example_review_status not null default 'queued',
  parser_output jsonb not null default '{}'::jsonb,
  review_notes text,
  duplicate_of_intake_id uuid references public.external_example_intakes (id) on delete set null,
  published_post_id uuid references public.combination_posts (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_platform, source_url)
);

create table public.external_example_assets (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.external_example_intakes (id) on delete cascade,
  storage_path text not null,
  source_image_url text,
  capture_method text not null default 'download',
  width integer,
  height integer,
  sha256 text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (intake_id, sort_order)
);

create table public.external_example_glaze_mentions (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.external_example_intakes (id) on delete cascade,
  freeform_text text not null,
  matched_glaze_id uuid references public.glazes (id) on delete set null,
  confidence numeric(4, 3) not null default 0,
  mention_order integer not null default 0,
  is_approved boolean not null default false,
  approved_by_user_id uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index external_example_intakes_status_idx
on public.external_example_intakes (review_status, created_at desc);

create index external_example_intakes_duplicate_idx
on public.external_example_intakes (duplicate_of_intake_id);

create index external_example_assets_sha_idx
on public.external_example_assets (sha256);

create index external_example_assets_intake_idx
on public.external_example_assets (intake_id, sort_order, created_at);

create index external_example_mentions_intake_idx
on public.external_example_glaze_mentions (intake_id, mention_order, created_at);

create index external_example_mentions_glaze_idx
on public.external_example_glaze_mentions (matched_glaze_id, is_approved);

create or replace function public.set_updated_at_external_example_intakes()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_external_example_intakes_updated_at
before update on public.external_example_intakes
for each row execute procedure public.set_updated_at_external_example_intakes();

alter table public.external_example_intakes enable row level security;
alter table public.external_example_assets enable row level security;
alter table public.external_example_glaze_mentions enable row level security;

create policy "admins manage external example intakes"
on public.external_example_intakes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage external example assets"
on public.external_example_assets
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage external example glaze mentions"
on public.external_example_glaze_mentions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('external-example-imports', 'external-example-imports', false)
on conflict (id) do nothing;

create policy "admins can view imported external example assets"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'external-example-imports'
  and public.is_admin()
);

create policy "admins can upload imported external example assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'external-example-imports'
  and public.is_admin()
);

create policy "admins can update imported external example assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'external-example-imports'
  and public.is_admin()
)
with check (
  bucket_id = 'external-example-imports'
  and public.is_admin()
);

create policy "admins can delete imported external example assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'external-example-imports'
  and public.is_admin()
);
