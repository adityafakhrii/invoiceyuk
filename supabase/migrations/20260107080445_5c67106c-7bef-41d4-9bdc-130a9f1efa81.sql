-- =====================================================
-- SECURITY FIX: Prevent RLS bypass on invoice fetch
-- =====================================================

-- 1. Create RPC function to fetch user invoices securely
CREATE OR REPLACE FUNCTION public.fetch_user_invoices(_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  invoice_number TEXT,
  business_name TEXT,
  business_logo TEXT,
  client_name TEXT,
  client_contact TEXT,
  client_address TEXT,
  invoice_date DATE,
  due_date DATE,
  items JSONB,
  tax NUMERIC,
  notes TEXT,
  payment_info JSONB,
  signature_name TEXT,
  signature_image TEXT,
  signature_font TEXT,
  social_media JSONB,
  status TEXT,
  template TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Server-side enforcement: only return invoices for the specified user
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.invoice_number,
    i.business_name,
    i.business_logo,
    i.client_name,
    i.client_contact,
    i.client_address,
    i.invoice_date,
    i.due_date,
    i.items,
    i.tax,
    i.notes,
    i.payment_info,
    i.signature_name,
    i.signature_image,
    i.signature_font,
    i.social_media,
    i.status,
    i.template,
    i.created_at,
    i.updated_at
  FROM public.invoices i
  WHERE i.user_id = _user_id
  ORDER BY i.created_at DESC;
END;
$$;

-- 2. Drop the permissive RLS policy
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;

-- 3. Create restrictive RLS policy that denies all direct access
-- SECURITY DEFINER functions bypass RLS, so all operations through RPC will still work
CREATE POLICY "Block direct invoice access"
ON public.invoices
FOR ALL
USING (false);