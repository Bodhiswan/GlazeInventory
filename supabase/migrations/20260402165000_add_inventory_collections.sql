alter type public.inventory_status add value if not exists 'wishlist';

create table public.inventory_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index inventory_folders_user_name_uidx
on public.inventory_folders (user_id, lower(name));

create table public.inventory_item_folders (
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  folder_id uuid not null references public.inventory_folders (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (inventory_item_id, folder_id)
);

create index inventory_item_folders_folder_idx
on public.inventory_item_folders (folder_id, created_at desc);

alter table public.inventory_folders enable row level security;
alter table public.inventory_item_folders enable row level security;

create policy "members manage their folders"
on public.inventory_folders
for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "members manage their folder assignments"
on public.inventory_item_folders
for all
using (
  public.is_admin()
  or (
    exists (
      select 1
      from public.inventory_items items
      where items.id = inventory_item_folders.inventory_item_id
        and items.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.inventory_folders folders
      where folders.id = inventory_item_folders.folder_id
        and folders.user_id = auth.uid()
    )
  )
)
with check (
  public.is_admin()
  or (
    exists (
      select 1
      from public.inventory_items items
      where items.id = inventory_item_folders.inventory_item_id
        and items.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.inventory_folders folders
      where folders.id = inventory_item_folders.folder_id
        and folders.user_id = auth.uid()
    )
  )
);
