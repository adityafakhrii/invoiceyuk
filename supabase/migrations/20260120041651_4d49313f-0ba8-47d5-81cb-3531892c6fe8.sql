-- Reset existing data
DELETE FROM public.user_roles;
DELETE FROM public.invoices;
DELETE FROM public.pin_users;

-- Create admin user with PIN 123321
INSERT INTO public.pin_users (id, name, username, pin)
VALUES (
  gen_random_uuid(),
  'Administrator',
  'admin',
  crypt('123321', gen_salt('bf', 10))
)
RETURNING id;

-- Add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM public.pin_users WHERE username = 'admin';