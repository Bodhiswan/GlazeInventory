alter table public.glazes
add column if not exists description text;

create unique index if not exists glazes_shared_brand_code_idx
on public.glazes (brand, code)
where created_by_user_id is null and code is not null;
