create table public.glaze_ratings (
  id uuid primary key default gen_random_uuid(),
  glaze_id uuid not null references public.glazes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (glaze_id, user_id)
);

create index glaze_ratings_glaze_idx on public.glaze_ratings (glaze_id, updated_at desc);
create index glaze_ratings_user_idx on public.glaze_ratings (user_id, updated_at desc);

create or replace function public.set_updated_at_glaze_ratings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_glaze_ratings_updated_at
before update on public.glaze_ratings
for each row execute procedure public.set_updated_at_glaze_ratings();

alter table public.glaze_ratings enable row level security;

create policy "members can view glaze ratings"
on public.glaze_ratings
for select
to authenticated
using (true);

create policy "members can insert their glaze ratings"
on public.glaze_ratings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "members can update their glaze ratings"
on public.glaze_ratings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "members can delete their glaze ratings"
on public.glaze_ratings
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());
