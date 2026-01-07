-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update create_pin_user to hash PINs with bcrypt
CREATE OR REPLACE FUNCTION public.create_pin_user(
  _name TEXT, 
  _username TEXT, 
  _pin TEXT, 
  _role app_role DEFAULT 'user'::app_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Hash the PIN with bcrypt (cost factor 10)
  INSERT INTO public.pin_users (name, username, pin)
  VALUES (_name, _username, crypt(_pin, gen_salt('bf', 10)))
  RETURNING id INTO new_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, _role);
  
  RETURN new_user_id;
END;
$$;

-- Update verify_pin to compare hashed PINs
CREATE OR REPLACE FUNCTION public.verify_pin(_username TEXT, _pin TEXT)
RETURNS TABLE(user_id UUID, user_name TEXT, user_role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pu.id, pu.name, ur.role
  FROM public.pin_users pu
  LEFT JOIN public.user_roles ur ON pu.id = ur.user_id
  WHERE pu.username = _username 
    AND pu.pin = crypt(_pin, pu.pin)  -- Compare with stored bcrypt hash
  LIMIT 1;
END;
$$;

-- Update change_user_pin to hash new PINs
CREATE OR REPLACE FUNCTION public.change_user_pin(
  _user_id UUID, 
  _old_pin TEXT, 
  _new_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  -- Get current hashed PIN
  SELECT pin INTO stored_pin FROM public.pin_users WHERE id = _user_id;
  
  -- Verify old PIN against the hash
  IF stored_pin IS NULL OR stored_pin != crypt(_old_pin, stored_pin) THEN
    RETURN FALSE;
  END IF;
  
  -- Update to new hashed PIN
  UPDATE public.pin_users
  SET pin = crypt(_new_pin, gen_salt('bf', 10)), updated_at = now()
  WHERE id = _user_id;
  
  RETURN TRUE;
END;
$$;

-- Migrate existing plaintext PINs to bcrypt hashes
-- Only update PINs that don't start with '$2' (bcrypt hash prefix)
UPDATE public.pin_users
SET pin = crypt(pin, gen_salt('bf', 10))
WHERE pin NOT LIKE '$2%';