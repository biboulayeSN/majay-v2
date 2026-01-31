-- ============================================================================
-- Script COMPLET pour créer/corriger le compte admin
-- ============================================================================
-- Ce script garantit que le compte admin existe avec toutes les données correctes
-- Numéro: 780181144
-- Mot de passe: 123456
-- Hash SHA-256: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- ============================================================================

-- 1. S'assurer que le type admin_role existe
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

-- 2. S'assurer que les colonnes existent
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_role admin_role,
ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS can_create_admins BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 3. Supprimer l'ancien compte s'il existe (pour repartir à zéro)
DELETE FROM users WHERE phone = '+221780181144' OR phone = '780181144';

-- 4. Créer le compte admin avec TOUTES les données correctes
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
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '+221780181144',  -- Numéro avec préfixe
  'admin@majay.sn',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',  -- Hash de "123456"
  'Super Administrateur',
  'owner',
  true,  -- is_super_admin
  'super_admin',  -- admin_role (OBLIGATOIRE pour la connexion)
  '{"all": true, "create_admins": true}'::jsonb,  -- Permissions
  true,  -- can_create_admins
  true,  -- is_active
  NOW(),
  NOW()
);

-- 5. Vérifier que le compte a été créé correctement
SELECT 
  '✅ Vérification du compte admin' as status,
  id,
  phone,
  email,
  full_name,
  is_super_admin,
  admin_role,
  can_create_admins,
  password_hash IS NOT NULL as has_password,
  password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' as password_correct,
  is_active,
  created_at
FROM users 
WHERE phone = '+221780181144';

-- 6. Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Compte admin créé avec succès !';
  RAISE NOTICE '📱 Numéro: 780181144';
  RAISE NOTICE '🔑 Mot de passe: 123456';
  RAISE NOTICE '🎯 Rôle: super_admin';
END $$;
