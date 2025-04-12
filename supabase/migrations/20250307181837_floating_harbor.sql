/*
  # Create admin user

  1. Changes
    - Create admin user with specified credentials
    - Set role as 'admin'
    - Enable row level security
    - Add policy for admin access

  2. Security
    - Enable RLS on users table
    - Add policy for admin user
*/

-- First, create the admin user in auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@trueiphones.com'
  ) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@trueiphones.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- Then, create the admin user in public.users
DO $$
DECLARE
  auth_uid uuid;
BEGIN
  -- Get the auth.users id
  SELECT id INTO auth_uid FROM auth.users WHERE email = 'admin@trueiphones.com';

  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'admin@trueiphones.com'
  ) THEN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      created_at
    )
    VALUES (
      auth_uid,
      'admin@trueiphones.com',
      'Administrador',
      'admin',
      now()
    );
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin to access all data
CREATE POLICY "Admin has full access"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    (role = 'admin' AND auth.uid() = id) OR
    (auth.uid() = id)
  );