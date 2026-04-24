-- Generated from official AMACO catalog image URLs on 2026-04-24.
-- Adds reference firing images for AMACO glazes that had no firing-image row yet.
insert into public.glaze_firing_images (
  glaze_id,
  label,
  cone,
  atmosphere,
  image_url,
  sort_order
)
select
  glazes.id,
  source.label,
  source.cone,
  source.atmosphere,
  source.image_url,
  source.sort_order
from (
values
  ('SM51', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/662/3865/ProductImages_SM-51__63433.1722962425.jpg?c=1', 50),
  ('HF01', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2296/3691/HF-1_Black_37000A_6x6_Square_Tile_WEB__79155.1708018287.jpg?c=1', 50),
  ('C32', 'Reference tile', 'Cone 5', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2070/3244/C-32_Ochre_Cone5_Chip-HiRes__71498.1663157610.jpg?c=1', 50),
  ('PC71', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2103/3281/PC-71Flambe_GlazeChip_6x6__44221.1663170895.jpg?c=1', 50),
  ('C25', 'Reference tile', 'Cone 5', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2066/3240/C-25_Downpour_Cone5_Chip-hiRes__46866.1663156666.jpg?c=1', 50),
  ('PC67', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2101/3279/PC-67_6x6_Label_Tile_Chip__16686.1663170316.jpg?c=1', 50),
  ('PC66', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2100/3278/PC_CosmicOilspot_6x6Labeltile_WEB__76300.1663170137.jpg?c=1', 50),
  ('PC64', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2098/3276/PC-64_Aventurine__46364.1663169684.jpg?c=1', 50),
  ('PC63', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2097/3275/PC-63_Cosmic_Tea_Dust__35816.1663169398.jpg?c=1', 50),
  ('PC47', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2094/3272/PC-47_6x6_Label_Tile_Chip-hires__26762.1663168805.jpg?c=1', 50),
  ('PC26', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2092/3270/PC-26_6x6_Label_Tile_Chip-hires__00493.1663168137.jpg?c=1', 50),
  ('PC38', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2093/3271/PC-38_Iron_Yellow__39409.1663168567.jpg?c=1', 50),
  ('C29', 'Reference tile', 'Cone 5', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2068/3242/C-29_Deep_Sea_Cone5_Chip-HiRes__73310.1663157062.jpg?c=1', 50),
  ('PC24', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2091/3269/PC-24_Sapphire_Float__80525.1663167957.jpg?c=1', 50),
  ('C41', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/404/2757/C-41_Pear__71036.1659539373.jpg?c=1', 50),
  ('PC22', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2090/3268/PC-22_6x6_Label_Tile_Chip__14122.1663167729.jpg?c=1', 50),
  ('PC65', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2099/3277/PC_BlackAventuring_6x6Labeltile_WEB__70396.1663169904.jpg?c=1', 50),
  ('PC16', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2088/3266/PC_PurpleCrystal_6x6Labeltile_WEB__54000.1663165185.jpg?c=1', 50),
  ('C55', 'Reference tile', 'Cone 5', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2072/3246/C-55_Poppy_Cone5_Chip-HiRes__73668.1663157878.jpg?c=1', 50),
  ('C40', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/403/2758/C-40_Aqua__34265.1659539477.jpg?c=1', 50),
  ('PC09', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2084/3260/PC-9VintageGold_GlazeChip_6x6__83854.1663164155.jpg?c=1', 50),
  ('HF55', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/447/2698/Vase_Mini_HF-55_Jensen__70089.1659534600.jpg?c=1', 50),
  ('C19', 'Reference tile', 'Cone 5', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2064/3238/C-19_Glacier_Cone5_Chip-HiRes__70305.1663156356.jpg?c=1', 50),
  ('C36', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/402/2759/C-36_Iron__00407.1659539614.jpg?c=1', 50),
  ('TP42', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/697/1987/tp-42-granny-smith-square-hires__13741.1659372885.jpg?c=1', 50),
  ('HF142', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2302/3697/HF-142_Chartreuse_35510M_6x6_Square_Tile_WEB__97561.1708020213.jpg?c=1', 50),
  ('HF129', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2300/3695/HF-129_Baby_Blue_35506F_6x6_Square_Tile_WEB__07507.1708019910.jpg?c=1', 50),
  ('C05', 'Reference tile', 'Cone 5', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2062/3236/C-5_Charcoal_Cone5_Chip-HiRes__07124.1663155672.jpg?c=1', 50),
  ('HF127', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2301/3696/HF-127_China_Blue_35503A_6x6_Square_Tile_WEB__02160.1708020069.jpg?c=1', 50),
  ('HF56', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/448/2697/Vase_Mini_HF-56_Jensen__48059.1659534449.jpg?c=1', 50),
  ('HF125', 'Reference tile', null, null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2299/3694/HF-125_Turquoise_35505E_6x6_Square_Tile_WEB__99015.1708018968.jpg?c=1', 50),
  ('TPL03', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2243/3556/TPL-03_Onyx__09294.1694487533.jpg?c=1', 50),
  ('TPL05', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2244/3557/TPL-05_Quartz__29000.1694487534.jpg?c=1', 50),
  ('TPL23', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2247/3560/TPL-23_Aquamarine__25211.1694487535.jpg?c=1', 50),
  ('TPL27', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2248/3561/TPL-27_Zircon__49912.1694487535.jpg?c=1', 50),
  ('TPL28', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2249/3562/TPL-28_Sapphire__62521.1694487536.jpg?c=1', 50),
  ('TPL34', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2250/3563/TPL-34_Jasper__96276.1694487536.jpg?c=1', 50),
  ('TPL44', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2246/3559/TPL-44_Peridot__09998.1694487535.jpg?c=1', 50),
  ('TPL45', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2245/3558/TPL-45_Emerald__51140.1694487534.jpg?c=1', 50),
  ('TPL55', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2254/3567/TPL-55_Tanzanite__82600.1694487538.jpg?c=1', 50),
  ('TPL59', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2253/3566/TPL-59_Ruby__18226.1694487537.jpg?c=1', 50),
  ('TPL63', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2251/3564/TPL-63_Citrine__82883.1694487536.jpg?c=1', 50),
  ('TPL66', 'Reference tile', 'Cone 05', null, 'https://cdn11.bigcommerce.com/s-a0h9fhqogk/images/stencil/1280x1280/products/2252/3565/TPL-66_Fire-Opal__20883.1694487537.jpg?c=1', 50)
) as source (code, label, cone, atmosphere, image_url, sort_order)
join public.glazes
  on glazes.brand = 'AMACO'
 and glazes.created_by_user_id is null
 and regexp_replace(upper(coalesce(glazes.code, '')), '[^A-Z0-9]', '', 'g') = source.code
on conflict (glaze_id, label)
do update
set
  cone = excluded.cone,
  atmosphere = excluded.atmosphere,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;
