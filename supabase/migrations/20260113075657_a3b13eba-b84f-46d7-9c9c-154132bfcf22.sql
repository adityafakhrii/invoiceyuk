-- Add comprehensive input validation to all RPC functions

-- Drop existing function overloads and recreate with validation
DROP FUNCTION IF EXISTS public.create_pin_user(text, text, text, app_role, uuid);
DROP FUNCTION IF EXISTS public.create_pin_user(text, text, text, app_role);
DROP FUNCTION IF EXISTS public.create_pin_user(text, text, app_role);

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
    -- Allow first user creation without admin check (bootstrap)
    NULL;
  ELSE
    -- Require admin privileges for subsequent user creation
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
  VALUES (TRIM(_name), LOWER(TRIM(_username)), crypt(_pin, gen_salt('bf', 10)))
  RETURNING id INTO new_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, _role);
  
  RETURN new_user_id;
END;
$$;

-- Update update_user_profile with validation
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

  UPDATE public.pin_users
  SET name = TRIM(_name), username = LOWER(TRIM(_username)), updated_at = now()
  WHERE id = _user_id;
  
  RETURN FOUND;
END;
$$;

-- Update change_user_pin with validation
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

-- Update create_invoice with validation
CREATE OR REPLACE FUNCTION public.create_invoice(
  _user_id UUID,
  _invoice_number TEXT,
  _business_name TEXT,
  _business_logo TEXT,
  _client_name TEXT,
  _client_contact TEXT,
  _client_address TEXT,
  _invoice_date DATE,
  _due_date DATE,
  _items JSONB,
  _tax NUMERIC,
  _notes TEXT,
  _payment_info JSONB,
  _signature_name TEXT,
  _signature_image TEXT,
  _signature_font TEXT,
  _social_media JSONB,
  _status TEXT,
  _template TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_invoice_id UUID;
BEGIN
  -- Validate user_id
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Validate invoice_number
  IF _invoice_number IS NULL OR LENGTH(TRIM(_invoice_number)) = 0 THEN
    RAISE EXCEPTION 'Invoice number is required';
  END IF;
  
  IF LENGTH(_invoice_number) > 50 THEN
    RAISE EXCEPTION 'Invoice number too long (max 50 characters)';
  END IF;

  -- Validate business_name
  IF _business_name IS NULL OR LENGTH(TRIM(_business_name)) = 0 THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;
  
  IF LENGTH(_business_name) > 200 THEN
    RAISE EXCEPTION 'Business name too long (max 200 characters)';
  END IF;

  -- Validate client_name
  IF _client_name IS NULL OR LENGTH(TRIM(_client_name)) = 0 THEN
    RAISE EXCEPTION 'Client name is required';
  END IF;
  
  IF LENGTH(_client_name) > 200 THEN
    RAISE EXCEPTION 'Client name too long (max 200 characters)';
  END IF;

  -- Validate items is a valid JSON array
  IF _items IS NULL OR jsonb_typeof(_items) != 'array' THEN
    RAISE EXCEPTION 'Items must be a valid JSON array';
  END IF;

  -- Validate status
  IF _status IS NULL OR _status NOT IN ('paid', 'unpaid') THEN
    RAISE EXCEPTION 'Status must be paid or unpaid';
  END IF;

  -- Validate template
  IF _template IS NULL OR _template NOT IN ('simple', 'elegant', 'corporate') THEN
    RAISE EXCEPTION 'Invalid template type';
  END IF;

  -- Validate optional text field lengths
  IF _client_contact IS NOT NULL AND LENGTH(_client_contact) > 100 THEN
    RAISE EXCEPTION 'Client contact too long (max 100 characters)';
  END IF;

  IF _client_address IS NOT NULL AND LENGTH(_client_address) > 500 THEN
    RAISE EXCEPTION 'Client address too long (max 500 characters)';
  END IF;

  IF _notes IS NOT NULL AND LENGTH(_notes) > 2000 THEN
    RAISE EXCEPTION 'Notes too long (max 2000 characters)';
  END IF;

  IF _signature_name IS NOT NULL AND LENGTH(_signature_name) > 100 THEN
    RAISE EXCEPTION 'Signature name too long (max 100 characters)';
  END IF;

  INSERT INTO public.invoices (
    user_id, invoice_number, business_name, business_logo, client_name,
    client_contact, client_address, invoice_date, due_date, items,
    tax, notes, payment_info, signature_name, signature_image,
    signature_font, social_media, status, template
  )
  VALUES (
    _user_id, TRIM(_invoice_number), TRIM(_business_name), _business_logo, TRIM(_client_name),
    _client_contact, _client_address, _invoice_date, _due_date, _items,
    _tax, _notes, _payment_info, _signature_name, _signature_image,
    _signature_font, _social_media, _status, _template
  )
  RETURNING id INTO new_invoice_id;
  
  RETURN new_invoice_id;
END;
$$;

-- Update update_invoice with validation
CREATE OR REPLACE FUNCTION public.update_invoice(
  _invoice_id UUID,
  _user_id UUID,
  _invoice_number TEXT,
  _business_name TEXT,
  _business_logo TEXT,
  _client_name TEXT,
  _client_contact TEXT,
  _client_address TEXT,
  _invoice_date DATE,
  _due_date DATE,
  _items JSONB,
  _tax NUMERIC,
  _notes TEXT,
  _payment_info JSONB,
  _signature_name TEXT,
  _signature_image TEXT,
  _signature_font TEXT,
  _social_media JSONB,
  _status TEXT,
  _template TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate IDs
  IF _invoice_id IS NULL THEN
    RAISE EXCEPTION 'Invoice ID is required';
  END IF;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Validate invoice_number
  IF _invoice_number IS NULL OR LENGTH(TRIM(_invoice_number)) = 0 THEN
    RAISE EXCEPTION 'Invoice number is required';
  END IF;
  
  IF LENGTH(_invoice_number) > 50 THEN
    RAISE EXCEPTION 'Invoice number too long (max 50 characters)';
  END IF;

  -- Validate business_name
  IF _business_name IS NULL OR LENGTH(TRIM(_business_name)) = 0 THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;
  
  IF LENGTH(_business_name) > 200 THEN
    RAISE EXCEPTION 'Business name too long (max 200 characters)';
  END IF;

  -- Validate client_name
  IF _client_name IS NULL OR LENGTH(TRIM(_client_name)) = 0 THEN
    RAISE EXCEPTION 'Client name is required';
  END IF;
  
  IF LENGTH(_client_name) > 200 THEN
    RAISE EXCEPTION 'Client name too long (max 200 characters)';
  END IF;

  -- Validate items is a valid JSON array
  IF _items IS NULL OR jsonb_typeof(_items) != 'array' THEN
    RAISE EXCEPTION 'Items must be a valid JSON array';
  END IF;

  -- Validate status
  IF _status IS NULL OR _status NOT IN ('paid', 'unpaid') THEN
    RAISE EXCEPTION 'Status must be paid or unpaid';
  END IF;

  -- Validate template
  IF _template IS NULL OR _template NOT IN ('simple', 'elegant', 'corporate') THEN
    RAISE EXCEPTION 'Invalid template type';
  END IF;

  -- Validate optional text field lengths
  IF _client_contact IS NOT NULL AND LENGTH(_client_contact) > 100 THEN
    RAISE EXCEPTION 'Client contact too long (max 100 characters)';
  END IF;

  IF _client_address IS NOT NULL AND LENGTH(_client_address) > 500 THEN
    RAISE EXCEPTION 'Client address too long (max 500 characters)';
  END IF;

  IF _notes IS NOT NULL AND LENGTH(_notes) > 2000 THEN
    RAISE EXCEPTION 'Notes too long (max 2000 characters)';
  END IF;

  IF _signature_name IS NOT NULL AND LENGTH(_signature_name) > 100 THEN
    RAISE EXCEPTION 'Signature name too long (max 100 characters)';
  END IF;

  UPDATE public.invoices
  SET
    invoice_number = TRIM(_invoice_number),
    business_name = TRIM(_business_name),
    business_logo = _business_logo,
    client_name = TRIM(_client_name),
    client_contact = _client_contact,
    client_address = _client_address,
    invoice_date = _invoice_date,
    due_date = _due_date,
    items = _items,
    tax = _tax,
    notes = _notes,
    payment_info = _payment_info,
    signature_name = _signature_name,
    signature_image = _signature_image,
    signature_font = _signature_font,
    social_media = _social_media,
    status = _status,
    template = _template,
    updated_at = now()
  WHERE id = _invoice_id AND user_id = _user_id;
  
  RETURN FOUND;
END;
$$;

-- Update delete_invoice with validation
DROP FUNCTION IF EXISTS public.delete_invoice(uuid, uuid);

CREATE OR REPLACE FUNCTION public.delete_invoice(
  _invoice_id UUID,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate IDs
  IF _invoice_id IS NULL THEN
    RAISE EXCEPTION 'Invoice ID is required';
  END IF;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  DELETE FROM public.invoices WHERE id = _invoice_id AND user_id = _user_id;
  RETURN FOUND;
END;
$$;

-- Update verify_pin with validation (username version)
DROP FUNCTION IF EXISTS public.verify_pin(text, text);
DROP FUNCTION IF EXISTS public.verify_pin(text);

CREATE OR REPLACE FUNCTION public.verify_pin(
  _username TEXT,
  _pin TEXT
)
RETURNS TABLE(user_id UUID, user_name TEXT, user_role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND pu.pin = crypt(_pin, pu.pin)
  LIMIT 1;
END;
$$;