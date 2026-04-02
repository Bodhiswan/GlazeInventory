-- DANGER: This removes all current users and all profile-linked app data.
-- Run this in the Supabase SQL Editor only if you want a clean auth reset.
-- It intentionally leaves the commercial glaze catalog intact.

begin;

delete from storage.objects
where bucket_id = 'glaze-posts';

delete from auth.users;

commit;
