# 🚀 Créer "projet-bor" sur GitHub - GUIDE RAPIDE

Vous avez déjà un repo GitHub. On va créer un **nouveau repo séparé** appelé "projet-bor".

---

## 🎯 OPTION 1 : Nouveau Repo Séparé (RECOMMANDÉ)

### Étape 1 : Créer le Repo sur GitHub

1. **Allez sur** : https://github.com/new

2. **Remplissez** :
   ```
   Repository name: projet-bor
   Description: Plateforme e-commerce MAJAY - Version production
   Visibility: Private (ou Public selon votre choix)
   
   ❌ NE COCHEZ RIEN (pas de README, .gitignore, ou licence)
   ```

3. **Cliquez** : **Create repository**

4. **GitHub vous montrera des commandes**. Ignorez-les, utilisez les miennes ci-dessous ! ⬇️

---

### Étape 2 : Ajouter la Nouvelle Remote

```powershell
# Ajouter "projet-bor" comme nouvelle remote
git remote add projet-bor https://github.com/VOTRE-USERNAME/projet-bor.git

# Vérifier
git remote -v
```

Vous verrez maintenant **2 remotes** :
```
origin      https://github.com/biboulayeSN/projet-Majay-version-bib.git
projet-bor  https://github.com/VOTRE-USERNAME/projet-bor.git
```

---

### Étape 3 : Pousser vers "projet-bor"

```powershell
# Pousser tous les commits vers le nouveau repo
git push projet-bor main
```

✅ **Terminé !** Votre code est maintenant sur "projet-bor" !

---

### Étape 4 : Vérification

Allez sur :
```
https://github.com/VOTRE-USERNAME/projet-bor
```

Vous devriez voir tout le projet ! 🎉

---

## 🎯 OPTION 2 : Remplacer la Remote Actuelle

Si vous voulez **remplacer** l'ancienne remote par "projet-bor" :

```powershell
# Supprimer l'ancienne remote
git remote remove origin

# Ajouter la nouvelle
git remote add origin https://github.com/VOTRE-USERNAME/projet-bor.git

# Pousser
git push -u origin main
```

---

## 📝 Pour les Futurs Commits

### Si vous gardez 2 remotes :

```powershell
# Pousser vers l'ancien repo
git push origin main

# Pousser vers projet-bor
git push projet-bor main

# Pousser vers les 2 en même temps
git push origin main && git push projet-bor main
```

### Si vous avez remplacé la remote :

```powershell
# Comme d'habitude
git push
```

---

## 🔐 Authentification

Quand Git demande username/password :

- **Username** : Votre nom d'utilisateur GitHub
- **Password** : Utilisez un **Personal Access Token**

### Créer un Token :

1. https://github.com/settings/tokens
2. **Generate new token** → **Classic**
3. Nom : `projet-bor`
4. Cochez : **repo** (tous les sous-éléments)
5. **Generate token**
6. **COPIEZ-LE** (vous ne le reverrez plus !)
7. Utilisez-le comme **mot de passe**

---

## ✅ Résumé

```powershell
# 1. Créer repo sur https://github.com/new
#    Nom: projet-bor

# 2. Ajouter remote
git remote add projet-bor https://github.com/VOTRE-USERNAME/projet-bor.git

# 3. Pousser
git push projet-bor main

# 4. Vérifier sur GitHub !
```

---

**N'oubliez pas de remplacer `VOTRE-USERNAME` par votre vrai nom d'utilisateur GitHub !** 😊
