-- Insert initial admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@trueiphones.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  now()
);

-- Insert user data
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  preferences,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@trueiphones.com',
  'Administrador',
  'admin',
  '{
    "theme": "light",
    "language": "pt-BR",
    "notificationPreferences": {
      "email": true,
      "whatsapp": true,
      "warrantyDays": 14
    }
  }',
  now()
);

-- Insert sample employees
INSERT INTO public.employees (
  full_name,
  whatsapp,
  age,
  role,
  created_at
) VALUES
  ('João Silva', '5511999999999', 30, 'manager', now()),
  ('Maria Santos', '5511988888888', 25, 'seller', now());

-- Insert sample products
INSERT INTO public.products (
  name,
  description,
  code,
  default_price,
  created_at
) VALUES
  ('iPhone 13 Pro', '128GB, Grafite', 'IP13P-128-GR', 5999.99, now()),
  ('iPhone 12', '64GB, Azul', 'IP12-64-BL', 4499.99, now()),
  ('AirPods Pro', 'Com cancelamento de ruído', 'APP-2GEN', 1899.99, now()),
  ('Carregador USB-C', '20W', 'CHAR-20W', 219.99, now());

-- Insert sample customers
INSERT INTO public.customers (
  full_name,
  email,
  phone,
  created_at
) VALUES
  ('Carlos Oliveira', 'carlos@email.com', '5511977777777', now()),
  ('Ana Pereira', 'ana@email.com', '5511966666666', now());
