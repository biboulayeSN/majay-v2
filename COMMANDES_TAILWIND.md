# 🚀 Comment Ouvrir le Projet avec Tailwind CSS

## 📋 Étapes pour Voir le Projet

### **Étape 1 : Compiler le CSS** (OBLIGATOIRE)

Avant de lancer le serveur, vous devez compiler le CSS Tailwind :

```powershell
npm run build:css
```

**Pourquoi ?** 
- Tailwind génère un fichier CSS à partir de `css/input.css`
- Ce fichier CSS contient uniquement les classes que vous utilisez
- Sans compilation, les pages n'auront pas de styles !

**⚠️ Important :** 
- Faites cette commande **à chaque fois** que vous modifiez `css/input.css` ou `tailwind.config.js`
- Ou utilisez `npm run watch:css` pour compilation automatique

---

### **Étape 2 : Lancer le Serveur**

Une fois le CSS compilé, lancez le serveur :

```powershell
# Option 1 : Serveur Python (recommandé)
python server.py

# Option 2 : Serveur Node.js
npx --yes http-server -p 8000
```

---

### **Étape 3 : Ouvrir dans le Navigateur**

Une fois le serveur lancé, ouvrez votre navigateur et allez sur :

```
http://localhost:8000
```

Ou pour une page spécifique :
- **Page d'accueil** : `http://localhost:8000/index.html`
- **Catalogue** : `http://localhost:8000/catalogue.html?shop=votre-slug`
- **Inscription vendeur** : `http://localhost:8000/vendeur/inscription.html`
- **Dashboard admin** : `http://localhost:8000/admin/dashboard.html`

---

## 🔄 Commandes Utiles

### Compiler le CSS (une fois)
```powershell
npm run build:css
```

### Compiler et Surveiller (recompilation automatique)
```powershell
npm run watch:css
```
**→ Laissez cette commande tourner dans un terminal séparé pendant le développement**

### Lancer le serveur (dans un autre terminal)
```powershell
python server.py
```

---

## ✅ Vérification

Une fois le serveur lancé, vous devriez voir :
- ✅ Les styles Tailwind appliqués (couleurs WhatsApp vertes)
- ✅ Le design moderne et responsive
- ✅ Les animations fonctionnelles
- ✅ Toutes les pages stylisées correctement

---

## 🆘 Si les Styles ne S'affichent Pas

1. **Vérifiez que `css/output.css` existe**
   ```powershell
   Test-Path css/output.css
   ```
   → Doit retourner `True`

2. **Recompilez le CSS**
   ```powershell
   npm run build:css
   ```

3. **Vérifiez la console du navigateur** (F12)
   - Regardez s'il y a des erreurs 404 pour `css/output.css`
   - Vérifiez que le chemin est correct dans les fichiers HTML

4. **Videz le cache du navigateur**
   - Appuyez sur `Ctrl + F5` pour forcer le rechargement
   - Ou utilisez le mode navigation privée

---

## 📝 Workflow Recommandé

Pour développer efficacement :

**Terminal 1** - Compilation automatique CSS :
```powershell
npm run watch:css
```

**Terminal 2** - Serveur web :
```powershell
python server.py
```

**Navigateur** :
- Ouvrez `http://localhost:8000`
- Appuyez sur `F5` pour recharger après modifications HTML
- Le CSS se recompile automatiquement grâce à `watch:css`

---

## 🎉 C'est Tout !

Votre projet est maintenant avec Tailwind CSS ! 🚀
