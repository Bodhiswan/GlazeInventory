-- Store the studio passcode in plain text alongside the hash so the owner
-- can see it again from their studio tab. Passcodes are 4 digits and only
-- gate a public read view, so the security trade-off is acceptable.

alter table public.studios add column if not exists passcode text;
update public.studios set passcode = '0000' where passcode is null;
alter table public.studios alter column passcode set not null;
