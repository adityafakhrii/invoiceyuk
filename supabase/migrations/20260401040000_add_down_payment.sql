-- Add down_payment, dp_type, dp_percent, and currency to invoices table

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS down_payment NUMERIC,
ADD COLUMN IF NOT EXISTS dp_type TEXT,
ADD COLUMN IF NOT EXISTS dp_percent NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';

-- Create Invoice RPC
DROP FUNCTION IF EXISTS public.create_invoice(uuid, text, text, text, text, text, text, date, date, jsonb, numeric, text, jsonb, text, text, text, jsonb, text, text, text);

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
    _user_id, TRIM(_invoice_number), TRIM(_business_name), _business_logo, TRIM(_client_name),
    _client_contact, _client_address, _invoice_date, _due_date, _items,
    _tax, _notes, _payment_info, _signature_name, _signature_image,
    _signature_font, _social_media, _status, _template, NULLIF(TRIM(_category), ''),
    _down_payment, _dp_type, _dp_percent, _currency
  )
  RETURNING id INTO new_invoice_id;
  
  RETURN new_invoice_id;
END;
$$;

-- Update Invoice RPC
DROP FUNCTION IF EXISTS public.update_invoice(uuid, uuid, text, text, text, text, text, text, date, date, jsonb, numeric, text, jsonb, text, text, text, jsonb, text, text, text);

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
BEGIN
  -- Validate IDs
  IF _invoice_id IS NULL THEN
    RAISE EXCEPTION 'Invoice ID is required';
  END IF;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
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
  WHERE id = _invoice_id AND user_id = _user_id;
  
  RETURN FOUND;
END;
$$;

-- Fetch User Invoices RPC
DROP FUNCTION IF EXISTS public.fetch_user_invoices(uuid);

CREATE FUNCTION public.fetch_user_invoices(_user_id uuid)
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.user_id, i.invoice_number, i.business_name, i.business_logo,
         i.client_name, i.client_contact, i.client_address, i.invoice_date,
         i.due_date, i.items, i.tax, i.notes, i.payment_info,
         i.signature_name, i.signature_image, i.signature_font, i.social_media,
         i.status, i.template, i.created_at, i.updated_at, i.category,
         i.down_payment, i.dp_type, i.dp_percent, i.currency
  FROM public.invoices i
  WHERE i.user_id = _user_id
  ORDER BY i.created_at DESC;
END;
$$;
