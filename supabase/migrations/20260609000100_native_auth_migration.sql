-- =====================================================
-- MIGRATION: Migrasi Supabase Native Auth & RLS Terbuka
-- =====================================================

-- 1. Bersihkan Kebijakan RLS Lama & Baru (Agar Skrip Bisa Dijalankan Ulang)
DROP POLICY IF EXISTS "Block direct invoice access" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Block direct pin_users access" ON public.pin_users;
DROP POLICY IF EXISTS "Allow public PIN verification" ON public.pin_users;
DROP POLICY IF EXISTS "Block direct user_roles access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public role read" ON public.user_roles;

-- Bersihkan kebijakan baru jika sudah terlanjur dibuat di percobaan sebelumnya
DROP POLICY IF EXISTS "Users can select their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.pin_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.pin_users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.pin_users;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.pin_users;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- 2. Sesuaikan Tabel Profil (public.pin_users)
ALTER TABLE public.pin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.pin_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.pin_users ADD COLUMN IF NOT EXISTS pekerjaan TEXT;
ALTER TABLE public.pin_users ADD COLUMN IF NOT EXISTS tujuan_penggunaan TEXT;
ALTER TABLE public.pin_users ALTER COLUMN pin DROP NOT NULL;

-- Pastikan relasi ke auth.users aman (menggunakan NOT VALID agar data pengguna lama non-auth tetap bisa disimpan sementara)
ALTER TABLE public.pin_users DROP CONSTRAINT IF EXISTS pin_users_id_fkey;
ALTER TABLE public.pin_users ADD CONSTRAINT pin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

-- 3. Fungsi Pemeriksa Admin (Untuk Menghindari Rekursi RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'::public.app_role
  );
$$;

-- 4. Buat Trigger Sinkronisasi Pendaftaran Pengguna Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sinkronkan data ke tabel profil publik
  INSERT INTO public.pin_users (id, name, email, username, pekerjaan, tujuan_penggunaan)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sinkronkan data pengguna auth.users yang mendaftar sebelum trigger aktif
INSERT INTO public.pin_users (id, name, email, username, pekerjaan, tujuan_penggunaan)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', 'User Baru'),
  email,
  COALESCE(raw_user_meta_data->>'username', LOWER(SPLIT_PART(email, '@', 1))),
  COALESCE(raw_user_meta_data->>'pekerjaan', ''),
  COALESCE(raw_user_meta_data->>'tujuan_penggunaan', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.pin_users)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Kebijakan Permissive RLS Baru pada Tabel 'invoices'
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own invoices" ON public.invoices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Kebijakan Permissive RLS Baru pada Tabel 'pin_users' (Profil)
ALTER TABLE public.pin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.pin_users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.pin_users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.pin_users
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles" ON public.pin_users
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- 7. Kebijakan Permissive RLS Baru pada Tabel 'user_roles'
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 8. Fungsi Utility Transfer Data Invoice
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
  FROM public.pin_users
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
  DELETE FROM public.pin_users WHERE id = old_user_uuid;

  RETURN TRUE;
END;
$$;
