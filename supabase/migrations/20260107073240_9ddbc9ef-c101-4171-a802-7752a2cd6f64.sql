-- =====================================================
-- SECURITY FIX: Remove publicly accessible auth data
-- =====================================================

-- 1. Remove public read policy on pin_users (exposes usernames and hashed PINs)
-- SECURITY DEFINER functions bypass RLS, so login still works
DROP POLICY IF EXISTS "Allow public PIN verification" ON public.pin_users;

-- 2. Remove public read policy on user_roles (exposes which users are admins)
DROP POLICY IF EXISTS "Allow public role read" ON public.user_roles;

-- =====================================================
-- SECURITY FIX: Add server-side admin authorization
-- =====================================================

-- 3. Update create_pin_user to require admin caller
CREATE OR REPLACE FUNCTION public.create_pin_user(
  _name TEXT, 
  _username TEXT, 
  _pin TEXT, 
  _role app_role DEFAULT 'user'::app_role,
  _caller_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  caller_role app_role;
  user_count INTEGER;
BEGIN
  -- Check if this is the first user (bootstrap scenario)
  SELECT COUNT(*) INTO user_count FROM public.pin_users;
  
  IF user_count = 0 THEN
    -- Allow first user creation without admin check (bootstrap)
    NULL;
  ELSE
    -- Require admin privileges for subsequent user creation
    IF _caller_id IS NULL THEN
      RAISE EXCEPTION 'Caller ID is required for user creation';
    END IF;
    
    SELECT role INTO caller_role 
    FROM public.user_roles 
    WHERE user_id = _caller_id;
    
    IF caller_role IS NULL OR caller_role != 'admin' THEN
      RAISE EXCEPTION 'Only admins can create users';
    END IF;
  END IF;

  -- Hash the PIN with bcrypt (cost factor 10)
  INSERT INTO public.pin_users (name, username, pin)
  VALUES (_name, _username, crypt(_pin, gen_salt('bf', 10)))
  RETURNING id INTO new_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, _role);
  
  RETURN new_user_id;
END;
$$;

-- 4. Update delete_pin_user to require admin caller
CREATE OR REPLACE FUNCTION public.delete_pin_user(
  _user_id UUID,
  _caller_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
BEGIN
  -- Require admin privileges
  IF _caller_id IS NULL THEN
    RAISE EXCEPTION 'Caller ID is required for user deletion';
  END IF;
  
  SELECT role INTO caller_role 
  FROM public.user_roles 
  WHERE user_id = _caller_id;
  
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Prevent self-deletion
  IF _user_id = _caller_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  DELETE FROM public.pin_users WHERE id = _user_id;
  RETURN FOUND;
END;
$$;