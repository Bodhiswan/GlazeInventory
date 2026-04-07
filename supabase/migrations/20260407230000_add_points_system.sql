-- supabase/migrations/20260407230000_add_points_system.sql

-- 1. New columns on profiles
alter table profiles
  add column if not exists points                 integer not null default 0,
  add column if not exists contribution_strikes   integer not null default 0,
  add column if not exists contributions_disabled boolean not null default false;

-- 2. Points ledger table
create table if not exists points_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  action          text not null,
  points          numeric not null,
  reference_id    uuid,
  reference_type  text,
  voided          boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists points_ledger_user_id_idx on points_ledger(user_id);
create index if not exists points_ledger_reference_id_idx on points_ledger(reference_id);
create index if not exists points_ledger_action_idx on points_ledger(action);

-- 3. RLS on points_ledger
alter table points_ledger enable row level security;

-- Members can read their own ledger rows
create policy "members_read_own_ledger"
  on points_ledger for select
  using (auth.uid() = user_id);

-- No direct inserts/updates from clients — all writes go through admin client
