/**
 * Module d'analytics et exportation pour les administrateurs
 * Fonctions pour générer des rapports détaillés avec insights géographiques
 */

import { supabase } from "./config.js";

/**
 * Obtenir le Top 5 des localités ayant généré le plus de clics pour un produit ou une boutique
 * @param {string} targetId - ID du produit ou de la boutique
 * @param {string} type - 'product' ou 'store'
 * @returns {Promise<Array>} Top 5 des localités avec nombre de clics
 */
export async function getTopLocalitiesByClick(targetId, type = 'product') {
    try {
        let query = supabase
            .from('click_events')
            .select('customer_city, customer_region')
            .not('customer_city', 'is', null);

        // Filtrer par product_id ou store_id selon le type
        if (type === 'product') {
            query = query.eq('product_id', targetId);
        } else if (type === 'store') {
            query = query.eq('store_id', targetId);
        } else {
            throw new Error('Type invalide. Utilisez "product" ou "store"');
        }

        const { data: clicks, error } = await query;

        if (error) throw error;

        // Grouper par localité et compter
        const localitiesMap = {};
        clicks?.forEach(click => {
            const locality = click.customer_city || 'Non spécifié';
            const region = click.customer_region || '';
            const key = `${locality}${region ? `, ${region}` : ''}`;
            
            if (!localitiesMap[key]) {
                localitiesMap[key] = {
                    city: locality,
                    region: region,
                    count: 0
                };
            }
            localitiesMap[key].count++;
        });

        // Convertir en tableau, trier par nombre de clics décroissant et limiter à 5
        const topLocalities = Object.values(localitiesMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return topLocalities;
    } catch (error) {
        console.error('Erreur getTopLocalitiesByClick:', error);
        return [];
    }
}

/**
 * Obtenir le nombre total de vues pour une boutique
 * @param {string} storeId - ID de la boutique
 * @returns {Promise<number>} Nombre total de vues
 */
async function getTotalViewsForStore(storeId) {
    try {
        // Option 1: Utiliser product_analytics (plus précis, agrégé par date)
        const { data: analytics, error: analyticsError } = await supabase
            .from('product_analytics')
            .select('views')
            .eq('store_id', storeId);

        if (!analyticsError && analytics && analytics.length > 0) {
            return analytics.reduce((sum, a) => sum + (a.views || 0), 0);
        }

        // Option 2: Fallback sur products.views_count
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('views_count')
            .eq('store_id', storeId)
            .eq('is_active', true);

        if (productsError) throw productsError;

        return products?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
    } catch (error) {
        console.error('Erreur getTotalViewsForStore:', error);
        return 0;
    }
}

/**
 * Obtenir le nombre total de clics pour une boutique
 * @param {string} storeId - ID de la boutique
 * @returns {Promise<number>} Nombre total de clics
 */
async function getTotalClicksForStore(storeId) {
    try {
        const { count, error } = await supabase
            .from('click_events')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Erreur getTotalClicksForStore:', error);
        return 0;
    }
}

/**
 * Obtenir le nombre de vues pour un produit
 * @param {string} productId - ID du produit
 * @returns {Promise<number>} Nombre de vues
 */
async function getViewsForProduct(productId) {
    try {
        // Essayer product_analytics d'abord
        const { data: analytics, error: analyticsError } = await supabase
            .from('product_analytics')
            .select('views')
            .eq('product_id', productId);

        if (!analyticsError && analytics && analytics.length > 0) {
            return analytics.reduce((sum, a) => sum + (a.views || 0), 0);
        }

        // Fallback sur products.views_count
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('views_count')
            .eq('id', productId)
            .single();

        if (productError) throw productError;
        return product?.views_count || 0;
    } catch (error) {
        console.error('Erreur getViewsForProduct:', error);
        return 0;
    }
}

/**
 * Obtenir le nombre de clics pour un produit
 * @param {string} productId - ID du produit
 * @returns {Promise<number>} Nombre de clics
 */
async function getClicksForProduct(productId) {
    try {
        const { count, error } = await supabase
            .from('click_events')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', productId);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Erreur getClicksForProduct:', error);
        return 0;
    }
}

/**
 * Générer un rapport global complet avec toutes les données
 * @returns {Promise<Object>} Rapport structuré avec boutiques, produits et insights géographiques
 */
export async function genererRapportGlobal() {
    try {
        // 1. Récupérer toutes les boutiques avec leurs propriétaires
        const { data: stores, error: storesError } = await supabase
            .from('stores')
            .select(`
                id,
                name,
                slug,
                city,
                region,
                activity_category,
                owner:users!stores_owner_id_fkey (
                    id,
                    full_name,
                    phone
                )
            `)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (storesError) throw storesError;

        // 2. Pour chaque boutique, récupérer les produits et calculer les stats
        const rapportBoutiques = [];
        const rapportProduits = [];

        for (const store of stores) {
            const owner = Array.isArray(store.owner) ? store.owner[0] : store.owner;
            const localite = [store.city, store.region].filter(Boolean).join(', ') || 'Non renseigné';

            // Calculer vues et clics totaux pour la boutique
            const [totalVues, totalClics] = await Promise.all([
                getTotalViewsForStore(store.id),
                getTotalClicksForStore(store.id)
            ]);

            rapportBoutiques.push({
                nom: store.name,
                vendeur: owner?.full_name || 'N/A',
                localite: localite,
                categorie: store.activity_category || 'Non catégorisé',
                vuesTotal: totalVues,
                clicsTotal: totalClics
            });

            // Récupérer les produits de la boutique
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, name, category')
                .eq('store_id', store.id)
                .eq('is_active', true);

            if (productsError) {
                console.error(`Erreur produits pour boutique ${store.id}:`, productsError);
                continue;
            }

            // Pour chaque produit, calculer les stats et le Top 5 localités
            for (const product of products || []) {
                const [vues, clics, topLocalities] = await Promise.all([
                    getViewsForProduct(product.id),
                    getClicksForProduct(product.id),
                    getTopLocalitiesByClick(product.id, 'product')
                ]);

                // Formater le Top 5 localités
                const topLocalitiesFormatted = topLocalities
                    .map(loc => `${loc.city}${loc.region ? `, ${loc.region}` : ''} (${loc.count} clics)`)
                    .join(' | ') || 'Aucun clic';

                rapportProduits.push({
                    boutique: store.name,
                    produit: product.name,
                    categorie: product.category || 'Non catégorisé',
                    localiteBoutique: localite,
                    vues: vues,
                    clics: clics,
                    top5Localites: topLocalitiesFormatted
                });
            }
        }

        return {
            date: new Date().toLocaleString('fr-FR'),
            boutiques: rapportBoutiques,
            produits: rapportProduits
        };
    } catch (error) {
        console.error('Erreur genererRapportGlobal:', error);
        throw error;
    }
}

/**
 * Exporter les données en format CSV
 * @param {Object} rapport - Rapport généré par genererRapportGlobal()
 * @param {string} filename - Nom du fichier (sans extension)
 */
export function exporterCSV(rapport, filename = 'rapport-global-SAMASTORE') {
    try {
        let csvContent = '';

        // En-tête du rapport
        csvContent += `=== RAPPORT GLOBAL SAMASTORE ===\n`;
        csvContent += `Date: ${rapport.date}\n`;
        csvContent += `Généré par: Admin\n\n`;

        // Section Boutiques
        csvContent += `=== BOUTIQUES ===\n`;
        csvContent += `Nom Boutique;Vendeur;Localité;Catégorie;Vues Total;Clics Total\n`;
        
        rapport.boutiques.forEach(boutique => {
            csvContent += `"${boutique.nom}";"${boutique.vendeur}";"${boutique.localite}";"${boutique.categorie}";${boutique.vuesTotal};${boutique.clicsTotal}\n`;
        });

        csvContent += `\n`;

        // Section Produits
        csvContent += `=== PRODUITS ===\n`;
        csvContent += `Boutique;Produit;Catégorie;Localité Boutique;Vues;Clics;Top 5 Localités (Clics)\n`;
        
        rapport.produits.forEach(produit => {
            csvContent += `"${produit.boutique}";"${produit.produit}";"${produit.categorie}";"${produit.localiteBoutique}";${produit.vues};${produit.clics};"${produit.top5Localites}"\n`;
        });

        // Créer le blob et télécharger
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM UTF-8 pour Excel
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erreur exportCSV:', error);
        throw error;
    }
}

/**
 * Fonction principale pour générer et exporter le rapport global
 * @param {string} filename - Nom du fichier (optionnel)
 */
export async function exporterRapportGlobal(filename) {
    try {
        // Afficher un indicateur de chargement (peut être géré par l'UI)
        const rapport = await genererRapportGlobal();
        exporterCSV(rapport, filename);
        return { success: true, rapport };
    } catch (error) {
        console.error('Erreur exporterRapportGlobal:', error);
        throw error;
    }
}

