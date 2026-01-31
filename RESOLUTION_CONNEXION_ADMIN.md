# 🔧 Résolution : "Numéro de téléphone ou mot de passe incorrect"

## 🎯 Solution Rapide (Recommandée)

### Étape 1 : Exécuter le script SQL de création complète

1. **Ouvrez Supabase Dashboard** → **SQL Editor**
2. **Copiez-collez** le contenu du fichier `creer-admin-complet.sql`
3. **Cliquez sur "Run"** pour exécuter

Ce script va :
- ✅ Supprimer l'ancien compte s'il existe (pour repartir à zéro)
- ✅ Créer un nouveau compte admin avec toutes les données correctes
- ✅ Vérifier que tout est bien configuré

### Étape 2 : Vérifier que le compte existe

Après avoir exécuté le script, vous devriez voir un résultat avec :
- `phone` = `+221780181144`
- `admin_role` = `super_admin`
- `password_correct` = `true`
- `is_super_admin` = `true`

### Étape 3 : Se connecter

1. Allez sur `http://localhost:8000/admin/connexion.html` (ou votre URL)
2. **Numéro** : `780181144` (sans le +221)
3. **Mot de passe** : `123456`
4. Cliquez sur "Se connecter"

---

## 🔍 Diagnostic (Si ça ne fonctionne toujours pas)

### Option 1 : Vérifier votre compte dans Supabase

Exécutez le script `diagnostic-admin.sql` dans Supabase SQL Editor pour voir :
- Si votre compte existe
- Si le hash du mot de passe est correct
- Si le `admin_role` est défini

### Option 2 : Vérifier manuellement

1. Allez dans **Supabase Dashboard** → **Table Editor** → `users`
2. Recherchez le numéro `+221780181144`
3. Vérifiez que :
   - ✅ `phone` = `+221780181144` (exactement, avec le +221)
   - ✅ `admin_role` = `super_admin` (pas NULL)
   - ✅ `password_hash` = `8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92`
   - ✅ `is_super_admin` = `true`
   - ✅ `is_active` = `true`

### Option 3 : Vérifier la console du navigateur

1. Ouvrez les **Outils de développement** (F12)
2. Allez dans l'onglet **Console**
3. Essayez de vous connecter
4. Regardez s'il y a des erreurs JavaScript

---

## 🐛 Problèmes Courants

### Problème 1 : Le compte n'existe pas

**Solution** : Exécutez `creer-admin-complet.sql`

### Problème 2 : Le admin_role est NULL

**Solution** : Exécutez `fix-admin-role.sql` ou `creer-admin-complet.sql`

### Problème 3 : Le password_hash est incorrect

**Solution** : Exécutez `creer-admin-complet.sql` qui va recréer le compte avec le bon hash

### Problème 4 : Le numéro de téléphone ne correspond pas

**Vérification** : Le code ajoute automatiquement `+221` si le numéro commence par `7`. 
- Si vous entrez `780181144`, le code cherche `+221780181144`
- Assurez-vous que dans la base, le numéro est bien `+221780181144`

### Problème 5 : Erreur "crypto.subtle non disponible"

**Solution** : 
- Utilisez `http://localhost:8000` (localhost fonctionne)
- Ou utilisez HTTPS
- Le mot de passe `123456` est dans la table de fallback, donc ça devrait fonctionner

---

## 📝 Script SQL Rapide (Copier-Coller)

Si vous voulez juste exécuter rapidement, voici le script minimal :

```sql
-- Supprimer l'ancien compte
DELETE FROM users WHERE phone = '+221780181144';

-- Créer le nouveau compte
INSERT INTO users (
  id, phone, email, password_hash, full_name, role_type,
  is_super_admin, admin_role, admin_permissions, can_create_admins, is_active, created_at
)
VALUES (
  gen_random_uuid(),
  '+221780181144',
  'admin@majay.sn',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'Super Administrateur',
  'owner',
  true,
  'super_admin',
  '{"all": true, "create_admins": true}'::jsonb,
  true,
  true,
  NOW()
);
```

---

## ✅ Vérification Finale

Après avoir exécuté le script, testez la connexion :

1. **URL** : `http://localhost:8000/admin/connexion.html`
2. **Numéro** : `780181144`
3. **Mot de passe** : `123456`

Si ça ne fonctionne toujours pas, envoyez-moi :
- Le résultat du script `diagnostic-admin.sql`
- Les erreurs de la console du navigateur (F12 → Console)
