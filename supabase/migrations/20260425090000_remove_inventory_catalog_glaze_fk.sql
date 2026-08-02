-- inventory_items.glaze_id stores the stable semantic ID from the bundled
-- catalog JSON. The database's glazes table has its own UUIDs for imported and
-- community rows, so enforcing a FK here rejects valid catalog inventory
-- actions when those two identity spaces differ.
--
-- Catalog glazes are retained in the application bundle and are not deleted
-- through the database, so the FK's cascade behaviour is not useful. Custom
-- glaze rows are resolved explicitly by the inventory data loader instead.
alter table public.inventory_items
  drop constraint if exists inventory_items_glaze_id_fkey;

-- Removing the FK also removes its cascade behaviour for database-backed
-- custom glazes. Keep that cleanup explicit so deleting a custom glaze cannot
-- leave an orphaned inventory item behind.
create index if not exists inventory_items_glaze_id_idx
  on public.inventory_items (glaze_id);

create or replace function public.delete_inventory_for_deleted_glaze()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.inventory_items
  where glaze_id = old.id;
  return old;
end;
$$;

drop trigger if exists delete_inventory_for_deleted_glaze on public.glazes;

create trigger delete_inventory_for_deleted_glaze
after delete on public.glazes
for each row
execute function public.delete_inventory_for_deleted_glaze();
