insert into public.glazes (
  source_type,
  brand,
  line,
  code,
  name,
  cone,
  atmosphere,
  finish_notes,
  color_notes
)
values
  (
    'commercial',
    'Mayco',
    'Stoneware',
    'SW-118',
    'Sea Salt',
    'Cone 6',
    'Oxidation',
    'Gloss break',
    'Cream with warm float'
  ),
  (
    'commercial',
    'Mayco',
    'Stoneware',
    'SW-152',
    'Tiger''s Eye',
    'Cone 6',
    'Oxidation',
    'Fluid gloss',
    'Iron brown with amber breaks'
  ),
  (
    'commercial',
    'Mayco',
    'Stoneware',
    'SW-001',
    'Stoneware Clear',
    'Cone 6',
    'Oxidation',
    'Clear gloss',
    'Transparent'
  ),
  (
    'commercial',
    'Amaco',
    'Potter''s Choice',
    'PC-20',
    'Blue Rutile',
    'Cone 5/6',
    'Oxidation',
    'Gloss with movement',
    'Blue, cream and rutile streaking'
  ),
  (
    'commercial',
    'Amaco',
    'Potter''s Choice',
    'PC-12',
    'Blue Midnight',
    'Cone 5/6',
    'Oxidation',
    'Gloss',
    'Deep glossy blue'
  ),
  (
    'commercial',
    'Amaco',
    'Celadon',
    'C-11',
    'Mixing Clear',
    'Cone 5/6',
    'Oxidation',
    'Clear gloss',
    'Transparent'
  ),
  (
    'commercial',
    'Amaco',
    'Celadon',
    'C-27',
    'Emerald Falls',
    'Cone 5/6',
    'Oxidation',
    'Gloss',
    'Gloss green'
  ),
  (
    'commercial',
    'Spectrum',
    'Stoneware',
    '1126',
    'Textured Autumn Purple',
    'Cone 4/6',
    'Oxidation',
    'Textured gloss',
    'Rust, plum, and olive breaks'
  )
on conflict do nothing;
