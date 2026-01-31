-- ============================================================================
-- Script de correction pour ajouter admin_role aux admins existants
-- ============================================================================
-- Ce script met à jour tous les utilisateurs avec is_super_admin = true
-- pour leur attribuer le rôle 'super_admin' s'ils n'en ont pas
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

-- Mettre à jour tous les super admins existants pour leur donner le rôle
UPDATE users 
SET 
  admin_role = 'super_admin',
  admin_permissions = '{"all": true, "create_admins": true}'::jsonb,
  can_create_admins = true,
  updated_at = NOW()
WHERE is_super_admin = true 
  AND (admin_role IS NULL OR admin_role != 'super_admin');

-- Vérifier les utilisateurs mis à jour
SELECT 
  id, 
  phone, 
  full_name, 
  is_super_admin, 
  admin_role,
  can_create_admins,
  created_at 
FROM users 
WHERE is_super_admin = true OR admin_role IS NOT NULL
ORDER BY created_at DESC;
