-- =====================================================
-- MIGRATION: Hapus Seluruh Logika PIN & Ubah pin_users -> profiles
-- =====================================================

-- 1. Hapus Tabel & Fungsi Terkait PIN
DROP TABLE IF EXISTS public.pin_reset_requests CASCADE;
DROP FUNCTION IF EXISTS public.verify_pin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.verify_pin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_pin_user(TEXT, TEXT, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.create_pin_user(TEXT, TEXT, TEXT, app_role, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.delete_pin_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_pin_user(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.request_pin_reset(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.reset_user_pin(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.reject_pin_reset(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.change_user_pin(UUID, TEXT, TEXT) CASCADE;

-- 2. Ubah Nama Tabel pin_users Menjadi profiles
ALTER TABLE public.pin_users RENAME TO profiles;

-- 3. Hapus Kolom pin Dari Tabel profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pin;

-- 4. Perbarui Fungsi Trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sinkronkan data ke tabel profil publik
  INSERT INTO public.profiles (id, name, email, username, pekerjaan, tujuan_penggunaan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User Baru'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', LOWER(SPLIT_PART(NEW.email, '@', 1))),
    COALESCE(NEW.raw_user_meta_data->>'pekerjaan', ''),
    COALESCE(NEW.raw_user_meta_data->>'tujuan_penggunaan', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    pekerjaan = EXCLUDED.pekerjaan,
    tujuan_penggunaan = EXCLUDED.tujuan_penggunaan;

  -- Berikan role default 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 5. Perbarui Fungsi Utility transfer_invoices_to_email
CREATE OR REPLACE FUNCTION public.transfer_invoices_to_email(old_username TEXT, new_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_user_uuid UUID;
  new_user_uuid UUID;
BEGIN
  -- 1. Cari ID user demo lama berdasarkan username atau nama
  SELECT id INTO old_user_uuid
  FROM public.profiles
  WHERE LOWER(username) = LOWER(old_username) OR LOWER(name) = LOWER(old_username)
  LIMIT 1;

  -- 2. Cari ID user baru berdasarkan email terdaftar di auth.users
  SELECT id INTO new_user_uuid
  FROM auth.users
  WHERE LOWER(email) = LOWER(new_email)
  LIMIT 1;

  IF old_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User lama dengan username % tidak ditemukan', old_username;
  END IF;

  IF new_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User baru dengan email % tidak ditemukan di Auth Supabase', new_email;
  END IF;

  -- 3. Pindahkan user_id invoice ke user baru
  UPDATE public.invoices
  SET user_id = new_user_uuid
  WHERE user_id = old_user_uuid;

  -- 4. Hapus profil lama agar bersih
  DELETE FROM public.profiles WHERE id = old_user_uuid;

  RETURN TRUE;
END;
$$;
