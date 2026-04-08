-- Tracks whether a member has completed the contribution tutorial.
-- Until this is set, /contribute redirects to /contribute/welcome.
alter table public.profiles
  add column if not exists contribution_tutorial_completed_at timestamptz;
