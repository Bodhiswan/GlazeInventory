-- ─── Combination Comments ────────────────────────────────────────────────────
create table if not exists combination_comments (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references user_combination_examples(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 1000),
  created_at timestamptz not null default now()
);

create index idx_combination_comments_example on combination_comments(example_id);

alter table combination_comments enable row level security;

create policy "Anyone can read combination comments"
  on combination_comments for select using (true);

create policy "Authenticated users can insert combination comments"
  on combination_comments for insert
  to authenticated
  with check (auth.uid() = author_user_id);

create policy "Authors can delete own combination comments"
  on combination_comments for delete
  to authenticated
  using (auth.uid() = author_user_id);

-- ─── Combination Ratings ─────────────────────────────────────────────────────
create table if not exists combination_ratings (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references user_combination_examples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (example_id, user_id)
);

create index idx_combination_ratings_example on combination_ratings(example_id);

alter table combination_ratings enable row level security;

create policy "Anyone can read combination ratings"
  on combination_ratings for select using (true);

create policy "Authenticated users can upsert own combination rating"
  on combination_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated users can update own combination rating"
  on combination_ratings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── User Favourites (glazes + combinations) ────────────────────────────────
create table if not exists user_favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('glaze', 'combination')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index idx_user_favourites_user on user_favourites(user_id);
create index idx_user_favourites_target on user_favourites(target_type, target_id);

alter table user_favourites enable row level security;

create policy "Users can read own favourites"
  on user_favourites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own favourites"
  on user_favourites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own favourites"
  on user_favourites for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── Analytics Events (if not already existing) ─────────────────────────────
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  glaze_id uuid references glazes(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_analytics_events_type on analytics_events(event_type);
create index idx_analytics_events_created on analytics_events(created_at);

alter table analytics_events enable row level security;

create policy "Authenticated users can insert analytics events"
  on analytics_events for insert
  to authenticated
  with check (true);

create policy "Anon users can insert analytics events"
  on analytics_events for insert
  to anon
  with check (true);

create policy "Admins can read analytics events"
  on analytics_events for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );
