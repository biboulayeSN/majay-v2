-- ============================================================================
-- INSTALLATION COMPLÈTE : SUPER ADMIN + FONCTIONS RPC
-- ============================================================================
-- Ce script crée automatiquement le super admin et les fonctions nécessaires
-- pour que les admins puissent accéder à toutes les boutiques
-- Exécuter dans Supabase SQL Editor lors de la première installation
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

-- 3. Créer le super admin s'il n'existe pas (UPSERT)
-- Hash SHA-256 de "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- Hash SHA-256 de "123456" = 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
INSERT INTO users (
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
  '780181144',  -- Numéro par défaut (à changer en production si besoin)
  'admin@ma-jay.com',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',  -- Hash de "123456"
  'Super Administrateur',
  'owner',
  true,
  'super_admin',
  '{"all": true, "create_admins": true, "view_analytics": true, "export_data": true, "manage_stores": true, "manage_vendors": true}'::jsonb,
  true,  -- Seul le super admin peut créer des admins
  true,
  NOW(),
  NOW()
)
ON CONFLICT (phone) 
DO UPDATE SET
  admin_role = 'super_admin',
  is_super_admin = true,
  can_create_admins = true,
  admin_permissions = '{"all": true, "create_admins": true, "view_analytics": true, "export_data": true, "manage_stores": true, "manage_vendors": true}'::jsonb,
  password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
  updated_at = NOW()
WHERE users.admin_role IS NULL OR users.admin_role != 'super_admin';

-- ============================================================================
-- FONCTIONS RPC POUR BYPASS RLS
-- ============================================================================

-- Supprimer les fonctions existantes avant de les recréer (évite les erreurs de type)
DROP FUNCTION IF EXISTS check_admin_access(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS get_all_stores_for_admin(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_admin_user(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, admin_role, JSONB);
DROP FUNCTION IF EXISTS get_admin_stats(VARCHAR, VARCHAR);

-- 4. Fonction: Vérifier si un utilisateur est admin (bypass RLS)
CREATE OR REPLACE FUNCTION check_admin_access(
  p_phone VARCHAR,
  p_password_hash VARCHAR
)
RETURNS TABLE(
  is_admin BOOLEAN,
  admin_role admin_role,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  -- Vérifier dans la table users
  SELECT * INTO v_user
  FROM users
  WHERE phone = p_phone
    AND password_hash = p_password_hash
    AND admin_role IS NOT NULL
    AND is_active = true;
  
  -- Si trouvé, retourner les infos
  IF FOUND THEN
    RETURN QUERY SELECT true, v_user.admin_role, v_user.id;
  ELSE
    RETURN QUERY SELECT false, NULL::admin_role, NULL::UUID;
  END IF;
END;
$$;

-- 5. Fonction: Obtenir toutes les boutiques (pour les admins)
CREATE OR REPLACE FUNCTION get_all_stores_for_admin(
  p_phone VARCHAR,
  p_password_hash VARCHAR
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  subscription_plan subscription_plan,
  is_active BOOLEAN,
  activity_category VARCHAR,
  city VARCHAR,
  region VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  owner_id UUID,
  owner_name VARCHAR,
  owner_phone VARCHAR,
  owner_last_login TIMESTAMP WITH TIME ZONE,
  total_orders BIGINT,
  total_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_admin_role admin_role;
BEGIN
  -- Vérifier que c'est un admin
  SELECT is_admin, admin_role INTO v_is_admin, v_admin_role
  FROM check_admin_access(p_phone, p_password_hash)
  LIMIT 1;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Accès refusé: Utilisateur non admin';
  END IF;
  
  -- Retourner toutes les boutiques
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.slug,
    s.subscription_plan,
    s.is_active,
    s.activity_category,
    s.city,
    s.region,
    s.created_at,
    s.owner_id,
    u.full_name as owner_name,
    u.phone as owner_phone,
    u.last_login as owner_last_login,
    COALESCE(s.total_orders, 0) as total_orders,
    COALESCE(s.total_revenue, 0) as total_revenue
  FROM stores s
  LEFT JOIN users u ON u.id = s.owner_id
  ORDER BY s.created_at DESC;
END;
$$;

-- 6. Fonction: Créer un admin (seulement pour super admin)
CREATE OR REPLACE FUNCTION create_admin_user(
  p_super_admin_phone VARCHAR,
  p_super_admin_password_hash VARCHAR,
  p_new_admin_phone VARCHAR,
  p_new_admin_email VARCHAR,
  p_new_admin_password_hash VARCHAR,
  p_new_admin_name VARCHAR,
  p_new_admin_role admin_role,
  p_new_admin_permissions JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_super_admin_id UUID;
  v_is_super_admin BOOLEAN;
  v_new_admin_id UUID;
BEGIN
  -- Vérifier que le demandeur est super admin
  SELECT user_id, (admin_role = 'super_admin') INTO v_super_admin_id, v_is_super_admin
  FROM check_admin_access(p_super_admin_phone, p_super_admin_password_hash)
  LIMIT 1;
  
  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Accès refusé: Seul le super admin peut créer des admins';
  END IF;
  
  -- Vérifier que le numéro n'existe pas déjà
  IF EXISTS (SELECT 1 FROM users WHERE phone = p_new_admin_phone) THEN
    RAISE EXCEPTION 'Un utilisateur avec ce numéro existe déjà';
  END IF;
  
  -- Créer le nouvel admin
  INSERT INTO users (
    phone,
    email,
    password_hash,
    full_name,
    role_type,
    admin_role,
    admin_permissions,
    can_create_admins,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    p_new_admin_phone,
    p_new_admin_email,
    p_new_admin_password_hash,
    p_new_admin_name,
    'owner',
    p_new_admin_role,
    p_new_admin_permissions,
    false,  -- Seul le super admin peut créer des admins
    true,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_admin_id;
  
  RETURN v_new_admin_id;
END;
$$;

-- 7. Fonction: Obtenir les statistiques admin (bypass RLS)
CREATE OR REPLACE FUNCTION get_admin_stats(
  p_phone VARCHAR,
  p_password_hash VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_stats JSONB;
BEGIN
  -- Vérifier que c'est un admin
  SELECT is_admin INTO v_is_admin
  FROM check_admin_access(p_phone, p_password_hash)
  LIMIT 1;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Accès refusé: Utilisateur non admin';
  END IF;
  
  -- Calculer les statistiques
  SELECT jsonb_build_object(
    'total_vendeurs', (SELECT COUNT(*) FROM stores),
    'vendeurs_actifs', (SELECT COUNT(*) FROM stores WHERE is_active = true),
    'vendeurs_inactifs', (SELECT COUNT(*) FROM stores WHERE is_active = false),
    'vendeurs_free', (SELECT COUNT(*) FROM stores WHERE subscription_plan = 'free' AND is_active = true),
    'vendeurs_pro', (SELECT COUNT(*) FROM stores WHERE subscription_plan = 'pro' AND is_active = true),
    'vendeurs_entreprise', (SELECT COUNT(*) FROM stores WHERE subscription_plan = 'entreprise' AND is_active = true),
    'total_produits', (SELECT COUNT(*) FROM products WHERE is_active = true),
    'total_commandes', (SELECT COUNT(*) FROM orders),
    'volume_ventes_total', (SELECT COALESCE(SUM(total::numeric), 0) FROM orders WHERE status = 'delivered')
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Afficher le super admin créé
SELECT 
  '✅ Super Admin créé/vérifié' as status,
  id,
  phone,
  full_name,
  admin_role,
  can_create_admins,
  is_active,
  created_at
FROM users 
WHERE admin_role = 'super_admin';

-- Afficher les fonctions créées
SELECT 
  '✅ Fonctions RPC créées' as status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_admin_access',
    'get_all_stores_for_admin',
    'create_admin_user',
    'get_admin_stats'
  )
ORDER BY routine_name;
