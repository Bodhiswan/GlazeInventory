create policy "anon can view glazes used in published member combinations"
on public.glazes
for select
to anon
using (
  created_by_user_id is null
  or exists (
    select 1
    from public.combination_pairs pair
    join public.combination_posts post
      on post.combination_pair_id = pair.id
    where post.visibility = 'members'
      and post.status = 'published'
      and (pair.glaze_a_id = glazes.id or pair.glaze_b_id = glazes.id)
  )
);
