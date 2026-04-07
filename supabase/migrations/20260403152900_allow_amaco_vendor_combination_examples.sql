alter table public.vendor_combination_examples
drop constraint if exists vendor_combination_examples_source_vendor_check;

alter table public.vendor_combination_examples
add constraint vendor_combination_examples_source_vendor_check
check (source_vendor in ('Mayco', 'AMACO', 'Coyote'));
