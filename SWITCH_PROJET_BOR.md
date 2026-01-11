# 🔄 Switch vers "projet-bor" - Guide Complet

Basculer complètement du repo actuel vers le nouveau "projet-bor".

---

## 📋 ÉTAPE 1 : Créer le Repo "projet-bor" sur GitHub

### ⚡ Action Requise :

1. **Cliquez ici** : https://github.com/new

2. **Remplissez** :
   ```
   Repository name: projet-bor
   Description: Plateforme e-commerce MAJAY - Version production
   Visibility: Private (recommandé) ou Public
   
   ❌ IMPORTANT : NE COCHEZ RIEN !
   Ne pas ajouter README, .gitignore ou licence
   ```

3. **Cliquez** : **Create repository**

4. **IGNOREZ** les instructions de GitHub, revenez ici ! ⬇️

---

## 📋 ÉTAPE 2 : Switch vers "projet-bor" (Commandes Automatiques)

Une fois le repo créé, utilisez ces commandes :

```powershell
# 1. Supprimer l'ancienne remote
git remote remove origin

# 2. Ajouter la nouvelle remote "projet-bor"
git remote add origin https://github.com/biboulayeSN/projet-bor.git

# 3. Vérifier
git remote -v

# 4. Pousser tout le code vers "projet-bor"
git push -u origin main
```

---

## 🔐 Authentification GitHub

Lors du `git push`, GitHub demandera :

### Username :
```
biboulayeSN
```

### Password :
⚠️ N'utilisez PAS votre mot de passe GitHub !  
Utilisez un **Personal Access Token** :

#### Créer un Token (2 minutes) :

1. **Cliquez** : https://github.com/settings/tokens/new

2. **Remplissez** :
   ```
   Note: projet-bor-access
   Expiration: No expiration (ou 90 days)
   
   Cochez uniquement :
   ✅ repo (et tous ses sous-éléments)
   ```

3. **Generate token**

4. **COPIEZ LE TOKEN IMMÉDIATEMENT** 
   (Il ne s'affichera qu'une fois !)
   
   Format : `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

5. **Collez-le comme mot de passe** quand Git demande

---

## ✅ Vérification

Une fois poussé, vérifiez sur :
```
https://github.com/biboulayeSN/projet-bor
```

Vous devriez voir :
- ✅ Tous les fichiers du projet
- ✅ Tous les commits (historique complet)
- ✅ Le README.md s'affiche
- ✅ Dossiers : js/, css/, cloudflare/, vendeur/, admin/

---

## 📊 Ce qui sera Migré

**Tous les fichiers** :
```
✅ index.html, catalogue.html, etc.
✅ js/ (auth, admin, app, geolocation, demo-data)
✅ css/ (design-system, style, dashboard)
✅ vendeur/ (dashboard, inscription, connexion)
✅ admin/ (dashboard, connexion, gestion)
✅ cloudflare/ (workers, configs, guides)
✅ sql/ (schémas, migrations)
✅ Documentation (README, guides)
```

**Tous les commits** :
```
fe19f42 Ajout guides création projet-bor sur GitHub
e521776 Ajout guide récapitulatif implémentation Cloudflare
1c23bbb Implémentation complète fonctionnalités gratuites Cloudflare
a769061 Ajout README pour dossier Cloudflare Worker
... (historique complet)
```

---

## 🎯 Après le Switch

### Pour les futurs commits :

```powershell
# Comme d'habitude !
git add .
git commit -m "Mon message"
git push
```

Le code ira automatiquement vers **projet-bor** ! ✅

---

## 🔄 Si vous voulez Garder les 2 Repos

Si vous changez d'avis et voulez les 2 :

```powershell
# Ajouter l'ancien comme "backup"
git remote add backup https://github.com/biboulayeSN/projet-Majay-version-bib.git

# Pousser vers les 2
git push origin main      # projet-bor
git push backup main      # ancien repo
```

---

## 🆘 Dépannage

### Erreur : "remote origin already exists"

```powershell
git remote remove origin
# Puis recommencez l'étape 2
```

### Erreur : "Repository not found"

Vérifiez que vous avez bien créé le repo sur GitHub :
https://github.com/biboulayeSN/projet-bor

### Erreur : "Authentication failed"

Utilisez un Personal Access Token, pas votre mot de passe :
https://github.com/settings/tokens/new

---

## ✅ Résumé des Commandes

```powershell
# 1. Créer le repo sur https://github.com/new
#    Nom: projet-bor
#    Private/Public selon votre choix

# 2. Switch la remote
git remote remove origin
git remote add origin https://github.com/biboulayeSN/projet-bor.git

# 3. Pousser
git push -u origin main

# 4. Vérifier sur GitHub
#    https://github.com/biboulayeSN/projet-bor
```

---

**C'est parti ! 🚀**
