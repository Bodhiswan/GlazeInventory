-- Track user-submitted requests for glaze brands not yet in the catalog.
create table if not exists public.glaze_brand_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  brand_name text not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists glaze_brand_requests_status_created_idx
  on public.glaze_brand_requests (status, created_at desc);

alter table public.glaze_brand_requests enable row level security;

create policy "members can insert brand requests"
  on public.glaze_brand_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users see their own brand requests"
  on public.glaze_brand_requests
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "admins can update brand requests"
  on public.glaze_brand_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
