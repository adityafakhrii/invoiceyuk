-- Fix: Add _category parameter to create_invoice and update_invoice RPC functions
-- This fixes the bug where invoices fail to save because _category is sent but not accepted

DROP FUNCTION IF EXISTS public.create_invoice(uuid, text, text, text, text, text, text, date, date, jsonb, numeric, text, jsonb, text, text, text, jsonb, text, text);

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
  _template TEXT,
  _category TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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
    signature_font, social_media, status, template, category
  )
  VALUES (
    _user_id, TRIM(_invoice_number), TRIM(_business_name), _business_logo, TRIM(_client_name),
    _client_contact, _client_address, _invoice_date, _due_date, _items,
    _tax, _notes, _payment_info, _signature_name, _signature_image,
    _signature_font, _social_media, _status, _template, NULLIF(TRIM(_category), '')
  )
  RETURNING id INTO new_invoice_id;
  
  RETURN new_invoice_id;
END;
$$;

-- Update update_invoice with _category parameter
DROP FUNCTION IF EXISTS public.update_invoice(uuid, uuid, text, text, text, text, text, text, date, date, jsonb, numeric, text, jsonb, text, text, text, jsonb, text, text);

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
  _template TEXT,
  _category TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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
    category = NULLIF(TRIM(_category), ''),
    updated_at = now()
  WHERE id = _invoice_id AND user_id = _user_id;
  
  RETURN FOUND;
END;
$$;
