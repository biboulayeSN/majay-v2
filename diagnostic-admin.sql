-- ============================================================================
-- Script de diagnostic pour vérifier le compte admin
-- ============================================================================
-- Ce script vérifie si votre compte admin existe et est correctement configuré
-- ============================================================================

-- 1. Vérifier si le compte existe avec le numéro 780181144
SELECT 
  id,
  phone,
  email,
  full_name,
  is_super_admin,
  admin_role,
  can_create_admins,
  password_hash IS NOT NULL as has_password,
  LENGTH(password_hash) as password_hash_length,
  LEFT(password_hash, 20) as password_hash_preview,
  is_active,
  created_at,
  updated_at
FROM users 
WHERE phone = '+221780181144' OR phone = '780181144';

-- 2. Vérifier tous les comptes avec is_super_admin = true
SELECT 
  id,
  phone,
  email,
  full_name,
  is_super_admin,
  admin_role,
  password_hash IS NOT NULL as has_password,
  is_active
FROM users 
WHERE is_super_admin = true;

-- 3. Vérifier tous les comptes avec admin_role
SELECT 
  id,
  phone,
  email,
  full_name,
  admin_role,
  is_super_admin,
  password_hash IS NOT NULL as has_password,
  is_active
FROM users 
WHERE admin_role IS NOT NULL;

-- 4. Vérifier le hash attendu pour le mot de passe "123456"
-- Le hash SHA-256 de "123456" devrait être: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
SELECT 
  phone,
  password_hash,
  password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' as password_match,
  admin_role,
  is_super_admin
FROM users 
WHERE phone = '+221780181144' OR phone = '780181144';
