# Configuration Supabase Storage - SAMASTORE

## 1. Créer le Bucket "products"

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Storage**
4. Cliquez sur **New bucket**
5. Configurez le bucket :
   - **Name** : `products`
   - **Public bucket** : ✅ **COCHÉ** (important pour que les images soient accessibles publiquement)
   - Cliquez sur **Create bucket**

## 2. Configurer les Politiques (Policies)

### Option A : Politiques Permissives (Développement/Test)

Pour permettre à tous les utilisateurs authentifiés d'uploader et lire :

1. Cliquez sur le bucket `products`
2. Allez dans l'onglet **Policies**
3. Cliquez sur **New Policy**

#### Politique 1 : Lecture publique (SELECT)
```sql
-- Nom: Public Read Access
-- Operation: SELECT
-- Policy definition:
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');
```

#### Politique 2 : Upload pour utilisateurs authentifiés (INSERT)
```sql
-- Nom: Authenticated Upload
-- Operation: INSERT
-- Policy definition:
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');
```

#### Politique 3 : Suppression pour utilisateurs authentifiés (DELETE)
```sql
-- Nom: Authenticated Delete
-- Operation: DELETE
-- Policy definition:
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

### Option B : Politiques Restrictives (Production)

Pour limiter l'upload aux vendeurs de leur propre boutique :

```sql
-- Upload uniquement pour les vendeurs
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

-- Suppression uniquement par le propriétaire
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

## 3. Vérifier la Configuration

### Test via l'interface Supabase
1. Allez dans **Storage** > **products**
2. Essayez d'uploader manuellement un fichier
3. Si ça fonctionne, la configuration est correcte

### Test via le code
Utilisez ce code dans la console du navigateur (F12) :

```javascript
import { supabase } from './js/config.js';

// Test upload
const testFile = new File(['test'], 'test.png', { type: 'image/png' });
const { data, error } = await supabase.storage
  .from('products')
  .upload(`test_${Date.now()}.png`, testFile);

console.log('Upload result:', { data, error });
```

## 4. Limites et Quotas

Par défaut, Supabase Free tier offre :
- **1 GB** de stockage
- Taille max par fichier : **50 MB**

Notre code limite déjà à **5 MB** par image (voir `js/storage.js`).

## 5. URL Publiques

Les images uploadées seront accessibles via :
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/products/[filename]
```

## 6. Dépannage

### Erreur "new row violates row-level security policy"
➡️ Les politiques ne sont pas configurées. Suivez l'étape 2.

### Erreur "Bucket not found"
➡️ Le bucket n'existe pas. Créez-le (étape 1).

### Erreur "The resource already exists"
➡️ Un fichier avec le même nom existe déjà. Notre code génère des noms uniques, donc ce cas est rare.

### Erreur 401 Unauthorized
➡️ L'utilisateur n'est pas authentifié. Vérifiez que `authSAMASTORE.getSession()` retourne bien une session.

## 7. Configuration Recommandée pour Production

1. **Activer la compression automatique** (via Supabase Dashboard)
2. **Configurer un CDN** (Cloudflare) pour les images
3. **Mettre en place des webhooks** pour nettoyer les images orphelines
4. **Limiter les types de fichiers** : PNG, JPG, WEBP uniquement

## 8. Code Actuel

Le code dans `js/storage.js` est déjà bien configuré :
- ✅ Validation du type de fichier
- ✅ Limite de taille (5 MB)
- ✅ Noms de fichiers uniques
- ✅ Gestion d'erreurs

Aucune modification du code n'est nécessaire, seule la configuration Supabase doit être faite.
