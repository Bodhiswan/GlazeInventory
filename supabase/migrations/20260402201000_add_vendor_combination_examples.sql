create table public.vendor_combination_examples (
  id uuid primary key default gen_random_uuid(),
  source_vendor text not null check (source_vendor in ('Mayco')),
  source_collection text not null,
  source_key text not null unique,
  source_url text not null,
  title text not null,
  image_url text not null,
  cone text,
  atmosphere text,
  clay_body text,
  application_notes text,
  firing_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_combination_example_layers (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references public.vendor_combination_examples (id) on delete cascade,
  glaze_id uuid references public.glazes (id) on delete set null,
  glaze_code text,
  glaze_name text not null,
  layer_order integer not null,
  connector_to_next text,
  source_image_url text,
  created_at timestamptz not null default now(),
  unique (example_id, layer_order)
);

create index vendor_combination_examples_vendor_idx
on public.vendor_combination_examples (source_vendor, source_collection, cone, created_at desc);

create index vendor_combination_examples_source_url_idx
on public.vendor_combination_examples (source_url);

create index vendor_combination_example_layers_example_idx
on public.vendor_combination_example_layers (example_id, layer_order, created_at);

create index vendor_combination_example_layers_glaze_idx
on public.vendor_combination_example_layers (glaze_id, glaze_code);

create or replace function public.set_updated_at_vendor_combination_examples()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_vendor_combination_examples_updated_at
before update on public.vendor_combination_examples
for each row execute procedure public.set_updated_at_vendor_combination_examples();

alter table public.vendor_combination_examples enable row level security;
alter table public.vendor_combination_example_layers enable row level security;

create policy "members can view vendor combination examples"
on public.vendor_combination_examples
for select
to authenticated
using (true);

create policy "admins manage vendor combination examples"
on public.vendor_combination_examples
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "members can view vendor combination example layers"
on public.vendor_combination_example_layers
for select
to authenticated
using (true);

create policy "admins manage vendor combination example layers"
on public.vendor_combination_example_layers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
