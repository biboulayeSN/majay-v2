# 🔧 Guide d'Installation : Super Admin + Accès aux Boutiques

## 📋 Vue d'ensemble

Ce guide explique comment installer le super admin automatiquement et permettre aux admins d'accéder à toutes les boutiques en bypassant les règles RLS (Row Level Security) de Supabase.

## 🎯 Objectifs

1. ✅ Créer automatiquement un super admin lors de l'installation
2. ✅ Permettre au super admin de voir toutes les boutiques
3. ✅ Réserver la création d'admins au super admin uniquement
4. ✅ Fonctionner en local ET en production

## 📝 Étapes d'Installation

### Étape 1 : Exécuter le script SQL dans Supabase

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com
   - Sélectionner votre projet

2. **Ouvrir le SQL Editor**
   - Cliquer sur "SQL Editor" dans le menu de gauche
   - Cliquer sur "New Query"

3. **Copier et exécuter le script**
   - Ouvrir le fichier `install-super-admin-complete.sql`
   - Copier TOUT le contenu (Ctrl+A, Ctrl+C)
   - Coller dans l'éditeur SQL (Ctrl+V)
   - Cliquer sur "Run" (ou F5)

4. **Vérifier le succès**
   - Vous devriez voir deux tables de vérification :
     - ✅ Super Admin créé/vérifié (avec les infos du super admin)
     - ✅ Fonctions RPC créées (liste des 4 fonctions créées)

### Étape 2 : Identifiants du Super Admin par défaut

Le super admin est créé avec ces identifiants :

- **Numéro de téléphone** : `+221780181144` (ou `780181144`)
- **Mot de passe** : `123456`
- **Rôle** : `super_admin`
- **Permissions** : Toutes les permissions (all: true, create_admins: true)

⚠️ **IMPORTANT** : Changez le mot de passe après la première connexion en production !

### Étape 3 : Modifier le numéro par défaut (optionnel)

Si vous voulez changer le numéro du super admin en production :

1. Ouvrir `install-super-admin-complete.sql`
2. Remplacer `'+221780181144'` par votre numéro
3. Régénérer le hash SHA-256 du nouveau mot de passe
4. Exécuter à nouveau le script SQL

### Étape 4 : Test de connexion

1. **Ouvrir la page de connexion admin**
   - Aller sur `/admin/connexion.html`

2. **Se connecter avec les identifiants**
   - Numéro : `780181144` (ou `+221780181144`)
   - Mot de passe : `123456`

3. **Vérifier que vous voyez les boutiques**
   - Aller sur `/admin/vendeur.html`
   - Vous devriez voir toutes les boutiques de la base de données

## 🔐 Comment ça fonctionne ?

### 1. Fonctions RPC (Remote Procedure Call)

Le script crée 4 fonctions PostgreSQL avec `SECURITY DEFINER` qui permettent de bypasser RLS :

- **`check_admin_access`** : Vérifie si un utilisateur est admin
- **`get_all_stores_for_admin`** : Retourne toutes les boutiques pour les admins
- **`create_admin_user`** : Permet au super admin de créer d'autres admins
- **`get_admin_stats`** : Retourne les statistiques globales

### 2. Stockage du password_hash dans la session

Le `password_hash` est maintenant stocké dans `localStorage` après connexion pour :
- Authentifier les appels RPC
- Bypasser RLS de manière sécurisée
- Maintenir l'accès sans re-saisir le mot de passe

### 3. Fallback automatique

Si les fonctions RPC ne sont pas disponibles, le code utilise automatiquement la méthode normale (qui peut échouer si RLS bloque).

## 🛡️ Sécurité

### Points de sécurité

1. ✅ Le `password_hash` est stocké localement (jamais envoyé en clair)
2. ✅ Les fonctions RPC vérifient toujours l'identité avant d'exécuter
3. ✅ Seul le super admin peut créer d'autres admins
4. ✅ Les fonctions utilisent `SECURITY DEFINER` pour bypass RLS de manière contrôlée

### Recommandations

- 🔒 Changez le mot de passe du super admin après installation
- 🔒 Ne partagez jamais les identifiants du super admin
- 🔒 Surveillez les accès admin dans les logs Supabase
- 🔒 Utilisez HTTPS en production

## 🐛 Dépannage

### Problème : Je ne vois pas mes boutiques

**Solution** :
1. Vérifier que les fonctions RPC sont créées dans Supabase
2. Ouvrir la console du navigateur (F12)
3. Vérifier s'il y a des erreurs dans l'onglet Console
4. Vérifier que `password_hash` est bien stocké dans `localStorage`

### Problème : Erreur "Accès refusé"

**Solution** :
1. Se déconnecter et se reconnecter
2. Vérifier que le compte a bien `admin_role = 'super_admin'`
3. Vérifier que le `password_hash` correspond dans la base

### Problème : Les fonctions RPC n'existent pas

**Solution** :
1. Ré-exécuter le script `install-super-admin-complete.sql`
2. Vérifier qu'il n'y a pas d'erreurs dans le SQL Editor
3. Vérifier les logs Supabase

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs Supabase (Dashboard → Logs)
3. Vérifier que toutes les fonctions RPC existent

## 📚 Fichiers concernés

- `install-super-admin-complete.sql` : Script SQL à exécuter
- `js/admin-auth.js` : Code JavaScript modifié pour utiliser RPC
- `GUIDE_INSTALLATION_SUPER_ADMIN.md` : Ce guide
