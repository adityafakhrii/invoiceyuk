
-- Fix 1: Change invoices RLS policy from PERMISSIVE to RESTRICTIVE
DROP POLICY IF EXISTS "Block direct invoice access" ON public.invoices;
CREATE POLICY "Block direct invoice access" ON public.invoices AS RESTRICTIVE FOR ALL TO public USING (false);

-- Fix 2: Create login_attempts table for brute-force protection
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Block direct login_attempts access" ON public.login_attempts AS RESTRICTIVE FOR ALL TO public USING (false);

-- Create index for efficient lookups
CREATE INDEX idx_login_attempts_username_time ON public.login_attempts (username, attempted_at);

-- Auto-cleanup old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE attempted_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Fix 3: Update verify_pin to include brute-force protection
CREATE OR REPLACE FUNCTION public.verify_pin(_username text, _pin text)
RETURNS TABLE(user_id uuid, user_name text, user_role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  attempt_count INTEGER;
  clean_username TEXT;
BEGIN
  -- Validate username
  IF _username IS NULL OR LENGTH(TRIM(_username)) = 0 THEN
    RAISE EXCEPTION 'Username is required';
  END IF;
  
  -- Validate PIN format
  IF _pin IS NULL OR _pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;

  clean_username := LOWER(TRIM(_username));

  -- Cleanup old attempts
  PERFORM public.cleanup_old_login_attempts();

  -- Check brute-force: max 5 attempts per 15 minutes per username
  SELECT COUNT(*) INTO attempt_count
  FROM public.login_attempts
  WHERE login_attempts.username = clean_username
    AND attempted_at > NOW() - INTERVAL '15 minutes';

  IF attempt_count >= 5 THEN
    RAISE EXCEPTION 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.';
  END IF;

  -- Record this attempt
  INSERT INTO public.login_attempts (username) VALUES (clean_username);

  RETURN QUERY
  SELECT pu.id, pu.name, ur.role
  FROM public.pin_users pu
  LEFT JOIN public.user_roles ur ON pu.id = ur.user_id
  WHERE pu.username = clean_username
    AND pu.pin = extensions.crypt(_pin, pu.pin)
  LIMIT 1;
END;
$$;
