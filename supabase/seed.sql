-- =============================================================
-- Test seed data for local development.
-- Runs after all migrations via `supabase db reset`.
-- Creates a test user with sample user-level data so Claude
-- can verify features against a real local database.
-- =============================================================

-- Fixed UUID for the test user (deterministic so other seeds can reference it).
-- This is the well-known Supabase local test user UUID.
DO $$
DECLARE
  test_user_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  glaze_1 uuid;
  glaze_2 uuid;
  glaze_3 uuid;
  glaze_4 uuid;
  glaze_5 uuid;
  inv_item_1 uuid;
  inv_item_2 uuid;
  inv_item_3 uuid;
  folder_id uuid;
  example_1 uuid;
  example_2 uuid;
  example_3 uuid;
BEGIN

  -- =========================================================
  -- 1. Test user in auth.users + public.profiles
  -- =========================================================
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@glazelibrary.app',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Test Potter"}',
    now(),
    now(),
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;

  -- Create an identity for the test user (required for Supabase auth to work).
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    test_user_id,
    'test@glazelibrary.app',
    'email',
    jsonb_build_object('sub', test_user_id::text, 'email', 'test@glazelibrary.app'),
    now(),
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  -- The on_auth_user_created trigger auto-creates a profile row from
  -- raw_user_meta_data, but without studio_name/location. Use DO UPDATE
  -- so those fields are populated regardless of trigger ordering.
  INSERT INTO public.profiles (id, email, display_name, studio_name, location)
  VALUES (test_user_id, 'test@glazelibrary.app', 'Test Potter', 'Test Studio', 'Local Dev')
  ON CONFLICT (id) DO UPDATE SET
    studio_name = EXCLUDED.studio_name,
    location    = EXCLUDED.location;

  -- =========================================================
  -- 2. Look up 5 glazes from the catalog (loaded by migrations)
  -- =========================================================
  SELECT id INTO glaze_1 FROM public.glazes WHERE code = 'SW-118' LIMIT 1;
  SELECT id INTO glaze_2 FROM public.glazes WHERE code = 'SW-152' LIMIT 1;
  SELECT id INTO glaze_3 FROM public.glazes WHERE code = 'PC-20'  LIMIT 1;
  SELECT id INTO glaze_4 FROM public.glazes WHERE code = 'C-11'   LIMIT 1;
  SELECT id INTO glaze_5 FROM public.glazes WHERE code = 'SW-100' LIMIT 1;

  -- Guard: skip user-level seed if any catalog glazes are missing
  IF glaze_1 IS NULL OR glaze_2 IS NULL OR glaze_3 IS NULL OR glaze_4 IS NULL OR glaze_5 IS NULL THEN
    RAISE NOTICE 'Seed: catalog glazes not found — skipping user-level data.';
    RETURN;
  END IF;

  -- =========================================================
  -- 3. Favourited glazes
  -- =========================================================
  INSERT INTO public.user_favourites (user_id, target_type, target_id)
  VALUES
    (test_user_id, 'glaze', glaze_1),
    (test_user_id, 'glaze', glaze_2),
    (test_user_id, 'glaze', glaze_3),
    (test_user_id, 'glaze', glaze_4),
    (test_user_id, 'glaze', glaze_5)
  ON CONFLICT DO NOTHING;

  -- =========================================================
  -- 4. Inventory folder + 3 items (owned, wishlist, archived)
  -- =========================================================
  INSERT INTO public.inventory_items (id, user_id, glaze_id, status, personal_notes)
  VALUES
    (gen_random_uuid(), test_user_id, glaze_1, 'owned',    'My go-to liner glaze')
    RETURNING id INTO inv_item_1;

  INSERT INTO public.inventory_items (id, user_id, glaze_id, status, personal_notes)
  VALUES
    (gen_random_uuid(), test_user_id, glaze_2, 'wishlist', 'Want to try this one')
    RETURNING id INTO inv_item_2;

  INSERT INTO public.inventory_items (id, user_id, glaze_id, status, personal_notes)
  VALUES
    (gen_random_uuid(), test_user_id, glaze_3, 'archived', 'Used up, need to reorder')
    RETURNING id INTO inv_item_3;

  INSERT INTO public.inventory_folders (id, user_id, name)
  VALUES (gen_random_uuid(), test_user_id, 'Mug liners')
  RETURNING id INTO folder_id;

  INSERT INTO public.inventory_item_folders (inventory_item_id, folder_id)
  VALUES
    (inv_item_1, folder_id),
    (inv_item_3, folder_id)
  ON CONFLICT DO NOTHING;

  -- =========================================================
  -- 5. Combination examples (3 posts: 2 published, 1 draft-like)
  --    Using user_combination_examples + layers
  -- =========================================================
  INSERT INTO public.user_combination_examples
    (id, author_user_id, title, post_firing_image_path, cone, atmosphere, glazing_process, notes, status)
  VALUES
    (gen_random_uuid(), test_user_id, 'Sea Salt over Tiger''s Eye',
     'test/combo-1.jpg', '6', 'oxidation', 'Dipped base, sprayed top', 'Beautiful break on edges', 'published')
  RETURNING id INTO example_1;

  INSERT INTO public.user_combination_examples
    (id, author_user_id, title, post_firing_image_path, cone, atmosphere, glazing_process, notes, status)
  VALUES
    (gen_random_uuid(), test_user_id, 'Blue Rutile over Mixing Clear',
     'test/combo-2.jpg', '6', 'oxidation', 'Two coats each, dipped', 'Gorgeous blue pooling', 'published')
  RETURNING id INTO example_2;

  INSERT INTO public.user_combination_examples
    (id, author_user_id, title, post_firing_image_path, cone, atmosphere, notes, status)
  VALUES
    (gen_random_uuid(), test_user_id, 'Experimental - needs second test',
     'test/combo-3.jpg', '6', 'oxidation', 'Underfired, try cone 7 next time', 'hidden')
  RETURNING id INTO example_3;

  -- Layers for each example
  INSERT INTO public.user_combination_example_layers (example_id, glaze_id, layer_order) VALUES
    (example_1, glaze_2, 1),  -- Tiger's Eye (bottom)
    (example_1, glaze_1, 2),  -- Sea Salt (top)
    (example_2, glaze_4, 1),  -- Mixing Clear (bottom)
    (example_2, glaze_3, 2),  -- Blue Rutile (top)
    (example_3, glaze_1, 1),  -- Sea Salt (bottom)
    (example_3, glaze_3, 2);  -- Blue Rutile (top)

  -- =========================================================
  -- 6. Comments + ratings on the published examples
  -- =========================================================
  INSERT INTO public.combination_comments (example_id, author_user_id, body)
  VALUES
    (example_1, test_user_id, 'This turned out even better than expected!'),
    (example_2, test_user_id, 'The pooling effect is incredible at cone 6.')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.combination_ratings (example_id, user_id, rating)
  VALUES
    (example_1, test_user_id, 5),
    (example_2, test_user_id, 4)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed: test user and sample data created successfully.';

END $$;
