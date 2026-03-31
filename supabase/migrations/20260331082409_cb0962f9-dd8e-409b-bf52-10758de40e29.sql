
DROP FUNCTION IF EXISTS public.fetch_user_invoices(uuid);

CREATE FUNCTION public.fetch_user_invoices(_user_id uuid)
RETURNS TABLE(
  id uuid, user_id uuid, invoice_number text, business_name text, business_logo text,
  client_name text, client_contact text, client_address text, invoice_date date,
  due_date date, items jsonb, tax numeric, notes text, payment_info jsonb,
  signature_name text, signature_image text, signature_font text, social_media jsonb,
  status text, template text, created_at timestamptz, updated_at timestamptz, category text
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
         i.status, i.template, i.created_at, i.updated_at, i.category
  FROM public.invoices i
  WHERE i.user_id = _user_id
  ORDER BY i.created_at DESC;
END;
$$;
