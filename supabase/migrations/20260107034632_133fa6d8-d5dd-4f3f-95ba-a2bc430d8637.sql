-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create pin_users table for PIN-based authentication
CREATE TABLE public.pin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from pin_users for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.pin_users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.pin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to verify PIN and get user
CREATE OR REPLACE FUNCTION public.verify_pin(_pin TEXT)
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
    WHERE pu.pin = _pin
    LIMIT 1;
END;
$$;

-- RLS Policies for pin_users - Allow public read for PIN verification
CREATE POLICY "Allow public PIN verification"
ON public.pin_users
FOR SELECT
USING (true);

-- RLS Policies for user_roles - Allow public read
CREATE POLICY "Allow public role read"
ON public.user_roles
FOR SELECT
USING (true);

-- Insert/Update/Delete only allowed via security definer functions
-- Admin management function
CREATE OR REPLACE FUNCTION public.create_pin_user(_name TEXT, _pin TEXT, _role app_role DEFAULT 'user')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Insert the user
    INSERT INTO public.pin_users (name, pin)
    VALUES (_name, _pin)
    RETURNING id INTO new_user_id;
    
    -- Insert the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, _role);
    
    RETURN new_user_id;
END;
$$;

-- Function to delete a PIN user
CREATE OR REPLACE FUNCTION public.delete_pin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.pin_users WHERE id = _user_id;
    RETURN FOUND;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pin_users_updated_at
BEFORE UPDATE ON public.pin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial admin user (PIN: 123456)
SELECT public.create_pin_user('Admin', '123456', 'admin');