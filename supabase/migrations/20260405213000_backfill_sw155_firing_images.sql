begin;

with sw155 as (
  select id
  from public.glazes
  where brand = 'Mayco'
    and created_by_user_id is null
    and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'SW155'
  limit 1
)
delete from public.glaze_firing_images
where glaze_id in (select id from sw155);

with sw155 as (
  select id
  from public.glazes
  where brand = 'Mayco'
    and created_by_user_id is null
    and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'SW155'
  limit 1
)
insert into public.glaze_firing_images (
  glaze_id,
  label,
  cone,
  atmosphere,
  image_url,
  sort_order
)
select
  id,
  'Cone 6',
  'Cone 6',
  'oxidation',
  'https://www.maycocolors.com/wp-content/uploads/2020/10/SW-155-Winter-Wood.jpg',
  20
from sw155
union all
select
  id,
  'Cone 10',
  'Cone 10',
  'reduction',
  'https://www.maycocolors.com/wp-content/uploads/2020/09/sw-155_cone10.jpg',
  30
from sw155;

commit;
