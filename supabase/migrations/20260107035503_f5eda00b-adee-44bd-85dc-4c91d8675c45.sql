-- Create table for PIN reset requests
CREATE TABLE public.pin_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.pin_users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES public.pin_users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.pin_reset_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read for checking status
CREATE POLICY "Allow public read reset requests"
ON public.pin_reset_requests
FOR SELECT
USING (true);

-- Function to request PIN reset
CREATE OR REPLACE FUNCTION public.request_pin_reset(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_id UUID;
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM public.pin_users WHERE id = _user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check if there's already a pending request
    IF EXISTS (SELECT 1 FROM public.pin_reset_requests WHERE user_id = _user_id AND status = 'pending') THEN
        RAISE EXCEPTION 'Pending request already exists';
    END IF;
    
    -- Create new request
    INSERT INTO public.pin_reset_requests (user_id)
    VALUES (_user_id)
    RETURNING id INTO request_id;
    
    RETURN request_id;
END;
$$;

-- Function to reset user PIN (admin only)
CREATE OR REPLACE FUNCTION public.reset_user_pin(_user_id UUID, _new_pin TEXT, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the PIN
    UPDATE public.pin_users
    SET pin = _new_pin, updated_at = now()
    WHERE id = _user_id;
    
    -- Update any pending requests to approved
    UPDATE public.pin_reset_requests
    SET status = 'approved', processed_at = now(), processed_by = _admin_id
    WHERE user_id = _user_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$;

-- Function to reject PIN reset request
CREATE OR REPLACE FUNCTION public.reject_pin_reset(_request_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.pin_reset_requests
    SET status = 'rejected', processed_at = now(), processed_by = _admin_id
    WHERE id = _request_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$;