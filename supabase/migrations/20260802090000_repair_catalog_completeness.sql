-- Repair catalogue rows that were omitted or mis-mapped in earlier exports.
-- Source references: Mayco, AMACO and Coyote product pages in the local vendor feeds.

do $$
begin
  if exists (
    select 1
    from public.glazes
    where brand = 'Mayco'
      and created_by_user_id is null
      and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'SW192'
  ) then
    update public.glazes
    set
      line = 'Stoneware',
      name = 'Amaryllis',
      cone = 'Cone 10 / Cone 6',
      description = 'Cone 6 oxidation (large photo): Amaryllis is a glossy, transparent, coral glaze with crystals in varying sizes that bloom into shades of brown, yellow, and orange. Cone 10 reduction (small photo): Glaze fades to a transparent pink. Crystals soften. Glaze remains stable. TIP: SW-205 Coral is the base glaze. For a lighter crystal effect, apply 1 coat of SW-192 Amaryllis over 2 coats of SW-205 Coral. This glaze is stable, even with heavy application.',
      image_url = 'https://www.maycocolors.com/wp-content/uploads/2023/03/sw-192.jpg'
    where brand = 'Mayco'
      and created_by_user_id is null
      and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'SW192';
  else
    insert into public.glazes (
      id,
      source_type,
      brand,
      line,
      code,
      name,
      cone,
      description,
      image_url
    ) values (
      '51c595e2-2d7f-4a38-b5d9-49b40dd0378b',
      'commercial',
      'Mayco',
      'Stoneware',
      'SW-192',
      'Amaryllis',
      'Cone 10 / Cone 6',
      'Cone 6 oxidation (large photo): Amaryllis is a glossy, transparent, coral glaze with crystals in varying sizes that bloom into shades of brown, yellow, and orange. Cone 10 reduction (small photo): Glaze fades to a transparent pink. Crystals soften. Glaze remains stable. TIP: SW-205 Coral is the base glaze. For a lighter crystal effect, apply 1 coat of SW-192 Amaryllis over 2 coats of SW-205 Coral. This glaze is stable, even with heavy application.',
      'https://www.maycocolors.com/wp-content/uploads/2023/03/sw-192.jpg'
    ) on conflict (id) do update set
      line = excluded.line,
      name = excluded.name,
      cone = excluded.cone,
      description = excluded.description,
      image_url = excluded.image_url;
  end if;
end;
$$;

update public.glazes
set description = 'Cone 6: Beetle Wing is a glossy, opaque green glaze that breaks over texture and has an iridescent sheen. Semi-fluid at 3 coats. Cone 10: Beetle Wing changes to a glossy blue.'
where brand = 'Mayco'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'SW228';

do $$
declare
  source_row record;
begin
  for source_row in
    select *
    from (values
      ('98a39994-65d9-49d7-b25c-1c95f0c94664'::uuid, 'C-33', 'Celadon', 'Sandalwood', 'Cone 5 / Cone 6', 'This 100% mixable celadon glaze is a semi-translucent warm light brown like a sandy dune.', 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2257/3636/C-33_ChipSwatch__13085.1707154022.jpg?c=1'),
      ('7f34e37f-092a-4cf7-b9c5-8e43862c76c5'::uuid, 'C-50', 'Celadon', 'Cherry Blossom', 'Cone 5 / Cone 6', 'This 100% mixable celadon glaze is a glossy, soft, blushing pink that pools and accents textured ware like the ancient glazes it is created to imitate.', 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/408/2742/C-50_Cherry_Blossom__52571.1659538624.jpg?c=1'),
      ('6cba14f7-60dc-48cc-b197-14816aab920a'::uuid, 'CR-12', 'Crawls', 'Speckled White', 'Cone 5 / Cone 6', 'CR-12 is a glossy white glaze with black specks that, when fired, crawls into raised shapes of varying sizes and forms. The result is a surface marked by unpredictable, natural patterns that add unique texture and visual interest to each piece. The featured chip image of CR-12 is applied on AMACO No.30 Milk Chocolate Clay. Layering Sample Images are 2 coats over 2 coats, fired to Cone 6 Apply 1-4 even coats of glaze to cone 04 bisque. Allow each coat to dry almost fully, but before any significant cracking occurs. Crawl glazes will develop hairline cracks as they dry; handle with care. For added durability before firing, layer over an AMACO Celadon glaze or underglaze More coats create larger glaze dots, while thinner coats produce a finer bead effect. Increased coats will produce more cracks. Fire to cone 5-6 for best results These glazes are food safe when layered over AMACO Celadons.', 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2362/4094/CR-12_SpeckledWhite_1280pxX1280px_Website__69996.1747315205.jpg?c=1'),
      ('6affe1fa-42e3-49a8-810a-2d6e69dcab19'::uuid, 'HF-10', 'High Fire', 'Clear', 'Cone 5 / Cone 6', 'HF-10 Clear is a shiny bright glaze with zinc for hardness. A fabulous liner glaze or for use with cadmium underglazes Colors which work well with HF-10 Clear are: V-387 Bright Red V-388 Radiant Red V-389 Flame Orange V-390 Bright Orange V-391 Intense Yellow Colors which may shift when used with HF-10 Clear: LUG-15 Warm Gray LUG-42 Blue Green LUG-43 Dark Green V-333 Avocado V-353 Dark Green V-366 Teddy Bear Brown V-376 Hunter Green.', 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2297/3692/HF-10_Clear_37001B_6x6_Square_Tile_WEB__15248.1708018570.jpg?c=1'),
      ('b4b16968-b63a-4e6d-a56f-4270f01b8ea7'::uuid, 'HF-11', 'High Fire', 'White', 'Cone 5 / Cone 6', 'White is a glossy opaque white glaze. HF White is food-safe, safe for spray application, and great as a liner or even a base for layering other glazes. Suitable for firing cone 5 and up.', 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2298/3693/HF-11_White_37002C_6x6_Square_Tile_WEB__42744.1708018713.jpg?c=1'),
      ('844e14dc-a3b6-49d4-891b-9f7b29b613d5'::uuid, 'SH-11', 'Shino', 'Chai Gloss', 'Cone 5 / Cone 6', 'Chai Gloss Shino is a glossy, 100% mixable mid-fire glaze that yields wonderfully varied shades of cream, orange, and brown depending on the thickness of application.', 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/1975/424/SH-11_Chai_Gloss_2048px_JPG_WEB__22658.1658905730.jpg?c=1'),
      ('5d014bd2-0152-4e36-a5a7-d9e644fae757'::uuid, 'SH-12', 'Shino', 'Chai Matte', 'Cone 5 / Cone 6', 'Chai Matte Shino is a matte, 100% mixable mid-fire glaze that yields wonderfully varied shades of cream, orange, and brown depending on the thickness of application.', 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/1976/422/SH-12_Chai_Matte_2048px_JPG_WEB__19599.1658905594.jpg?c=1')
    ) as values_row(id, code, line, name, cone, description, image_url)
  loop
    update public.glazes
    set
      line = source_row.line,
      name = source_row.name,
      code = source_row.code,
      cone = source_row.cone,
      description = source_row.description,
      image_url = source_row.image_url
    where brand = 'AMACO'
      and created_by_user_id is null
      and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(source_row.code), '[^A-Z0-9]', '', 'g');

    if not found then
      insert into public.glazes (id, source_type, brand, line, code, name, cone, description, image_url)
      values (source_row.id, 'commercial', 'AMACO', source_row.line, source_row.code, source_row.name, source_row.cone, source_row.description, source_row.image_url)
      on conflict (id) do update set
        line = excluded.line,
        name = excluded.name,
        code = excluded.code,
        cone = excluded.cone,
        description = excluded.description,
        image_url = excluded.image_url;
    end if;
  end loop;
end;
$$;

update public.glazes
set
  name = 'Azure Dream',
  description = 'A deep striking blue that cascades over texture, Azure Dream is the most popular Fantasy glaze with our own students and studio members. Pots covered in this glaze have a way of stopping people in their tracks. Fantasy Glazes can vary dramatically in appearance depending on the clay body used, the thickness of application, and in some cases, the firing. They can be runny, so it''s important to test carefully.',
  image_url = 'https://www.coyoteclay.com/Images/250%20Tiles/Azure%20Dream%20MBG211.jpg'
where brand = 'Coyote'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'MBG211';

update public.glazes
set
  name = 'Hydra Scale',
  description = 'Fantasy Glazes can vary dramatically in appearance depending on the clay body used, the thickness of application, and in some cases, the firing. They can be runny, so it''s important to test carefully.',
  image_url = 'https://www.coyoteclay.com/Images/2021/Tiles/HydraScale.jpg'
where brand = 'Coyote'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'MBG220';

update public.glazes
set image_url = 'https://www.coyoteclay.com/Images/250%20Tiles/Unicorn%20Horn%20MBG215.jpg'
where brand = 'Coyote'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'MBG215';

update public.glazes
set image_url = 'https://www.coyoteclay.com/Images/2021/Tiles/PhoenixEgg.jpg'
where brand = 'Coyote'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'MBG221';

update public.glazes
set image_url = '/vendor-images/laguna/ms-200-dune-white.jpg'
where brand = 'Laguna'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'MS200';

update public.glazes
set image_url = '/vendor-images/laguna/ms-203-black-out.jpg'
where brand = 'Laguna'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'MS203';

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
  'Reference tile',
  'Cone 6',
  null,
  'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2297/3692/HF-10_Clear_37001B_6x6_Square_Tile_WEB__15248.1708018570.jpg?c=1',
  50
from public.glazes
where brand = 'AMACO'
  and created_by_user_id is null
  and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = 'HF10'
on conflict (glaze_id, label) do update set
  cone = excluded.cone,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;
