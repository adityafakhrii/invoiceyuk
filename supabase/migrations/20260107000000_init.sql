-- =====================================================
-- INITIAL CONSOLIDATED SCHEMA: InvoiceYuk Database Setup
-- =====================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- 2. Profiles Table (User details mapped to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    pekerjaan TEXT,
    tujuan_penggunaan TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    UNIQUE(user_id, role)
);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    business_name TEXT NOT NULL,
    business_logo TEXT,
    client_name TEXT NOT NULL,
    client_contact TEXT,
    client_address TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    items JSONB NOT NULL,
    tax NUMERIC,
    notes TEXT,
    payment_info JSONB,
    signature_name TEXT,
    signature_image TEXT,
    signature_font TEXT,
    social_media JSONB,
    status TEXT DEFAULT 'unpaid'::text NOT NULL,
    template TEXT DEFAULT 'simple'::text NOT NULL,
    category TEXT,
    down_payment NUMERIC,
    dp_percent NUMERIC,
    dp_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Timestamps Trigger Function
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for Updated At
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- 6. Helper: Admin Verification (avoids RLS recursion)
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

-- 7. Trigger: Profile Sync on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- 8. RPC: Update Profile (called by frontend)
CREATE OR REPLACE FUNCTION public.update_user_profile(
  _user_id UUID,
  _name TEXT,
  _username TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate user_id
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Validate name
  IF _name IS NULL OR LENGTH(TRIM(_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  IF LENGTH(_name) > 100 THEN
    RAISE EXCEPTION 'Name too long (max 100 characters)';
  END IF;
  
  -- Validate username
  IF _username IS NULL OR LENGTH(TRIM(_username)) < 3 THEN
    RAISE EXCEPTION 'Username must be at least 3 characters';
  END IF;
  
  IF LENGTH(_username) > 50 THEN
    RAISE EXCEPTION 'Username too long (max 50 characters)';
  END IF;
  
  IF LOWER(TRIM(_username)) !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'Username can only contain lowercase letters, numbers, and underscores';
  END IF;

  UPDATE public.profiles
  SET name = TRIM(_name), username = LOWER(TRIM(_username)), updated_at = now()
  WHERE id = _user_id;
  
  RETURN FOUND;
END;
$$;

-- 9. RPC: Transfer Invoices (utility migration script)
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
  SELECT id INTO old_user_uuid
  FROM public.profiles
  WHERE LOWER(username) = LOWER(old_username) OR LOWER(name) = LOWER(old_username)
  LIMIT 1;

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

  UPDATE public.invoices
  SET user_id = new_user_uuid
  WHERE user_id = old_user_uuid;

  DELETE FROM public.profiles WHERE id = old_user_uuid;

  RETURN TRUE;
END;
$$;

-- 10. Row Level Security Policies
-- Profiles Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- User Roles Table Policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Invoices Table Policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own invoices" ON public.invoices;
CREATE POLICY "Users can select their own invoices" ON public.invoices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
CREATE POLICY "Users can insert their own invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. Database Index for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- Drop legacy status check constraints if they exist to allow 'cancelled' status
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS check_status;
