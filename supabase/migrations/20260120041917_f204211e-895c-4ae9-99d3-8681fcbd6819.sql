-- Recreate verify_pin function using extensions.crypt
CREATE OR REPLACE FUNCTION public.verify_pin(_username text, _pin text)
 RETURNS TABLE(user_id uuid, user_name text, user_role app_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Validate username
  IF _username IS NULL OR LENGTH(TRIM(_username)) = 0 THEN
    RAISE EXCEPTION 'Username is required';
  END IF;
  
  -- Validate PIN format
  IF _pin IS NULL OR _pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;

  RETURN QUERY
  SELECT pu.id, pu.name, ur.role
  FROM public.pin_users pu
  LEFT JOIN public.user_roles ur ON pu.id = ur.user_id
  WHERE pu.username = LOWER(TRIM(_username))
    AND pu.pin = extensions.crypt(_pin, pu.pin)
  LIMIT 1;
END;
$function$;

-- Also update other functions that use crypt
CREATE OR REPLACE FUNCTION public.create_pin_user(_name text, _username text, _pin text, _role app_role DEFAULT 'user'::app_role, _caller_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_user_id UUID;
  caller_role app_role;
  user_count INTEGER;
BEGIN
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
  
  IF _username !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'Username can only contain lowercase letters, numbers, and underscores';
  END IF;
  
  -- Validate PIN (exactly 6 digits)
  IF _pin IS NULL OR _pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  
  -- Check if this is the first user (bootstrap scenario)
  SELECT COUNT(*) INTO user_count FROM public.pin_users;
  
  IF user_count = 0 THEN
    NULL;
  ELSE
    IF _caller_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
    
    SELECT role INTO caller_role 
    FROM public.user_roles 
    WHERE user_id = _caller_id;
    
    IF caller_role IS NULL OR caller_role != 'admin' THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  -- Hash the PIN with bcrypt (cost factor 10)
  INSERT INTO public.pin_users (name, username, pin)
  VALUES (TRIM(_name), LOWER(TRIM(_username)), extensions.crypt(_pin, extensions.gen_salt('bf', 10)))
  RETURNING id INTO new_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, _role);
  
  RETURN new_user_id;
END;
$function$;

-- Update change_user_pin function
CREATE OR REPLACE FUNCTION public.change_user_pin(_user_id uuid, _old_pin text, _new_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored_pin TEXT;
BEGIN
  -- Validate user_id
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Validate old PIN format
  IF _old_pin IS NULL OR _old_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'Old PIN must be exactly 6 digits';
  END IF;
  
  -- Validate new PIN format
  IF _new_pin IS NULL OR _new_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'New PIN must be exactly 6 digits';
  END IF;

  -- Get current hashed PIN
  SELECT pin INTO stored_pin FROM public.pin_users WHERE id = _user_id;
  
  -- Verify old PIN against the hash
  IF stored_pin IS NULL OR stored_pin != extensions.crypt(_old_pin, stored_pin) THEN
    RETURN FALSE;
  END IF;
  
  -- Update to new hashed PIN
  UPDATE public.pin_users
  SET pin = extensions.crypt(_new_pin, extensions.gen_salt('bf', 10)), updated_at = now()
  WHERE id = _user_id;
  
  RETURN TRUE;
END;
$function$;

-- Reset admin user with correct hashed PIN
DELETE FROM public.user_roles;
DELETE FROM public.invoices;
DELETE FROM public.pin_users;

INSERT INTO public.pin_users (id, name, username, pin)
VALUES (
  gen_random_uuid(),
  'Administrator',
  'admin',
  extensions.crypt('123321', extensions.gen_salt('bf', 10))
)
RETURNING id;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM public.pin_users WHERE username = 'admin';