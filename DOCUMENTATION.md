# MAJAY V2 - Documentation Complete

> Plateforme e-commerce SaaS multi-vendeurs pour WhatsApp et Telegram (Senegal)

---

## Table des matieres

1. [Demarrage Rapide](#1-demarrage-rapide)
2. [Architecture & Routage](#2-architecture--routage)
3. [Espace Vendeur](#3-espace-vendeur)
4. [Espace Administrateur](#4-espace-administrateur)
5. [Securite Supabase](#5-securite-supabase)
6. [Supabase Storage](#6-supabase-storage)
7. [Statistiques & Export](#7-statistiques--export)
8. [Standards Accessibilite (WCAG / ISO 9241)](#8-standards-accessibilite-wcag--iso-9241)
9. [Cloudflare](#9-cloudflare-gratuit)
10. [Git & GitHub](#10-git--github)
11. [Depannage](#11-depannage)

---

## 1. Demarrage Rapide

### Prerequis

1. Fichier `.env.local` cree avec vos credentials Supabase
2. Schema SQL execute dans Supabase (fichier `SUPABASE_SCHEMA_COMPLET.sql`)
3. Python installe (pour le serveur HTTP)

### Compiler le CSS Tailwind (obligatoire)

Avant de lancer le serveur, compilez le CSS Tailwind :

```bash
npm run build:css
```

Tailwind genere `css/output.css` a partir de `css/input.css`. Sans compilation, les pages n'auront pas de styles.

Pour le developpement, utilisez la compilation automatique :

```bash
npm run watch:css
```

> Laissez cette commande tourner dans un terminal separe pendant le developpement.

**Workflow recommande :**
- **Terminal 1** : `npm run watch:css` (compilation automatique)
- **Terminal 2** : `python server.py` (serveur web)
- **Navigateur** : `http://localhost:8000` (F5 pour recharger)

### Lancer le serveur

**Option 1 : Serveur personnalise (Recommande)**

```bash
python server.py
```

Le serveur personnalise gere automatiquement :
- Le routage des repertoires (`/admin/` vers `/admin/index.html`)
- La protection contre l'affichage de la liste des fichiers
- Les en-tetes de securite

Sur un port specifique :

```bash
python server.py 8080
```

**Option 2 : Serveur Python standard**

```bash
python -m http.server 8000
```

> Avec cette option, l'acces a `/admin/` affichera la liste des fichiers. Utilisez directement `/admin/index.html`.

**Option 3 : Node.js**

```bash
npx http-server -p 8000
```

### Tester la connexion

1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:8000/test-complet.html`
3. Les tests se lancent automatiquement

Les tests verifient :
- Connexion a Supabase
- Existence de toutes les tables
- Presence des plans (free, pro, entreprise)
- Disponibilite des fonctions RPC
- Configuration RLS (securite)
- Accessibilite des fichiers JavaScript

### Configuration Supabase requise

Avant de tester l'inscription/connexion :

1. **Phone Provider active** dans Supabase > Authentication > Providers
2. **Autoconfirm users active** dans Authentication > Settings
3. **Twilio configure** (ou numeros de test configures)

### Checklist de test

- [ ] Test de connexion reussi
- [ ] Toutes les tables accessibles
- [ ] Plans presents (free, pro, entreprise)
- [ ] Fonctions RPC disponibles
- [ ] Inscription vendeur fonctionne
- [ ] Connexion vendeur fonctionne
- [ ] Creation de produits fonctionne
- [ ] Catalogue public accessible

### Acces reseau local

Pour acceder depuis un autre appareil sur le meme reseau :

```bash
python server.py 8000
# Puis accedez depuis : http://VOTRE_IP:8000
```

Pour trouver votre IP :
- **Windows** : `ipconfig` (cherchez "IPv4 Address")
- **Mac/Linux** : `ifconfig` ou `ip addr`

---

## 2. Architecture & Routage

### Format des URLs

**Boutiques :**
- Ancien format : `www.site.com/catalogue.html?shop=ma-boutique`
- Nouveau format : `www.site.com/ma-boutique`

**Administration :**
- Format : `admin.site.com` ou `www.site.com/admin/`

**Vendeur :**
- Format : `www.site.com/vendeur/`

### Pages publiques

| URL | Description |
|-----|-------------|
| `http://localhost:8000/` | Page d'accueil |
| `http://localhost:8000/ma-boutique` | Catalogue d'une boutique |
| `http://localhost:8000/catalogue.html?shop=ma-boutique` | Ancien format (compatible) |

### Pages vendeur

| URL | Description |
|-----|-------------|
| `/vendeur/inscription.html` | Inscription |
| `/vendeur/connexion.html` | Connexion |
| `/vendeur/dashboard.html` | Dashboard (protege) |

### Pages admin

| URL | Description |
|-----|-------------|
| `/admin/` | Redirige vers index.html puis connexion ou dashboard |
| `/admin/connexion.html` | Connexion admin |
| `/admin/dashboard.html` | Dashboard admin (protege) |

### Configuration par hebergement

#### Apache

Le fichier `.htaccess` est deja cree. Assurez-vous que :
1. Le module `mod_rewrite` est active
2. Le fichier `.htaccess` est a la racine
3. Les permissions sont correctes

#### Netlify

Le fichier `_redirects` est deja cree. Netlify le detectera automatiquement.

```bash
netlify deploy
```

#### Vercel

Le fichier `vercel.json` est deja cree. Vercel l'utilisera automatiquement.

```bash
vercel deploy
```

#### Developpement local (Python)

Le routage dynamique ne fonctionne pas avec `python -m http.server`. Deux options :

- Utiliser le format ancien : `http://localhost:8000/catalogue.html?shop=ma-boutique`
- Utiliser `server.py` qui gere le routage

### Sous-domaine Admin

Pour que `admin.site.com` fonctionne :

1. **DNS** : Ajoutez un enregistrement CNAME `admin` pointant vers votre domaine principal

2. **Nginx** (si applicable) :

```nginx
server {
    server_name admin.votresite.com;
    root /chemin/vers/votre/projet;
    index index.html;

    location / {
        try_files $uri $uri/ /admin/index.html;
    }
}
```

3. **Netlify/Vercel** : Configurez le sous-domaine dans Domain settings

### Notes sur le routage

- Les slugs de boutique doivent etre uniques
- Caracteres autorises : lettres minuscules, chiffres et tirets
- Les pages systeme (`/admin`, `/vendeur`, `/catalogue.html`) ne sont pas traitees comme des boutiques
- Les anciens liens (`catalogue.html?shop=...`) restent compatibles

---

## 3. Espace Vendeur

### Pages disponibles

| Page | Description | Protection |
|------|-------------|------------|
| `index.html` | Point d'entree (redirection) | - |
| `inscription.html` | Creation de compte et boutique | Public |
| `connexion.html` | Connexion vendeur | Public |
| `dashboard.html` | Tableau de bord principal | Authentifie |
| `produits.html` | Gestion des produits | Authentifie |
| `inventaire.html` | Gestion de l'inventaire | Authentifie |
| `commandes.html` | Gestion des commandes | Authentifie |
| `clients.html` | CRM clients | Authentifie |
| `analytics.html` | Statistiques et analyses | Authentifie |
| `abonnements.html` | Gestion des abonnements | Authentifie |
| `profil.html` | Parametres de la boutique | Authentifie |
| `factures.html` | Historique des factures | Authentifie |
| `comptabilite.html` | Comptabilite | Authentifie |
| `rapports.html` | Rapports | Authentifie |
| `transferts.html` | Transferts d'argent | Authentifie |
| `equipe.html` | Gestion de l'equipe | Plan Entreprise |
| `multi-boutiques.html` | Multi-boutiques | Plan Entreprise |
| `agents.html` | Gestion des agents | Authentifie |
| `depot.html` | Gestion des depots | Authentifie |

### Securite

- Authentification OTP par SMS (Supabase Auth)
- Verification de la session a chaque chargement de page
- Session avec expiration automatique (7 jours)
- Redirection automatique vers connexion si non authentifie
- Verification du statut actif de la boutique

### Workflow

1. **Inscription** : Creez votre compte et votre boutique
2. **Connexion** : Connectez-vous avec votre numero de telephone (OTP SMS)
3. **Dashboard** : Gerez votre boutique depuis le tableau de bord

---

## 4. Espace Administrateur

### 4.1 Connexion Admin

**Identifiants par defaut :**
- Numero de telephone : `780181144`
- Mot de passe : `123456`

**Creer l'utilisateur admin dans Supabase :**

Executez dans Supabase Dashboard > SQL Editor :

```sql
INSERT INTO users (
  id, phone, email, password_hash, full_name, role_type,
  is_super_admin, admin_role, admin_permissions, can_create_admins,
  is_active, created_at
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
)
ON CONFLICT (phone) DO UPDATE SET
  admin_role = 'super_admin',
  is_super_admin = true,
  can_create_admins = true,
  admin_permissions = '{"all": true, "create_admins": true}'::jsonb;
```

**Verifier la creation :**

```sql
SELECT id, phone, full_name, is_super_admin, admin_role, created_at
FROM users
WHERE phone = '+221780181144';
```

**Se connecter :**

1. Allez sur `http://localhost:8000/admin/connexion.html`
2. Entrez le numero : `780181144`
3. Entrez le mot de passe : `123456`
4. Vous serez redirige vers le dashboard

**Notes :**
- Le numero peut etre entre avec ou sans le prefixe `+221`
- Le systeme ajoute automatiquement `+221` si le numero commence par `7`
- Le mot de passe est sensible a la casse
- La session expire apres 7 jours d'inactivite
- Le mot de passe est hashe avec SHA-256 avant comparaison

**Changer le mot de passe :**

1. Hasher le nouveau mot de passe avec SHA-256 (ex: https://emn178.github.io/online-tools/sha256.html)
2. Mettre a jour dans Supabase :

```sql
UPDATE users
SET password_hash = 'NOUVEAU_HASH_ICI',
    updated_at = NOW()
WHERE phone = '+221780181144';
```

### 4.2 Roles & Permissions

#### Super Administrateur (`super_admin`)

Acces complet a toutes les fonctionnalites :
- Creer et gerer d'autres administrateurs
- Gerer tous les vendeurs et boutiques
- Acces a toutes les statistiques
- Gestion financiere complete

Pages : `/admin/dashboard.html`, `/admin/admins.html`, `/admin/vendeur.html`, `/admin/stores.html`

#### Admin Commercial (`admin_commercial`)

Permissions :
- `view_vendors` - Voir les vendeurs
- `edit_vendors` - Modifier les vendeurs
- `activate_vendors` - Activer les vendeurs
- `deactivate_vendors` - Desactiver les vendeurs
- `view_stores` - Voir les boutiques

Pages : `/admin/commercial.html`, `/admin/commercial-stores.html`

Restrictions : Ne peut pas creer d'admins, bannir des boutiques, ni voir les analytics detaillees.

#### Admin Gestionnaire (`admin_gestionnaire`)

Permissions :
- `view_stores` - Voir les boutiques
- `edit_stores` - Modifier les boutiques
- `ban_stores` - Bannir des boutiques
- `restrict_products` - Restreindre les produits
- `view_enterprise_vendors` - Voir les vendeurs entreprises
- `manage_enterprise_vendors` - Gerer les vendeurs entreprises

Pages : `/admin/gestionnaire.html`, `/admin/gestionnaire-enterprise.html`

Restrictions : Ne peut pas creer d'admins ni gerer les paiements.

#### Admin Commercial & Gestionnaire (`admin_commercial_gestionnaire`)

Combine toutes les permissions Commercial + Gestionnaire.

Pages : `/admin/commercial.html`, `/admin/gestionnaire.html`, `/admin/commercial-gestionnaire.html`

#### Admin Analytics (`admin_analytics`)

Permissions :
- `view_analytics` - Voir les analytics
- `view_stats` - Voir les statistiques
- `export_data` - Exporter les donnees
- `view_reports` - Voir les rapports

Pages : `/admin/analytics.html`, `/admin/analytics-reports.html`

Restrictions : Acces en lecture seule uniquement.

#### Admin Financial (`admin_financial`)

Permissions :
- `view_payments` - Voir les paiements
- `verify_payments` - Verifier les paiements
- `view_invoices` - Voir les factures
- `manage_subscriptions` - Gerer les abonnements
- `view_financial_reports` - Voir les rapports financiers

Pages : `/admin/financial.html`, `/admin/financial-invoices.html`, `/admin/financial-subscriptions.html`

### 4.3 Systeme de Permissions (API JS)

Les permissions sont stockees dans la colonne `admin_permissions` (JSONB) de la table `users`.

```javascript
import { adminRoles } from './js/admin-roles.js';

// Verifier une permission
const canEdit = await adminRoles.checkPermission('edit_vendors');

// Verifier l'acces a une page
const hasAccess = await adminRoles.canAccessPage('view_stores');

// Exiger une permission (redirige si pas d'acces)
await adminRoles.requirePermission('ban_stores');
```

Les permissions sont verifiees :
- Cote serveur via RPC `check_admin_permission`
- Cote client avant d'afficher les pages
- Avant chaque action sensible

### 4.4 Configuration initiale des roles

**Etape 1 :** Executez `schema-admin-roles.sql` dans Supabase Dashboard > SQL Editor

Cela cree :
- Le type enum `admin_role`
- Les colonnes necessaires dans la table `users`
- Les fonctions RPC (`create_admin`, `check_admin_permission`)
- La vue `admin_users_view`
- Les politiques RLS

**Etape 2 :** Creez le Super Admin (voir section 4.1)

**Etape 3 :** Connectez-vous en Super Admin et allez sur `/admin/admins.html` pour creer d'autres admins

### 4.5 Fonctions RPC (acces admin aux boutiques)

Le script `install-super-admin-complete.sql` cree 4 fonctions PostgreSQL avec `SECURITY DEFINER` qui permettent de bypasser RLS :

- **`check_admin_access`** : verifie si un utilisateur est admin
- **`get_all_stores_for_admin`** : retourne toutes les boutiques pour les admins
- **`create_admin_user`** : permet au super admin de creer d'autres admins
- **`get_admin_stats`** : retourne les statistiques globales

Le `password_hash` est stocke dans `localStorage` apres connexion pour authentifier les appels RPC. Si les fonctions RPC ne sont pas disponibles, le code utilise automatiquement la methode normale.

### 4.6 Creer un nouvel admin

1. Se connecter en tant que Super Admin
2. Aller sur `/admin/admins.html`
3. Cliquer sur "Creer un admin"
4. Remplir le formulaire :
   - Nom complet
   - Numero de telephone
   - Email (optionnel)
   - Role admin (Commercial, Gestionnaire, Commercial & Gestionnaire, Analytics, Financial)
   - Mot de passe
5. Le systeme cree l'admin avec les permissions appropriees

---

## 5. Securite Supabase

### Cle ANON (Publique) - Securisee dans le frontend

- C'est la cle dans `js/config.js`
- Elle est **faite pour etre publique** (dans le frontend)
- Elle est **protegee par RLS** (Row Level Security)
- Chaque utilisateur ne voit que SES propres donnees
- Meme si quelqu'un vole cette cle, il ne peut pas acceder aux donnees des autres

```
Utilisateur A avec la cle anon -> Voit seulement SES boutiques
Utilisateur B avec la meme cle anon -> Voit seulement SES boutiques
```

### Cle SERVICE_ROLE (Secrete) - JAMAIS dans le frontend

- C'est la cle dans `.env.local` (SUPABASE_SERVICE_ROLE_KEY)
- Elle **bypass toutes les regles de securite**
- Uniquement dans un backend (serveur Node.js, API, etc.)
- Jamais dans le code JavaScript du navigateur
- Toujours dans `.env.local` (jamais commite dans Git)

### Row Level Security (RLS)

RLS protege vos donnees automatiquement : chaque utilisateur ne peut acceder qu'a ses propres donnees, meme avec la meme cle ANON.

### Verification

Dans Supabase Dashboard :
1. Allez dans **Authentication** > **Policies**
2. Verifiez que chaque table a des policies actives
3. Testez : connectez-vous avec un utilisateur et essayez d'acceder aux donnees d'un autre

### Resume

| Cle | Ou l'utiliser | Securite |
|-----|---------------|----------|
| **ANON** | Frontend (JavaScript) | Securisee avec RLS |
| **SERVICE_ROLE** | Backend uniquement | Dangereuse si exposee |

---

## 6. Supabase Storage

### Creer le Bucket "products"

1. Dashboard Supabase > **Storage** > **New bucket**
2. Name : `products`
3. **Public bucket** : coche (images accessibles publiquement)
4. Cliquer **Create bucket**

### Politiques de securite

#### Developpement (permissif)

```sql
-- Lecture publique
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Upload pour utilisateurs authentifies
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Suppression pour utilisateurs authentifies
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

#### Production (restrictif)

```sql
-- Upload uniquement pour les vendeurs actifs
CREATE POLICY "Vendors can upload their products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  auth.uid() IN (
    SELECT user_id FROM stores WHERE is_active = true
  )
);

-- Lecture publique
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Suppression uniquement par le proprietaire
CREATE POLICY "Vendors can delete their products"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.uid() IN (
    SELECT user_id FROM stores WHERE is_active = true
  )
);
```

### URLs publiques

Les images uploadees sont accessibles via :

```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/products/[filename]
```

### Limites

- Supabase Free tier : **1 GB** de stockage, **50 MB** par fichier
- Le code limite a **5 MB** par image (voir `js/storage.js`)
- Types acceptes : PNG, JPG, WEBP

### Configuration production

1. Activer la compression automatique (Dashboard Supabase)
2. Configurer un CDN (Cloudflare) pour les images
3. Limiter les types de fichiers

Le code dans `js/storage.js` gere deja : validation type, limite taille, noms uniques, gestion d'erreurs.

---

## 7. Statistiques & Export

### Statistiques de Ventes

#### Commandes par Periode

```sql
SELECT
  id,
  created_at,
  total,
  status,
  currency,
  jsonb_array_length(items) as nb_items
FROM orders
WHERE store_id = :store_id
  AND created_at >= :date_start
  AND created_at <= :date_end
ORDER BY created_at DESC;
```

Filtres : par periode, par statut, par montant min/max.

#### Chiffre d'Affaires par Periode

```sql
SELECT
  DATE_TRUNC('month', created_at) as mois,
  COUNT(*) as nb_commandes,
  SUM(total::int) as ca_total,
  AVG(total::int) as panier_moyen
FROM orders
WHERE store_id = :store_id
  AND status IN ('delivered', 'confirmed')
  AND created_at >= :date_start
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mois DESC;
```

#### Commandes par Statut

```sql
SELECT
  status,
  COUNT(*) as nb_commandes,
  SUM(total::int) as total_fcfa
FROM orders
WHERE store_id = :store_id
GROUP BY status
ORDER BY nb_commandes DESC;
```

### Statistiques de Produits

#### Vues Produits

```sql
SELECT
  p.id,
  p.name,
  COUNT(*) as nb_vues,
  MAX(ce.created_at) as derniere_vue
FROM click_events ce
JOIN products p ON ce.product_id = p.id
WHERE ce.store_id = :store_id
  AND ce.event_type = 'view'
  AND ce.created_at >= :date_start
GROUP BY p.id, p.name
ORDER BY nb_vues DESC;
```

#### Ajouts Panier et Conversions

```sql
SELECT
  p.id,
  p.name,
  COUNT(CASE WHEN ce.event_type = 'cart_add' THEN 1 END) as ajouts_panier,
  COUNT(CASE WHEN ce.event_type = 'purchase' THEN 1 END) as achats,
  CASE
    WHEN COUNT(CASE WHEN ce.event_type = 'cart_add' THEN 1 END) > 0
    THEN (COUNT(CASE WHEN ce.event_type = 'purchase' THEN 1 END)::float /
          COUNT(CASE WHEN ce.event_type = 'cart_add' THEN 1 END) * 100)::numeric(5,2)
    ELSE 0
  END as taux_conversion
FROM products p
LEFT JOIN click_events ce ON p.id = ce.product_id
WHERE p.store_id = :store_id
GROUP BY p.id, p.name
ORDER BY achats DESC;
```

### Statistiques de Clients

#### Nouveaux Clients

```sql
SELECT
  c.id,
  c.full_name,
  c.phone,
  c.email,
  MIN(o.created_at) as premiere_commande,
  COUNT(o.id) as nb_commandes,
  SUM(o.total::int) as ca_total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.store_id = :store_id
  AND c.created_at >= :date_start
GROUP BY c.id, c.full_name, c.phone, c.email
ORDER BY premiere_commande DESC;
```

#### Clients Recurrents

```sql
SELECT
  c.id,
  c.full_name,
  c.phone,
  COUNT(o.id) as nb_commandes,
  SUM(o.total::int) as ca_total,
  MAX(o.created_at) as derniere_commande,
  EXTRACT(DAY FROM (NOW() - MAX(o.created_at))) as jours_inactivite
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE c.store_id = :store_id
GROUP BY c.id, c.full_name, c.phone
HAVING COUNT(o.id) >= 2
ORDER BY nb_commandes DESC;
```

### Statistiques Geographiques

```sql
SELECT
  COALESCE(c.region, 'Non specifie') as region,
  COUNT(o.id) as nb_commandes,
  SUM(o.total::int) as ca_total,
  AVG(o.total::int) as panier_moyen
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.store_id = :store_id
  AND o.created_at >= :date_start
GROUP BY COALESCE(c.region, 'Non specifie')
ORDER BY nb_commandes DESC;
```

### Methodes d'Export

#### Export CSV

```javascript
function exportToCSV(data, filename) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
```

#### Export Excel (SheetJS)

```javascript
import * as XLSX from 'xlsx';

function exportToExcel(data, filename, sheetName = 'Donnees') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
```

### Rapports recommandes

**Vendeur Pro (mensuel) :** CA mensuel, Top 10 produits, Nouveaux clients, Commandes par statut

**Vendeur Entreprise (trimestriel) :** Tout ci-dessus + Analyse geographique + Tendances + Engagement

**Admin (global) :** Toutes les boutiques, Comparaison par boutique, Statistiques agregees

### Notes

- Pour grandes quantites : utiliser pagination ou export asynchrone
- Format dates : ISO 8601 pour compatibilite
- Montants : toujours specifier la devise (FCFA/XOF)
- Confidentialite : masquer donnees sensibles si necessaire (RGPD)

---

## 8. Standards Accessibilite (WCAG / ISO 9241)

### Standards appliques

**WCAG 2.1 Niveau AA :**
- Touch targets : minimum 44x44px pour tous les elements interactifs
- Contraste de couleurs : ratio minimum 4.5:1 pour le texte normal
- Taille du texte : minimum 16px pour le body, 14px pour les labels
- Labels : tous les inputs ont des labels associes (`for` + `id`)
- Attributs ARIA : `aria-label`, `aria-required`, `aria-describedby`
- Navigation : structure semantique avec `<nav>`, `<header>`, `<main>`

**ISO 9241 (Ergonomie) :**
- Espacement : systeme de grille 8px pour alignements coherents
- Hierarchie visuelle : tailles de texte claires (12-30px)
- Feedback utilisateur : etats hover, active, focus visibles
- Consistance : classes reutilisables dans `css/input.css`

### Specifications techniques

#### Touch Targets
- Minimum : 44x44px (WCAG 2.1)
- Recommande : 48x48px
- Boutons : `min-h-[44px]` et `min-w-[44px]`

#### Typographie
- Body : 16px (evite zoom automatique sur mobile)
- Labels : 14px
- Titres : 20px, 24px, 30px selon hierarchie
- Line-height : 1.5 (ISO 9241)

#### Contraste
- Texte normal : 4.5:1 minimum
- Texte large (18px+) : 3:1 minimum
- Couleurs verifiees :
  - `#25D366` (accent) sur blanc : 4.5:1+
  - `#075E54` (primary) sur blanc : 4.5:1+
  - `#128C7E` (primary-light) sur blanc : 4.5:1+

#### Espacements (Grille 8px)
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

### Attributs d'accessibilite

- `aria-label` : description pour lecteurs d'ecran
- `aria-required` : indique les champs obligatoires
- `aria-describedby` : lie les hints aux inputs
- `aria-pressed` : etat des boutons de filtre
- `aria-hidden="true"` : masque les emojis decoratifs

### Regles de maintenance

1. Tous les boutons doivent avoir `min-h-[44px]` et `min-w-[44px]`
2. Tous les inputs doivent avoir un `<label>` avec `for` correspondant
3. Tous les textes doivent etre minimum 14px (16px pour body)
4. Tous les elements interactifs doivent avoir `aria-label` si le texte n'est pas explicite
5. Les emojis decoratifs doivent avoir `aria-hidden="true"`
6. Transitions douces : 200-300ms

---

## 9. Cloudflare (Gratuit)

### 6.1 Workers - Geolocalisation

Le Worker Cloudflare detecte automatiquement le pays, la ville et les coordonnees GPS des utilisateurs.

**Reponse du Worker :**

```json
{
  "country": "SN",
  "countryName": "Senegal",
  "city": "Dakar",
  "region": "Dakar",
  "latitude": 14.6937,
  "longitude": -17.4441,
  "timezone": "Africa/Dakar",
  "prefix": "+221",
  "flag": "\ud83c\uddf8\ud83c\uddf3",
  "ip": "41.82.xxx.xxx"
}
```

Utilise pour :
- Pre-remplir le prefixe telephonique
- Enregistrer la localisation dans le CRM
- Analytics geographiques
- Segmentation des clients

#### Deploiement rapide (5 minutes)

```bash
# 1. Installer Wrangler
npm install -g wrangler

# 2. Se connecter a Cloudflare
wrangler login

# 3. Deployer
cd cloudflare
wrangler deploy
```

Vous obtiendrez une URL comme : `https://majay-geolocation.workers.dev`

#### Configurer dans l'app

Ouvrez `js/geolocation.js` (ligne ~36) :

```javascript
const CLOUDFLARE_WORKER_URL = 'https://majay-geolocation.workers.dev';
```

#### Deploiement complet (tous les workers)

```bash
cd cloudflare

# Worker 1 : Geolocalisation
wrangler deploy worker.js --name majay-geolocation

# Worker 2 : Rate Limiter
wrangler deploy workers/rate-limiter.js --name majay-rate-limiter

# Worker 3 : Store Router
wrangler deploy workers/store-router.js --name majay-store-router
```

#### Configuration des Routes Workers

Dashboard Cloudflare > Workers Routes :

| Route | Worker |
|-------|--------|
| `majay.com/*` | majay-store-router |
| `api.majay.com/location` | majay-geolocation |
| `api.majay.com/rate-limit/*` | majay-rate-limiter |

#### Configuration wrangler.toml

Recuperez votre **Account ID** sur https://dash.cloudflare.com/ > Workers & Pages.

Dans `cloudflare/wrangler.toml`, remplacez :

```toml
account_id = "votre-account-id-ici"
```

#### Sous-domaine personnalise (optionnel)

Dans `wrangler.toml` :

```toml
routes = [
  { pattern = "majay.com/api/location", zone_name = "majay.com" }
]
```

#### Restriction CORS (production)

Dans `worker.js`, remplacez :

```javascript
'Access-Control-Allow-Origin': '*'
// Par :
'Access-Control-Allow-Origin': 'https://majay.com'
```

### 6.2 Page Rules (3 regles gratuites)

#### Regle 1 : Cache Agressif pour Assets Statiques

```
URL: *majay.com/css/*, *majay.com/js/*, *majay.com/images/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 week
```

#### Regle 2 : Pas de Cache pour Admin/Vendeur

```
URL: *admin.majay.com/*, *majay.com/vendeur/*
Settings:
- Cache Level: Bypass
- Security Level: High
```

#### Regle 3 : Force HTTPS Partout

```
URL: http://*majay.com/*
Settings:
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On
```

Configuration : Dashboard > Rules > Page Rules > Create Page Rule

#### Alternative : Transform Rules (illimitees gratuites)

Dashboard > Rules > Transform Rules > HTTP Response Header Modification

```
Expression: (http.request.uri.path contains "/css/" or http.request.uri.path contains "/js/")
Header: Cache-Control
Value: public, max-age=31536000
```

### 6.3 Email Routing (@majay.com)

Emails professionnels gratuits :

| Email | Redirige vers | Usage |
|-------|---------------|-------|
| contact@majay.com | votre-email@gmail.com | Contact general |
| support@majay.com | votre-email@gmail.com | Support clients |
| vendeurs@majay.com | votre-email@gmail.com | Questions vendeurs |
| admin@majay.com | votre-email@gmail.com | Admin technique |

#### Configuration

1. Dashboard Cloudflare > votre domaine > Email > Email Routing > Enable
2. Destination addresses > Add > votre email perso > verifier
3. Routing rules > Create address : `contact` > Forward to > votre email

#### Envoyer depuis contact@majay.com via Gmail

1. Gmail > Settings > Accounts and Import
2. Send mail as > Add another email address
3. Nom : MAJAY Support, Email : contact@majay.com
4. Suivre la verification

### 6.4 Configuration Complete Cloudflare

#### Phase 1 : Base (15 min)

1. Creer compte sur https://dash.cloudflare.com/sign-up
2. Ajouter domaine majay.com (Free Plan)
3. Changer les nameservers chez votre registrar
4. Activer SSL/TLS :

```
Dashboard > SSL/TLS
- SSL/TLS encryption mode: Full (Strict)
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On
- TLS 1.3: On
```

#### Phase 2 : Performance (10 min)

```
Dashboard > Speed > Optimization
- Auto Minify: JavaScript, CSS, HTML
- Brotli: On

Dashboard > Network
- HTTP/3 (QUIC): On
- 0-RTT Connection Resumption: On
- Early Hints: On
- WebSockets: On
```

#### Phase 3 : Securite (10 min)

```
Dashboard > Security > Settings
- Security Level: Medium
- Bot Fight Mode: On
- Browser Integrity Check: On

Dashboard > Security > WAF > Firewall rules
Rule 1: Bloquer pays risques (admin)
  Expression: (http.request.uri.path contains "/admin/") and (ip.geoip.country in {"CN" "RU" "KP"})
  Action: Block

Rule 2: Rate limit agressif API
  Expression: (http.request.uri.path contains "/api/") and (cf.threat_score gt 10)
  Action: Challenge
```

#### Phase 4 : DNS (5 min)

```
Dashboard > DNS > Records
- CNAME admin -> majay.com (Proxied)
- CNAME api -> majay.com (Proxied)

Dashboard > DNS > Settings
- DNSSEC: Enable
```

#### Phase 5 : Analytics (2 min)

```
Dashboard > Analytics > Web Analytics > Enable

Ajouter dans <head> de index.html :
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "VOTRE-TOKEN"}'></script>
```

### 6.5 Commandes utiles Wrangler

```bash
# Voir les logs en temps reel
wrangler tail majay-geolocation

# Tester localement
wrangler dev

# Lister vos workers
wrangler deployments list

# Supprimer un worker
wrangler delete majay-geolocation
```

### 6.6 Metriques attendues

| Metrique | Avant | Apres |
|----------|-------|-------|
| Load Time | 3-5s | 500ms-1s (-70%) |
| TTFB | 500ms-1s | 50-100ms (-80%) |
| Cache Hit | 0% | 85-90% |
| Bandwidth | 10GB/mois | 2GB/mois (-80%) |

**Verification :**
- SSL : https://www.ssllabs.com/ssltest/analyze.html?d=majay.com (Grade A+)
- Performance : https://www.webpagetest.org/ (< 1s)
- Security : https://securityheaders.com/?q=majay.com (Grade A)
- DNS : https://dnschecker.org/ (< 30 min)

**Cout total Cloudflare : 0 EUR** (100 000 requetes/jour Workers gratuites)

---

## 10. Git & GitHub

### Creer un depot

1. Allez sur https://github.com > "+" > "New repository"
2. Nom : `majay-v2`
3. Description : "Plateforme e-commerce pour WhatsApp et Telegram"
4. **Ne cochez PAS** "Initialize with README"
5. Cliquez "Create repository"

### Connecter le projet (premiere fois)

```bash
# Se placer dans le dossier du projet
cd "C:\Users\Dell Razer Pro\OneDrive\MAJAY V2"

# Verifier l'etat
git status

# Ajouter les fichiers
git add .

# Premier commit
git commit -m "Initial commit - MAJAY Platform"

# Ajouter le depot distant (remplacez VOTRE_USERNAME)
git remote add origin https://github.com/VOTRE_USERNAME/majay-v2.git

# Pousser vers GitHub
git branch -M main
git push -u origin main
```

### Si le depot existe deja

```bash
git remote add origin https://github.com/VOTRE_USERNAME/majay-v2.git
git pull origin main --allow-unrelated-histories
git add .
git commit -m "Merge avec depot GitHub existant"
git push -u origin main
```

### Authentification GitHub

Lors du `git push`, GitHub demandera un **Personal Access Token** (pas votre mot de passe).

1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. Nom : "MAJAY Project"
4. Permissions : cochez **repo** (acces complet)
5. Generate token
6. **Copiez le token** (vous ne le reverrez plus)

Alternative : `gh auth login` (GitHub CLI)

### Commandes Git utiles

```bash
git status                           # Voir l'etat des fichiers
git add .                            # Ajouter tous les fichiers
git add nom-du-fichier               # Ajouter un fichier specifique
git commit -m "Description"          # Faire un commit
git push origin main                 # Pousser vers GitHub
git pull origin main                 # Recuperer les dernieres modifications
git log                              # Voir l'historique
```

### Fichiers a ne PAS commiter

Le `.gitignore` exclut automatiquement les fichiers sensibles. Ne jamais commiter :
- `.env.local` (cles Supabase)
- Mots de passe en clair
- Cles API

---

## 11. Depannage

### Serveur

**Le serveur ne demarre pas :**
- Verifiez que le port n'est pas deja utilise
- Essayez un autre port : `python server.py 8080`

**La liste des fichiers s'affiche :**
- Utilisez `server.py` au lieu de `python -m http.server`

**Erreur 403 sur /admin/ :**
- Le serveur redirige automatiquement vers `index.html`
- Verifiez que `admin/index.html` existe

### Admin - Connexion

**Erreur "Numero de telephone ou mot de passe incorrect" :**
- Verifiez que l'utilisateur existe dans la table `users`
- Verifiez que `is_super_admin = true`
- Verifiez que le hash du mot de passe est correct (SHA-256 de "123456")

**L'utilisateur n'existe pas :**
- Executez le SQL de creation (section 4.1)

**Le `admin_role` est obligatoire :**
Le systeme verifie `admin_role` (ligne 84 de `admin-auth.js`). Si le champ est NULL, la connexion echouera meme avec les bons identifiants. Corrigez avec :

```sql
UPDATE users
SET
  admin_role = 'super_admin',
  admin_permissions = '{"all": true, "create_admins": true}'::jsonb,
  can_create_admins = true
WHERE phone = '+221780181144'
  AND is_super_admin = true;
```

**Erreur "Cannot read properties of undefined (reading 'digest')" :**
Cette erreur apparait si vous n'etes pas sur HTTPS ou localhost. Le mot de passe `123456` est dans la table de fallback. Accedez via `http://localhost:8000`.

**Erreur "crypto.subtle non disponible" :**
Utilisez `http://localhost:8000` (localhost fonctionne) ou HTTPS.

**Erreur "Cannot coerce the result to a single JSON object" :**

Causes possibles :
1. L'utilisateur existe dans Supabase Auth mais pas dans la table `users`
2. La colonne `is_super_admin` n'existe pas
3. L'ID utilisateur n'existe pas dans `users`

Solutions :

```sql
-- Verifier que l'utilisateur existe
SELECT * FROM users WHERE phone = '+221780181144';

-- Ajouter la colonne si manquante
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Creer un trigger pour creation automatique
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Admin - Permissions

**Un admin ne peut pas acceder a une page :**
1. Verifiez le role dans la table `users` (`admin_role`)
2. Verifiez les permissions dans `admin_permissions`
3. Verifiez la console du navigateur (F12)

**Les permissions ne fonctionnent pas :**
1. Verifiez que la fonction RPC `check_admin_permission` existe
2. Verifiez que RLS est correctement configure
3. Verifiez que l'utilisateur a bien un `admin_role`

**Erreur "Fonction create_admin n'existe pas" :**
- Executez `schema-admin-roles.sql` dans Supabase

### Routage

**Le routage ne fonctionne pas :**
1. Verifiez la presence du fichier de configuration (`.htaccess`, `_redirects`, `vercel.json`)
2. Verifiez les permissions du fichier
3. Verifiez les logs du serveur

**Erreur 404 sur les boutiques :**
1. Verifiez que le slug existe dans la base de donnees
2. Verifiez que la boutique est active (`is_active = true`)
3. Verifiez que `store-router.html` existe

**Le sous-domaine admin ne fonctionne pas :**
1. Verifiez la configuration DNS (propagation jusqu'a 48h)
2. Verifiez la configuration du serveur web
3. Testez : `curl -H "Host: admin.votresite.com" http://votre-ip/`

### Git & GitHub

**"remote origin already exists" :**
```bash
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/majay-v2.git
```

**"authentication failed" :**
- Utilisez un Personal Access Token au lieu du mot de passe
- Verifiez que le token a la permission `repo`

**"repository not found" :**
- Verifiez que le depot existe sur GitHub
- Verifiez l'URL : `git remote -v`

### Cloudflare

**"account_id is required" :**
- Ajoutez votre Account ID dans `wrangler.toml`

**"Not authenticated" :**
- Executez : `wrangler login`

**Le Worker ne retourne rien :**
- Verifiez les logs : `wrangler tail majay-geolocation`

**CORS error dans le navigateur :**
- Verifiez les headers CORS dans `worker.js`

### Tailwind CSS

**Les styles ne s'affichent pas :**
1. Verifiez que `css/output.css` existe
2. Recompilez : `npm run build:css`
3. Verifiez la console du navigateur (F12) pour des erreurs 404 sur `css/output.css`
4. Videz le cache : `Ctrl + F5`

### Supabase Storage

**"new row violates row-level security policy" :**
Les politiques ne sont pas configurees. Voir section 6.

**"Bucket not found" :**
Le bucket n'existe pas. Creez-le dans Dashboard > Storage.

**401 Unauthorized :**
L'utilisateur n'est pas authentifie. Verifiez la session.

### General

1. Verifiez la console du navigateur (F12)
2. Verifiez que le schema SQL a ete execute completement
3. Verifiez que RLS est active sur les tables
4. Verifiez les credentials dans `js/config.js`
