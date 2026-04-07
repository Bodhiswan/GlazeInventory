-- Storage bucket for custom glaze images
insert into storage.buckets (id, name, public)
values ('custom-glaze-images', 'custom-glaze-images', true)
on conflict (id) do nothing;

create policy "authenticated users can upload custom glaze images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'custom-glaze-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "anyone can view custom glaze images"
on storage.objects
for select
using (bucket_id = 'custom-glaze-images');

create policy "owners can delete their custom glaze images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'custom-glaze-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow members to insert firing images for their own custom glazes
create policy "members can add firing images to their own custom glazes"
on public.glaze_firing_images
for insert
to authenticated
with check (
  exists (
    select 1 from public.glazes
    where id = glaze_firing_images.glaze_id
    and created_by_user_id = auth.uid()
    and source_type = 'nonCommercial'
  )
);

-- Allow members to delete firing images from their own custom glazes
create policy "members can delete firing images from their own custom glazes"
on public.glaze_firing_images
for delete
to authenticated
using (
  exists (
    select 1 from public.glazes
    where id = glaze_firing_images.glaze_id
    and created_by_user_id = auth.uid()
    and source_type = 'nonCommercial'
  )
);
