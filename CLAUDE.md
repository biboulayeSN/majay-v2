# CLAUDE.md - Contexte Projet MAJAY V2 / SAMASTORE

> Ce fichier est mis a jour a chaque interaction. Il sert de memoire persistante pour eviter la perte de contexte et economiser des tokens.

---

## 1. Projet

**Nom** : MAJAY V2 / SAMASTORE
**Type** : Plateforme e-commerce SaaS multi-vendeurs
**Cible** : Vendeurs au Senegal, commandes via WhatsApp/Telegram
**Stack** : Vanilla JS (ES6 modules), Tailwind CSS v3.4.1, PostCSS, Supabase (PostgreSQL + Auth + Storage), Vercel

## 2. Architecture

### 3 Espaces
- **Public** : `index.html` (landing), `catalogue.html` (vitrine produits), `demo-shop.html`
- **Vendeur** : `vendeur/*.html` — dashboard, produits, commandes, clients, analytics, abonnements, profil, agents, depot, transferts, comptabilite, rapports
- **Admin** : `admin/*.html` — dashboard, connexion, admins, vendeur, stores, analytics, subscriptions, commercial, gestionnaire, financial

### Navigation SPA
- `VendorRouter` (vendeur) et `AdminRouter` (admin) via attributs `data-route`
- Sidebar dynamique generee par JS (`js/components/sidebar.js`, `js/components/admin-nav.js`)

### Auth
- **Vendeurs** : Phone OTP via Supabase Auth
- **Admins** : Phone + SHA-256 password, roles RBAC (super_admin, commercial, gestionnaire, commercial_gestionnaire, analytics, financial)

### Fichiers cles
- `js/supabase-config.js` — Config Supabase client
- `js/auth.js` — Auth vendeur (OTP phone)
- `js/admin-auth.js` — Auth admin (phone + password)
- `js/admin-roles.js` — Constantes roles admin
- `js/vendor-router.js` — SPA router vendeur
- `js/admin-router.js` — SPA router admin
- `js/app.js` — Point d'entree catalogue public

## 3. Refonte UI — Design Minimal Notion (EN COURS)

### Objectif
Migration complete du design WhatsApp-vert (gradients, shadows, animations lourdes) vers un **design minimal type Notion** : flat, epure, blanc/noir/gris, 1 couleur accent bleu, zero bruit visuel. Focus performance mobile.

### Palette de couleurs (Notion)
```
primary: #2383e2 (bleu Notion)
primary-hover: #1a6bc4
text: #37352f (noir Notion)
text-secondary: #787774
text-tertiary: #b4b4b0
bg: #ffffff
bg-secondary: #f7f7f5 (gris chaud sidebar)
bg-hover: #efefef
border: #e5e5e3
border-dark: #d3d3d0
success: #4daa57
warning: #cb912f
danger: #e03e3e
```

### Principes de design appliques
- **Ombres** : Aucune ou `0 1px 2px rgba(0,0,0,0.04)` max
- **Bordures** : `1px solid #e5e5e3` partout
- **Border-radius** : 6px boutons, 8px cards
- **Animations** : Zero sauf `transition: 0.1s` sur hover (background uniquement)
- **Boutons** : Rectangulaires, pas de pills (rounded-md au lieu de rounded-full)
- **Icones** : Texte simple, pas d'emojis dans sidebar/nav
- **Badges** : Background colore subtil (ex: badge-success = bg #e6f4ea, text #1e7e34)
- **Dark mode** : Notion dark (#191919 bg, #202020 secondary, #333 borders)

### Progression de la refonte

| # | Fichier | Statut | Notes |
|---|---------|--------|-------|
| 1 | `tailwind.config.js` | FAIT | Nouvelle palette, shadows simplifiees, z-index, border-radius |
| 2 | `css/input.css` | FAIT | Reecrit ~800 lignes (avant: 1512). Supprime: gradients, relief, glassmorphism, ripple, hover-lift, premium effects |
| 3 | `css/animations.css` | FAIT | Vide sauf spinner (spin + spinner-small) |
| 4 | `js/components/sidebar.js` | FAIT | Emojis supprimes, texte "SAMASTORE", style plat |
| 5 | `js/components/admin-nav.js` | FAIT | Emojis supprimes, initiales avatar, fond clair |
| 6 | `js/components/fullscreen-menu.js` | FAIT | Fond blanc, texte 1rem, pas d'animations stagger |
| 7 | `js/theme-manager.js` | FAIT | Couleurs dark Notion, symboles unicode au lieu d'emojis |
| 8 | `index.html` | FAIT | Lottie supprime (~150KB), hero texte simple, pricing cards bordure, pas de gradients |
| 9 | `catalogue.html` | FAIT | Header simplifie, categories texte sans emojis, modals bordure fine, fab minimal |
| 10 | `vendeur/connexion.html` | A FAIRE | |
| 11 | `vendeur/inscription.html` | A FAIRE | |
| 12 | `vendeur/dashboard.html` | A FAIRE | |
| 13 | `vendeur/produits.html` | A FAIRE | |
| 14 | `admin/connexion.html` | A FAIRE | |
| 15 | `admin/dashboard.html` | A FAIRE | |
| 16 | Autres pages vendeur | A FAIRE | commandes, clients, analytics, abonnements, profil, agents, depot, etc. |
| 17 | Autres pages admin | A FAIRE | admins, vendeur, stores, commercial, gestionnaire, etc. |
| 18 | Build CSS final | A FAIRE | `npm run build:css` + verification |

### Ce qui a ete supprime (global)
- **Lottie.js** : Supprime de index.html (economie ~150KB JS + fichier JSON animation)
- **Animations CSS** : shimmer, glow, float, bounce-in, slide-in, gradient-shift, pulse-glow, ripple, stagger, fade-in — toutes supprimees
- **Effets visuels** : glassmorphism, backdrop-blur, hover-lift, hover-scale, hover-glow, card-premium, btn-premium, modal-premium, shadow-premium, gradient-overlay, admin-card-relief, admin-stat-relief, admin-table-relief, empty-state-relief (les classes existent toujours en CSS mais sont maintenant flat)
- **Inline styles** dans fullscreen-menu.js (remplaces par classes CSS)

## 4. Consolidation Documentation (FAIT)

- 27 fichiers .md fusionnes en un seul `DOCUMENTATION.md`
- 11 sections : Demarrage, Architecture, Espace Vendeur, Espace Admin, Securite Supabase, Storage, Statistiques, Accessibilite, Cloudflare, Git, Depannage

## 5. Commandes utiles

```bash
# Build CSS Tailwind
npm run build:css
# ou directement
npx tailwindcss -i css/input.css -o css/output.css --minify

# Serveur local
python server.py

# Git
git status
git add -A && git commit -m "message"
```

## 6. Decisions et conventions

- **Pas d'emojis** dans les composants de navigation (sidebar, admin-nav, fullscreen-menu)
- **Pas de rounded-full** pour les boutons (utiliser rounded-md = 6px)
- **Pas de bg-gradient-to-*** nulle part dans le HTML
- **Pas de shadow-lg/xl** — max shadow-sm si necessaire
- **Transitions** : uniquement `transition: background 0.1s` ou `transition: border-color 0.1s`
- **Modals** : fond `bg-black/40` (pas de backdrop-blur), bordure `border border-border`
- **Badge couleurs** : fond pastel + texte fonce (pas bg-color + text-white)

---

*Derniere mise a jour : 2026-02-22 — Refonte UI en cours (10/18 fichiers termines)*
