-- Add tax_type column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'addition';
