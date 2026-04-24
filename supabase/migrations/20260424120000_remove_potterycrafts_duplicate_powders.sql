-- Remove Potterycrafts powder-form rows when the matching liquid/non-powder row exists.
with duplicate_glazes as (
  select id
  from public.glazes
  where brand = 'Potterycrafts'
    and created_by_user_id is null
    and code in (
      'P4279',
      'P4287',
      'P4348',
      'P4355',
      'P4360',
      'P4367',
      'P4370',
      'P1980',
      'P1983',
      'P1985',
      'P4101',
      'P4102',
      'P4103',
      'P4106',
      'P4107',
      'P4108',
      'P4109',
      'P4110',
      'P4111',
      'P4112',
      'P4113',
      'P4122',
      'P4123',
      'P4125',
      'P4126',
      'P4128',
      'P4144',
      'P4197'
    )
),
deleted_firing as (
  delete from public.glaze_firing_images
  where glaze_id in (select id from duplicate_glazes)
)
delete from public.glazes
where id in (select id from duplicate_glazes);
