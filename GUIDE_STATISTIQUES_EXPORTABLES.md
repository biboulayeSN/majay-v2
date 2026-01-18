# Guide des Statistiques Exportables - MA-JAY

Ce document détaille toutes les combinaisons de statistiques disponibles depuis la base de données MA-JAY et les méthodes pour les exporter en Excel/CSV.

## Table des matières

1. [Statistiques de Ventes](#statistiques-de-ventes)
2. [Statistiques de Produits](#statistiques-de-produits)
3. [Statistiques de Clients](#statistiques-de-clients)
4. [Statistiques Géographiques](#statistiques-géographiques)
5. [Statistiques de Tendances](#statistiques-de-tendances)
6. [Statistiques d'Engagement](#statistiques-dengagement)
7. [Méthodes d'Export](#méthodes-dexport)

---

## Statistiques de Ventes

### 1. Commandes par Période

**Tables utilisées** : `orders`

**Colonnes exportables** :
- Date de commande (`created_at`)
- Numéro de commande (`id`)
- Total de la commande (`total`)
- Statut (`status`: pending, confirmed, preparing, ready, delivered, cancelled)
- Devise (`currency`)
- Nombre d'articles (`items.length`)

**Filtres possibles** :
- Par période (jour, semaine, mois, trimestre, année, plage personnalisée)
- Par statut
- Par montant min/max

**Requête SQL exemple** :
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

**Export Excel** : `Commandes_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

### 2. Chiffre d'Affaires (CA) par Période

**Tables utilisées** : `orders`

**Colonnes exportables** :
- Période (jour/semaine/mois)
- CA total
- Nombre de commandes
- Panier moyen (CA / nombre de commandes)

**Filtres possibles** :
- Par période
- Par statut (uniquement commandes livrées/confirmées)

**Requête SQL exemple** :
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
  AND created_at <= :date_end
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mois DESC;
```

**Export Excel** : `CA_Periodique_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

### 3. Commandes par Statut

**Tables utilisées** : `orders`

**Colonnes exportables** :
- Statut
- Nombre de commandes
- Total en FCFA
- Pourcentage du total

**Requête SQL exemple** :
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

**Export Excel** : `Commandes_par_Statut.xlsx`

---

## Statistiques de Produits

### 4. Produits Actifs/Inactifs

**Tables utilisées** : `products`

**Colonnes exportables** :
- ID produit
- Nom (`name`)
- Catégorie (`category`)
- Prix (`price`)
- Stock (`stock`)
- Statut (`is_active`)
- Date de création (`created_at`)

**Filtres possibles** :
- Par statut (actif/inactif)
- Par catégorie
- Par stock (en rupture, disponible)

**Requête SQL exemple** :
```sql
SELECT 
  id,
  name,
  category,
  price,
  stock,
  is_active,
  created_at
FROM products
WHERE store_id = :store_id
ORDER BY created_at DESC;
```

**Export Excel** : `Produits_Inventaire.xlsx`

---

### 5. Vues Produits

**Tables utilisées** : `click_events`, `products`

**Colonnes exportables** :
- ID produit
- Nom produit
- Nombre de vues
- Date dernière vue

**Filtres possibles** :
- Par période
- Par produit

**Requête SQL exemple** :
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

**Export Excel** : `Vues_Produits_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

### 6. Ajouts Panier et Conversions

**Tables utilisées** : `click_events`, `products`, `orders`

**Colonnes exportables** :
- ID produit
- Nom produit
- Ajouts panier (`event_type = 'cart_add'`)
- Achats (`event_type = 'purchase'`)
- Taux de conversion (achats / ajouts panier * 100)

**Requête SQL exemple** :
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
  AND (ce.created_at >= :date_start OR ce.created_at IS NULL)
GROUP BY p.id, p.name
ORDER BY achats DESC;
```

**Export Excel** : `Produits_Performance_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

## Statistiques de Clients

### 7. Nouveaux Clients

**Tables utilisées** : `customers`, `orders`

**Colonnes exportables** :
- ID client
- Nom (`full_name`)
- Téléphone (`phone`)
- Email (`email`)
- Date première commande
- Nombre de commandes
- CA total généré

**Filtres possibles** :
- Par période d'inscription
- Par nombre de commandes

**Requête SQL exemple** :
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

**Export Excel** : `Nouveaux_Clients_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

### 8. Clients Récurrents

**Tables utilisées** : `customers`, `orders`

**Colonnes exportables** :
- ID client
- Nom
- Téléphone
- Nombre de commandes (≥ 2)
- CA total
- Dernière commande
- Jours depuis dernière commande

**Requête SQL exemple** :
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

**Export Excel** : `Clients_Recurrents.xlsx`

---

### 9. Commandes par Client

**Tables utilisées** : `customers`, `orders`

**Colonnes exportables** :
- ID client
- Nom
- Téléphone
- Liste des commandes (dates, montants, statuts)

**Export Excel** : `Commandes_par_Client.xlsx`

---

## Statistiques Géographiques

### 10. Commandes par Région

**Tables utilisées** : `regional_stats` (si disponible), `orders`, `customers`

**Colonnes exportables** :
- Région/Ville
- Nombre de commandes
- CA total
- Panier moyen

**Note** : Cette statistique nécessite que les données géographiques soient collectées dans `customers` ou `orders`.

**Requête SQL exemple** :
```sql
SELECT 
  COALESCE(c.region, 'Non spécifié') as region,
  COUNT(o.id) as nb_commandes,
  SUM(o.total::int) as ca_total,
  AVG(o.total::int) as panier_moyen
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.store_id = :store_id
  AND o.created_at >= :date_start
GROUP BY COALESCE(c.region, 'Non spécifié')
ORDER BY nb_commandes DESC;
```

**Export Excel** : `Commandes_par_Region_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

## Statistiques de Tendances

### 11. Produits Tendance

**Tables utilisées** : `trend_data` (si disponible), `products`, `click_events`

**Colonnes exportables** :
- ID produit
- Nom produit
- Rang global
- Rang catégorie
- Score de tendance
- Date de snapshot

**Note** : Nécessite que le système de tendances soit activé.

**Export Excel** : `Produits_Tendance_YYYY-MM-DD.xlsx`

---

## Statistiques d'Engagement

### 12. Vues Catalogue

**Tables utilisées** : `click_events`

**Colonnes exportables** :
- Date
- Nombre de vues (`event_type = 'view'`)
- Nombre de clics sur produits

**Filtres possibles** :
- Par période
- Par jour/semaine/mois

**Requête SQL exemple** :
```sql
SELECT 
  DATE(created_at) as date_vue,
  COUNT(*) as nb_vues
FROM click_events
WHERE store_id = :store_id
  AND event_type = 'view'
  AND created_at >= :date_start
GROUP BY DATE(created_at)
ORDER BY date_vue DESC;
```

**Export Excel** : `Vues_Catalogue_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

### 13. Événements Utilisateur (Clics)

**Tables utilisées** : `click_events`

**Colonnes exportables** :
- Type d'événement (`event_type`: view, cart_add, purchase)
- Nombre d'occurrences
- Date

**Requête SQL exemple** :
```sql
SELECT 
  event_type,
  DATE(created_at) as date_event,
  COUNT(*) as nb_occurrences
FROM click_events
WHERE store_id = :store_id
  AND created_at >= :date_start
GROUP BY event_type, DATE(created_at)
ORDER BY date_event DESC, event_type;
```

**Export Excel** : `Evenements_Engagement_YYYY-MM-DD_YYYY-MM-DD.xlsx`

---

## Méthodes d'Export

### Export CSV (Simple)

**Utilisation** :
- Idéal pour traitement Excel, Google Sheets, ou analyses simples
- Format : `nom_fichier_YYYY-MM-DD.csv`
- Encodage : UTF-8 avec BOM pour Excel

**Méthode JavaScript** :
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

---

### Export Excel (XLSX)

**Bibliothèques recommandées** :
- **SheetJS (xlsx)** : Gratuite, open-source
- **ExcelJS** : Plus de fonctionnalités (styles, graphiques)

**Installation SheetJS** :
```bash
npm install xlsx
```

**Méthode JavaScript** :
```javascript
import * as XLSX from 'xlsx';

function exportToExcel(data, filename, sheetName = 'Données') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
```

---

### Export PDF (Optionnel)

**Bibliothèques recommandées** :
- **jsPDF** : Génération PDF côté client
- **Puppeteer** (backend) : Pour rapports complexes

---

## Combinaisons Recommandées pour Rapports

### Rapport Vendeur Pro/Entreprise (Mensuel)

1. CA mensuel + évolution
2. Top 10 produits vendus
3. Nouveaux clients
4. Commandes par statut

### Rapport Vendeur Entreprise (Trimestriel)

1. Toutes les statistiques ci-dessus
2. Analyse géographique (si disponible)
3. Analyse tendances (si disponible)
4. Analyse engagement (vues, clics, conversions)

### Rapport Admin (Global)

1. Toutes les boutiques
2. Comparaison par boutique
3. Statistiques agrégées plateforme

---

## Implémentation dans MA-JAY

### Endpoints API suggérés

```
GET /api/analytics/export/sales?store_id=:id&format=csv&period=month
GET /api/analytics/export/products?store_id=:id&format=xlsx&period=year
GET /api/analytics/export/customers?store_id=:id&format=csv
```

### Interface Utilisateur

**Pour Vendeur Pro/Entreprise** :
- Bouton "Exporter" sur chaque page Analytics
- Sélection format (CSV/Excel)
- Sélection période (Dernière semaine, Dernier mois, Personnalisée)

**Pour Admin** :
- Export global toutes boutiques
- Export par boutique sélectionnée
- Rapports automatiques périodiques

---

## Notes Importantes

1. **Performance** : Pour grandes quantités de données, utiliser pagination ou export asynchrone
2. **Sécurité** : Vérifier les permissions (RLS) avant export
3. **Format Dates** : Utiliser format ISO 8601 pour compatibilité
4. **Montants** : Toujours spécifier la devise (FCFA/XOF)
5. **Confidentialité** : Masquer données sensibles clients si nécessaire (RGPD)

---

**Dernière mise à jour** : 2025-01-26
