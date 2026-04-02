alter table public.glazes
add column if not exists editorial_summary text,
add column if not exists editorial_surface text,
add column if not exists editorial_application text,
add column if not exists editorial_firing text,
add column if not exists editorial_reviewed_at timestamptz,
add column if not exists editorial_reviewed_by_user_id uuid references public.profiles (id) on delete set null;

create index if not exists glazes_editorial_reviewed_at_idx
on public.glazes (editorial_reviewed_at desc nulls last);
