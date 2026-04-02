create policy "anon can view vendor combination examples"
on public.vendor_combination_examples
for select
to anon
using (true);

create policy "anon can view vendor combination example layers"
on public.vendor_combination_example_layers
for select
to anon
using (true);
