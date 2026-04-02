alter table public.profiles
add column preferred_cone text,
add column preferred_atmosphere text,
add column restrict_to_preferred_examples boolean not null default false;
