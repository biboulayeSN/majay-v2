-- ============================================================================
-- Script SQL pour créer l'utilisateur admin
-- ============================================================================
-- Numéro: 780181144
-- Mot de passe: 123456
-- Hash SHA-256 de "123456": 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- ============================================================================

-- S'assurer que le type admin_role existe
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM (
        'super_admin',
        'admin_commercial',
        'admin_gestionnaire',
        'admin_commercial_gestionnaire',
        'admin_analytics',
        'admin_financial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- S'assurer que les colonnes admin existent
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_role admin_role,
ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS can_create_admins BOOLEAN DEFAULT false;

-- Créer l'utilisateur admin avec admin_role
INSERT INTO users (
  id,
  phone,
  email,
  password_hash,
  full_name,
  role_type,
  is_super_admin,
  admin_role,
  admin_permissions,
  can_create_admins,
  is_active,
  created_at
)
VALUES (
  gen_random_uuid(),
  '+221780181144',
  'admin@majay.sn',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- Hash de "123456"
  'Super Administrateur',
  'owner',
  true,
  'super_admin', -- IMPORTANT: admin_role requis pour la connexion
  '{"all": true, "create_admins": true}'::jsonb,
  true,
  true,
  NOW()
)
ON CONFLICT (phone) DO UPDATE SET
  password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  is_super_admin = true,
  admin_role = 'super_admin', -- IMPORTANT: définir admin_role
  admin_permissions = '{"all": true, "create_admins": true}'::jsonb,
  can_create_admins = true,
  is_active = true,
  updated_at = NOW();

-- Vérifier que l'utilisateur a été créé
SELECT id, phone, full_name, is_super_admin, created_at 
FROM users 
WHERE phone = '+221780181144';

