/*
  # Update admin user credentials

  1. Changes
    - Update admin user credentials
    - Create admin user if not exists
    - Add policy for admin access if not exists

  2. Security
    - Ensure RLS is enabled
    - Check for existing policy before creating
*/

-- First, create the admin user in auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'trueiphones@admin.com'
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
      'trueiphones@admin.com',
      crypt('admintrue', gen_salt('bf')),
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
  SELECT id INTO auth_uid FROM auth.users WHERE email = 'trueiphones@admin.com';

  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'trueiphones@admin.com'
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
      'trueiphones@admin.com',
      'Administrador',
      'admin',
      now()
    );
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Check if policy exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admin has full access'
  ) THEN
    CREATE POLICY "Admin has full access"
      ON public.users
      FOR ALL
      TO authenticated
      USING (
        (role = 'admin' AND auth.uid() = id) OR
        (auth.uid() = id)
      );
  END IF;
END $$;