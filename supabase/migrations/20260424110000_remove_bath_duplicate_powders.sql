-- Bath Potters sells many identical formulas in brush-on and powder formats.
-- Keep the brush-on catalog row where a matching powder row exists, and keep
-- powder rows only when there is no brush-on equivalent.
with duplicate_powders as (
  select powder.id
  from public.glazes powder
  where powder.brand = 'Bath Potters'
    and powder.created_by_user_id is null
    and powder.line in ('Bath Potters Stoneware Glaze Powders', 'Bath Potters Earthenware Powder Glazes')
    and exists (
      select 1
      from public.glazes brush
      where brush.brand = 'Bath Potters'
        and brush.created_by_user_id is null
        and brush.line in ('Bath Potters Stoneware Brush-On Glazes', 'Bath Potters Earthenware Brush-On Glazes')
        and regexp_replace(upper(coalesce(brush.code, '')), '(SB|P)$', '') =
          regexp_replace(regexp_replace(upper(coalesce(powder.code, '')), '-1$', ''), '(SB|P)$', '')
    )
), deleted_firing as (
  delete from public.glaze_firing_images
  where glaze_id in (select id from duplicate_powders)
)
delete from public.glazes
where id in (select id from duplicate_powders);
