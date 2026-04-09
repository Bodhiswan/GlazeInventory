-- Studio pages: a public, link-only library + combinations view that a studio
-- owner can share with members who don't necessarily have an account.

create extension if not exists pgcrypto;

-- ─── studios ────────────────────────────────────────────────────────────────
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  display_name text not null,
  passcode_hash text not null,
  rename_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studios_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,15}$'),
  constraint studios_owner_unique unique (owner_user_id)
);

create unique index if not exists studios_slug_key on public.studios (lower(slug));

-- A history of every slug a studio has used so old links 404 cleanly and
-- we can audit name churn (limit 3 renames enforced in application code).
create table if not exists public.studio_slug_history (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  slug text not null,
  retired_at timestamptz not null default now()
);
create index if not exists studio_slug_history_studio_idx on public.studio_slug_history (studio_id);

-- ─── inventory items: shared_with_studio flag ──────────────────────────────
alter table public.inventory_items
  add column if not exists shared_with_studio boolean not null default false;

create index if not exists inventory_items_shared_with_studio_idx
  on public.inventory_items (user_id)
  where shared_with_studio = true;

-- ─── visitor logs ──────────────────────────────────────────────────────────
-- Anonymous visitors must enter name + contact + studio passcode before
-- viewing the page. We log each successful gate pass for the studio owner.
create table if not exists public.studio_visitor_logs (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  visitor_name text not null,
  visitor_contact text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists studio_visitor_logs_studio_idx
  on public.studio_visitor_logs (studio_id, created_at desc);

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.studios enable row level security;
alter table public.studio_slug_history enable row level security;
alter table public.studio_visitor_logs enable row level security;

-- Studios: anyone (incl. anon) may read so the public page works; only owner
-- may insert / update / delete.
drop policy if exists "studios_public_read" on public.studios;
create policy "studios_public_read" on public.studios
  for select using (true);

drop policy if exists "studios_owner_write" on public.studios;
create policy "studios_owner_write" on public.studios
  for all using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

-- Slug history: public read (so old slugs can be looked up), owner write.
drop policy if exists "studio_slug_history_public_read" on public.studio_slug_history;
create policy "studio_slug_history_public_read" on public.studio_slug_history
  for select using (true);

drop policy if exists "studio_slug_history_owner_write" on public.studio_slug_history;
create policy "studio_slug_history_owner_write" on public.studio_slug_history
  for all using (
    exists (
      select 1 from public.studios s
      where s.id = studio_id and s.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.studios s
      where s.id = studio_id and s.owner_user_id = (select auth.uid())
    )
  );

-- Visitor logs: only the owning studio may read; the server (service role)
-- writes after passcode validation, so we don't need an anon insert policy.
drop policy if exists "studio_visitor_logs_owner_read" on public.studio_visitor_logs;
create policy "studio_visitor_logs_owner_read" on public.studio_visitor_logs
  for select using (
    exists (
      select 1 from public.studios s
      where s.id = studio_id and s.owner_user_id = (select auth.uid())
    )
  );
