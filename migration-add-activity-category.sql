-- ============================================================================
-- Migration: Ajout de la colonne activity_category à la table stores
-- ============================================================================
-- Date: 2024
-- Description: Ajoute une colonne pour catégoriser l'activité des boutiques
-- ============================================================================

-- Ajouter la colonne activity_category à la table stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS activity_category VARCHAR(100);

-- Créer un index pour améliorer les performances des requêtes de recherche/filtrage
CREATE INDEX IF NOT EXISTS idx_stores_activity_category ON stores(activity_category);

-- Commentaire sur la colonne
COMMENT ON COLUMN stores.activity_category IS 'Catégorie d''activité de la boutique (ex: Mode, Alimentaire, Électronique, etc.)';
