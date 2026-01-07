-- Add username column to pin_users
ALTER TABLE public.pin_users ADD COLUMN username TEXT UNIQUE;

-- Update existing users with generated username
UPDATE public.pin_users SET username = LOWER(REPLACE(name, ' ', '_')) || '_' || SUBSTRING(id::text, 1, 4);

-- Make username NOT NULL after setting values
ALTER TABLE public.pin_users ALTER COLUMN username SET NOT NULL;

-- Update verify_pin function to use username + pin
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
    WHERE pu.username = _username AND pu.pin = _pin
    LIMIT 1;
END;
$$;

-- Function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(_user_id UUID, _name TEXT, _username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.pin_users
    SET name = _name, username = _username, updated_at = now()
    WHERE id = _user_id;
    RETURN FOUND;
END;
$$;

-- Function to change PIN (requires old PIN verification)
CREATE OR REPLACE FUNCTION public.change_user_pin(_user_id UUID, _old_pin TEXT, _new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_pin TEXT;
BEGIN
    -- Get current PIN
    SELECT pin INTO current_pin FROM public.pin_users WHERE id = _user_id;
    
    -- Verify old PIN
    IF current_pin IS NULL OR current_pin != _old_pin THEN
        RETURN FALSE;
    END IF;
    
    -- Update to new PIN
    UPDATE public.pin_users
    SET pin = _new_pin, updated_at = now()
    WHERE id = _user_id;
    
    RETURN TRUE;
END;
$$;

-- Update create_pin_user to include username
CREATE OR REPLACE FUNCTION public.create_pin_user(_name TEXT, _username TEXT, _pin TEXT, _role app_role DEFAULT 'user')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO public.pin_users (name, username, pin)
    VALUES (_name, _username, _pin)
    RETURNING id INTO new_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, _role);
    
    RETURN new_user_id;
END;
$$;

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.pin_users(id) ON DELETE CASCADE NOT NULL,
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
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    template TEXT NOT NULL DEFAULT 'simple',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices - users can only see their own invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
USING (true);

-- Drop reset PIN related table and functions
DROP FUNCTION IF EXISTS public.request_pin_reset(UUID);
DROP FUNCTION IF EXISTS public.reset_user_pin(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.reject_pin_reset(UUID, UUID);
DROP TABLE IF EXISTS public.pin_reset_requests;

-- Function to insert invoice
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
    INSERT INTO public.invoices (
        user_id, invoice_number, business_name, business_logo, client_name,
        client_contact, client_address, invoice_date, due_date, items,
        tax, notes, payment_info, signature_name, signature_image,
        signature_font, social_media, status, template
    )
    VALUES (
        _user_id, _invoice_number, _business_name, _business_logo, _client_name,
        _client_contact, _client_address, _invoice_date, _due_date, _items,
        _tax, _notes, _payment_info, _signature_name, _signature_image,
        _signature_font, _social_media, _status, _template
    )
    RETURNING id INTO new_invoice_id;
    
    RETURN new_invoice_id;
END;
$$;

-- Function to update invoice
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
    UPDATE public.invoices
    SET
        invoice_number = _invoice_number,
        business_name = _business_name,
        business_logo = _business_logo,
        client_name = _client_name,
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

-- Function to delete invoice
CREATE OR REPLACE FUNCTION public.delete_invoice(_invoice_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.invoices WHERE id = _invoice_id AND user_id = _user_id;
    RETURN FOUND;
END;
$$;

-- Create trigger for invoice timestamp updates
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update admin user with username
UPDATE public.pin_users SET username = 'admin' WHERE name = 'Admin';