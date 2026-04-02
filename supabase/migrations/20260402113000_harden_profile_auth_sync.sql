alter table public.profiles
add column if not exists updated_at timestamptz not null default now();

update public.profiles as profiles
set
  email = users.email,
  display_name = coalesce(
    users.raw_user_meta_data ->> 'display_name',
    profiles.display_name,
    split_part(coalesce(users.email, ''), '@', 1),
    'Guest Potter'
  ),
  updated_at = now()
from auth.users as users
where users.id = profiles.id;

create unique index if not exists profiles_email_unique_idx
on public.profiles (email)
where email is not null;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_profiles_updated_at();

create or replace function public.handle_auth_user_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
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
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_profile_sync();

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
after update on auth.users
for each row
when (
  old.email is distinct from new.email
  or old.raw_user_meta_data is distinct from new.raw_user_meta_data
)
execute procedure public.handle_auth_user_profile_sync();
