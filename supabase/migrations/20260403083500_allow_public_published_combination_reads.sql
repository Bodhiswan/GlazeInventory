create policy "anon can view published combination pairs"
on public.combination_pairs
for select
to anon
using (true);

create policy "anon can view published member posts"
on public.combination_posts
for select
to anon
using (
  visibility = 'members'
  and status = 'published'
);
