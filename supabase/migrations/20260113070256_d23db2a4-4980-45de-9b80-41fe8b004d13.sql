-- =====================================================
-- SECURITY FIX: Lock down pin_users and user_roles tables
-- and create secure RPC for admin user listing
-- =====================================================

-- 1. Add restrictive RLS policy to pin_users (blocks all direct access)
CREATE POLICY "Block direct pin_users access"
ON public.pin_users
AS RESTRICTIVE
FOR ALL
USING (false);

-- 2. Add restrictive RLS policy to user_roles (blocks all direct access)
CREATE POLICY "Block direct user_roles access"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
USING (false);

-- 3. Create RPC function for admins to list all users (with server-side authorization)
CREATE OR REPLACE FUNCTION public.list_all_users(_caller_id UUID)
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  username TEXT,
  user_role app_role,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
BEGIN
  -- Verify caller is authenticated
  IF _caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify caller is admin
  SELECT role INTO caller_role
  FROM public.user_roles
  WHERE user_roles.user_id = _caller_id;
  
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