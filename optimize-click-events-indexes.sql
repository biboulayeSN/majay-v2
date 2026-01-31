-- ============================================================================
-- Optimisation des index pour les requêtes de top localités
-- ============================================================================
-- Date: 2024
-- Description: Ajoute des index composites pour optimiser les requêtes
--              de groupement par localité sur click_events
-- ============================================================================

-- Vérifier que les index existants sont présents
-- (Ces index devraient déjà exister d'après le schéma)

-- Index composite pour optimiser les requêtes de top localités par produit
CREATE INDEX IF NOT EXISTS idx_click_events_product_city 
ON click_events(product_id, customer_city) 
WHERE customer_city IS NOT NULL;

-- Index composite pour optimiser les requêtes de top localités par boutique
CREATE INDEX IF NOT EXISTS idx_click_events_store_city 
ON click_events(store_id, customer_city) 
WHERE customer_city IS NOT NULL;

-- Index pour améliorer les requêtes de comptage par localité
CREATE INDEX IF NOT EXISTS idx_click_events_city_region 
ON click_events(customer_city, customer_region) 
WHERE customer_city IS NOT NULL;

-- Commentaires
COMMENT ON INDEX idx_click_events_product_city IS 'Optimise les requêtes de top localités par produit';
COMMENT ON INDEX idx_click_events_store_city IS 'Optimise les requêtes de top localités par boutique';
COMMENT ON INDEX idx_click_events_city_region IS 'Optimise les requêtes de groupement par localité';
