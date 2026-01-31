# 🔐 Guide de Connexion Admin - Résolution des Problèmes

## ❌ Problème : "Je n'arrive pas à me connecter avec superadmin"

### 🔍 Explication

Le système d'authentification admin **ne utilise PAS de nom d'utilisateur** comme "superadmin". Il utilise :
- **Numéro de téléphone** (ex: `780181144`)
- **Mot de passe** (ex: `123456`)

De plus, l'utilisateur doit avoir un **`admin_role`** défini dans la base de données pour pouvoir se connecter.

## ✅ Solution Étape par Étape

### Étape 1 : Vérifier que votre compte admin existe

1. Allez dans **Supabase Dashboard** → **Table Editor** → `users`
2. Recherchez votre numéro de téléphone (ex: `+221780181144`)
3. Vérifiez que :
   - `is_super_admin = true` ✅
   - `admin_role = 'super_admin'` ✅ (IMPORTANT)
   - `password_hash` existe ✅

### Étape 2 : Corriger votre compte admin (si nécessaire)

Si votre compte existe mais n'a pas de `admin_role`, exécutez ce script SQL dans **Supabase SQL Editor** :

```sql
-- Script de correction (fichier: fix-admin-role.sql)
UPDATE users 
SET 
  admin_role = 'super_admin',
  admin_permissions = '{"all": true, "create_admins": true}'::jsonb,
  can_create_admins = true,
  updated_at = NOW()
WHERE phone = '+221780181144'  -- Remplacez par votre numéro
  AND is_super_admin = true;
```

### Étape 3 : Créer un nouveau compte admin (si le compte n'existe pas)

Exécutez le script `create-admin.sql` dans **Supabase SQL Editor** :

```sql
-- Ce script crée un admin avec :
-- Numéro: 780181144
-- Mot de passe: 123456
-- Rôle: super_admin
```

### Étape 4 : Se connecter

1. Allez sur `http://localhost:8000/admin/connexion.html` (ou votre URL)
2. **Numéro de téléphone** : Entrez `780181144` (sans le +221, le système l'ajoute automatiquement)
3. **Mot de passe** : Entrez `123456`
4. Cliquez sur "Se connecter"

## 🔑 Identifiants par Défaut

- **Numéro** : `780181144`
- **Mot de passe** : `123456`

## 🆘 Dépannage

### Erreur : "Numéro de téléphone ou mot de passe incorrect"

**Causes possibles :**
1. Le compte n'existe pas dans la table `users`
2. Le `admin_role` n'est pas défini (doit être `'super_admin'`)
3. Le `password_hash` est incorrect
4. Le numéro de téléphone ne correspond pas

**Solution :**
- Exécutez le script `fix-admin-role.sql` pour corriger le `admin_role`
- Ou exécutez `create-admin.sql` pour créer un nouveau compte

### Erreur : "Cannot read properties of undefined (reading 'digest')"

Cette erreur apparaît si vous n'êtes pas sur HTTPS ou localhost. Le système utilise un fallback, mais certains mots de passe peuvent ne pas être reconnus.

**Solution :**
- Utilisez le mot de passe par défaut `123456` qui est dans la table de fallback
- Ou accédez à l'application via `http://localhost:8000` (localhost fonctionne)

### Le compte existe mais je ne peux toujours pas me connecter

Vérifiez dans Supabase que votre utilisateur a bien :
```sql
SELECT 
  phone, 
  is_super_admin, 
  admin_role, 
  password_hash IS NOT NULL as has_password
FROM users 
WHERE phone = '+221780181144';
```

Tous les champs doivent être remplis :
- `is_super_admin` = `true`
- `admin_role` = `super_admin`
- `has_password` = `true`

## 📝 Notes Importantes

- Le numéro peut être entré avec ou sans le préfixe `+221`
- Le système ajoute automatiquement `+221` si le numéro commence par `7`
- Le mot de passe est sensible à la casse
- La session expire après 7 jours d'inactivité
- **Le `admin_role` est OBLIGATOIRE** pour se connecter (vérifié ligne 84 de `admin-auth.js`)
