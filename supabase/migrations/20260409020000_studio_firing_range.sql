-- Studios must declare which firing range their members work in so visitors
-- only see compatible glazes/combinations. Allowed values:
--   'lowfire'  -> cone 06 (earthenware)
--   'midfire'  -> cone 6 (stoneware)
--   'both'     -> studio fires both ranges
alter table public.studios
  add column if not exists firing_range text not null default 'both'
    check (firing_range in ('lowfire','midfire','both'));

notify pgrst, 'reload schema';
