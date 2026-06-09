-- =====================================================
-- SECURITY FIX: Session-based authorization
-- =====================================================

-- 1. Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.pin_users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS and lock down direct access
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block direct user_sessions access" ON public.user_sessions;
CREATE POLICY "Block direct user_sessions access" 
ON public.user_sessions 
AS RESTRICTIVE 
FOR ALL 
TO public 
USING (false);

-- Index for session verification
CREATE INDEX IF NOT EXISTS idx_user_sessions_id_expires ON public.user_sessions (id, expires_at);

-- 2. Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE expires_at < now();
END;
$$;

-- 3. Update verify_pin to issue session token
DROP FUNCTION IF EXISTS public.verify_pin(text, text);

CREATE OR REPLACE FUNCTION public.verify_pin(_username text, _pin text)
RETURNS TABLE(session_token uuid, user_id uuid, user_name text, user_role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  attempt_count INTEGER;
  clean_username TEXT;
  matched_user_id UUID;
  matched_user_name TEXT;
  matched_user_role app_role;
  new_session_id UUID;
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

  -- Cleanup old attempts and expired sessions
  PERFORM public.cleanup_old_login_attempts();
  PERFORM public.cleanup_expired_sessions();

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

  -- Check user credentials
  SELECT pu.id, pu.name, COALESCE(ur.role, 'user'::app_role) INTO matched_user_id, matched_user_name, matched_user_role
  FROM public.pin_users pu
  LEFT JOIN public.user_roles ur ON pu.id = ur.user_id
  WHERE pu.username = clean_username
    AND pu.pin = extensions.crypt(_pin, pu.pin)
  LIMIT 1;

  IF matched_user_id IS NOT NULL THEN
    -- Create session token (expires in 8 hours)
    INSERT INTO public.user_sessions (user_id, expires_at)
    VALUES (matched_user_id, NOW() + INTERVAL '8 hours')
    RETURNING id INTO new_session_id;

    -- Remove login attempts on success
    DELETE FROM public.login_attempts WHERE username = clean_username;

    RETURN QUERY SELECT new_session_id, matched_user_id, matched_user_name, matched_user_role;
  END IF;
END;
$$;

-- 4. Update fetch_user_invoices to require session token
DROP FUNCTION IF EXISTS public.fetch_user_invoices(uuid);

CREATE OR REPLACE FUNCTION public.fetch_user_invoices(_session_token uuid)
RETURNS TABLE(
  id uuid, user_id uuid, invoice_number text, business_name text, business_logo text,
  client_name text, client_contact text, client_address text, invoice_date date,
  due_date date, items jsonb, tax numeric, notes text, payment_info jsonb,
  signature_name text, signature_image text, signature_font text, social_media jsonb,
  status text, template text, created_at timestamptz, updated_at timestamptz, category text,
  down_payment numeric, dp_type text, dp_percent numeric, currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id UUID;
BEGIN
  -- Validate session
  SELECT s.user_id INTO caller_id
  FROM public.user_sessions s
  WHERE s.id = _session_token AND s.expires_at > now();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or invalid';
  END IF;

  RETURN QUERY
  SELECT i.id, i.user_id, i.invoice_number, i.business_name, i.business_logo,
         i.client_name, i.client_contact, i.client_address, i.invoice_date,
         i.due_date, i.items, i.tax, i.notes, i.payment_info,
         i.signature_name, i.signature_image, i.signature_font, i.social_media,
         i.status, i.template, i.created_at, i.updated_at, i.category,
         i.down_payment, i.dp_type, i.dp_percent, i.currency
  FROM public.invoices i
  WHERE i.user_id = caller_id
  ORDER BY i.created_at DESC;
END;
$$;

-- 5. Update create_invoice to require session token
DROP FUNCTION IF EXISTS public.create_invoice(uuid, text, text, text, text, text, text, date, date, jsonb, numeric, text, jsonb, text, text, text, jsonb, text, text, text, text, numeric, text, numeric, text);

CREATE OR REPLACE FUNCTION public.create_invoice(
  _session_token UUID,
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
  _template TEXT,
  _category TEXT DEFAULT '',
  _down_payment NUMERIC DEFAULT NULL,
  _dp_type TEXT DEFAULT NULL,
  _dp_percent NUMERIC DEFAULT NULL,
  _currency TEXT DEFAULT 'IDR'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  caller_id UUID;
  new_invoice_id UUID;
BEGIN
  -- Validate session
  SELECT s.user_id INTO caller_id
  FROM public.user_sessions s
  WHERE s.id = _session_token AND s.expires_at > now();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or invalid';
  END IF;

  -- Validate invoice_number
  IF _invoice_number IS NULL OR LENGTH(TRIM(_invoice_number)) = 0 THEN
    RAISE EXCEPTION 'Invoice number is required';
  END IF;

  -- Validate business_name
  IF _business_name IS NULL OR LENGTH(TRIM(_business_name)) = 0 THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  -- Validate client_name
  IF _client_name IS NULL OR LENGTH(TRIM(_client_name)) = 0 THEN
    RAISE EXCEPTION 'Client name is required';
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

  INSERT INTO public.invoices (
    user_id, invoice_number, business_name, business_logo, client_name,
    client_contact, client_address, invoice_date, due_date, items,
    tax, notes, payment_info, signature_name, signature_image,
    signature_font, social_media, status, template, category,
    down_payment, dp_type, dp_percent, currency
  )
  VALUES (
    caller_id, TRIM(_invoice_number), TRIM(_business_name), _business_logo, TRIM(_client_name),
    _client_contact, _client_address, _invoice_date, _due_date, _items,
    _tax, _notes, _payment_info, _signature_name, _signature_image,
    _signature_font, _social_media, _status, _template, NULLIF(TRIM(_category), ''),
    _down_payment, _dp_type, _dp_percent, _currency
  )
  RETURNING id INTO new_invoice_id;
  
  RETURN new_invoice_id;
END;
$$;

-- 6. Update update_invoice to require session token
DROP FUNCTION IF EXISTS public.update_invoice(uuid, uuid, text, text, text, text, text, text, date, date, jsonb, numeric, text, jsonb, text, text, text, jsonb, text, text, text, text, numeric, text, numeric, text);

CREATE OR REPLACE FUNCTION public.update_invoice(
  _invoice_id UUID,
  _session_token UUID,
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
  _template TEXT,
  _category TEXT DEFAULT '',
  _down_payment NUMERIC DEFAULT NULL,
  _dp_type TEXT DEFAULT NULL,
  _dp_percent NUMERIC DEFAULT NULL,
  _currency TEXT DEFAULT 'IDR'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  caller_id UUID;
BEGIN
  -- Validate session
  SELECT s.user_id INTO caller_id
  FROM public.user_sessions s
  WHERE s.id = _session_token AND s.expires_at > now();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or invalid';
  END IF;

  -- Validate IDs
  IF _invoice_id IS NULL THEN
    RAISE EXCEPTION 'Invoice ID is required';
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
    category = NULLIF(TRIM(_category), ''),
    down_payment = _down_payment,
    dp_type = _dp_type,
    dp_percent = _dp_percent,
    currency = _currency,
    updated_at = now()
  WHERE id = _invoice_id AND user_id = caller_id;
  
  RETURN FOUND;
END;
$$;

-- 7. Update delete_invoice to require session token
DROP FUNCTION IF EXISTS public.delete_invoice(uuid, uuid);

CREATE OR REPLACE FUNCTION public.delete_invoice(_invoice_id UUID, _session_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id UUID;
BEGIN
  -- Validate session
  SELECT s.user_id INTO caller_id
  FROM public.user_sessions s
  WHERE s.id = _session_token AND s.expires_at > now();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or invalid';
  END IF;

  DELETE FROM public.invoices WHERE id = _invoice_id AND user_id = caller_id;
  RETURN FOUND;
END;
$$;

-- 8. Update list_all_users to require session token
DROP FUNCTION IF EXISTS public.list_all_users(uuid);

CREATE OR REPLACE FUNCTION public.list_all_users(_session_token UUID)
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  username TEXT,
  user_role app_role,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id UUID;
  caller_role app_role;
BEGIN
  -- Verify session and get caller
  SELECT s.user_id, ur.role INTO caller_id, caller_role
  FROM public.user_sessions s
  LEFT JOIN public.user_roles ur ON s.user_id = ur.user_id
  WHERE s.id = _session_token AND s.expires_at > now();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can list users';
  END IF;
  
  -- Return all users with their roles
  RETURN QUERY
  SELECT 
    pu.id AS user_id,
    pu.name AS user_name,
    pu.username,
    COALESCE(ur.role, 'user'::app_role) AS user_role,
    pu.created_at
  FROM public.pin_users pu
  LEFT JOIN public.user_roles ur ON pu.id = ur.user_id
  ORDER BY pu.created_at DESC;
END;
$$;

-- 9. Update create_pin_user to require session token
DROP FUNCTION IF EXISTS public.create_pin_user(text, text, text, app_role, uuid);

CREATE OR REPLACE FUNCTION public.create_pin_user(
  _name text, 
  _username text, 
  _pin text, 
  _role app_role DEFAULT 'user'::app_role, 
  _session_token uuid DEFAULT NULL::uuid
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  new_user_id UUID;
  caller_id UUID;
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
    IF _session_token IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Verify session and get caller role
    SELECT s.user_id, ur.role INTO caller_id, caller_role 
    FROM public.user_sessions s
    LEFT JOIN public.user_roles ur ON s.user_id = ur.user_id
    WHERE s.id = _session_token AND s.expires_at > now();
    
    IF caller_id IS NULL THEN
      RAISE EXCEPTION 'Session expired or invalid';
    END IF;
    
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
$$;

-- 10. Update delete_pin_user to require session token
DROP FUNCTION IF EXISTS public.delete_pin_user(uuid, uuid);

CREATE OR REPLACE FUNCTION public.delete_pin_user(
  _user_id UUID,
  _session_token UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id UUID;
  caller_role app_role;
BEGIN
  -- Require session and admin privileges
  IF _session_token IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify session and get caller
  SELECT s.user_id, ur.role INTO caller_id, caller_role 
  FROM public.user_sessions s
  LEFT JOIN public.user_roles ur ON s.user_id = ur.user_id
  WHERE s.id = _session_token AND s.expires_at > now();
  
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or invalid';
  END IF;
  
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Prevent self-deletion
  IF _user_id = caller_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  DELETE FROM public.pin_users WHERE id = _user_id;
  RETURN FOUND;
END;
$$;
