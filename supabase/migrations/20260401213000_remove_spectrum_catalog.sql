delete from public.glazes
where brand = 'Spectrum'
  and created_by_user_id is null;
