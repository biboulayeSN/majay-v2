import { supabase } from "./config.js";
import { authSAMASTORE } from "./auth.js";

/**
 * Obtenir les analytics d'un produit
 */
export async function getProductAnalytics(productId, dateRange = {}) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        let query = supabase
            .from('product_analytics')
            .select('*')
            .eq('store_id', session.store_id)
            .eq('product_id', productId)
            .order('date', { ascending: false });

        if (dateRange.start) {
            query = query.gte('date', dateRange.start);
        }
        if (dateRange.end) {
            query = query.lte('date', dateRange.end);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir les statistiques régionales
 */
export async function getRegionalStats(dateRange = {}) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        let query = supabase
            .from('regional_stats')
            .select('*')
            .eq('store_id', session.store_id)
            .order('total_revenue', { ascending: false });

        if (dateRange.start) {
            query = query.gte('date', dateRange.start);
        }
        if (dateRange.end) {
            query = query.lte('date', dateRange.end);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir les données de tendances
 */
export async function getTrendData(category = null) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        // Récupérer les produits de la boutique
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .eq('store_id', session.store_id)
            .eq('is_active', true);

        if (productsError) throw productsError;

        const productIds = products.map(p => p.id);

        if (productIds.length === 0) {
            return { success: true, data: [] };
        }

        let query = supabase
            .from('trend_data')
            .select('*')
            .in('product_id', productIds)
            .eq('snapshot_date', new Date().toISOString().split('T')[0])
            .order('rank_globally', { ascending: true })
            .limit(100);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir les statistiques globales de la boutique
 */
export async function getStoreStats(dateRange = {}) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        // Commandes
        let ordersQuery = supabase
            .from('orders')
            .select('total, status, created_at')
            .eq('store_id', session.store_id);

        if (dateRange.start) {
            ordersQuery = ordersQuery.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
            ordersQuery = ordersQuery.lte('created_at', dateRange.end);
        }

        const { data: orders, error: ordersError } = await ordersQuery;

        if (ordersError) throw ordersError;

        // Produits
        const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', session.store_id)
            .eq('is_active', true);

        // Clics
        let clicksQuery = supabase
            .from('click_events')
            .select('event_type', { count: 'exact', head: false })
            .eq('store_id', session.store_id);

        if (dateRange.start) {
            clicksQuery = clicksQuery.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
            clicksQuery = clicksQuery.lte('created_at', dateRange.end);
        }

        const { data: clicks, error: clicksError } = await clicksQuery;

        const stats = {
            total_orders: orders?.length || 0,
            total_revenue: orders?.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (parseInt(o.total) || 0), 0) || 0,
            total_products: productsCount || 0,
            total_views: clicks?.filter(c => c.event_type === 'view').length || 0,
            total_cart_adds: clicks?.filter(c => c.event_type === 'cart_add').length || 0,
            total_purchases: clicks?.filter(c => c.event_type === 'purchase').length || 0
        };

        return { success: true, data: stats };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir les détails de tous les produits avec statistiques
 */
export async function getProductsDetails(dateRange = {}) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        // Récupérer les produits
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, category, stock, price, currency, views_count')
            .eq('store_id', session.store_id)
            .eq('is_active', true);

        if (productsError) throw productsError;

        // Récupérer les vues depuis click_events
        let viewsQuery = supabase
            .from('click_events')
            .select('product_id')
            .eq('store_id', session.store_id)
            .eq('event_type', 'view');

        if (dateRange.start) {
            viewsQuery = viewsQuery.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
            viewsQuery = viewsQuery.lte('created_at', dateRange.end);
        }

        const { data: views } = await viewsQuery;

        // Récupérer les commandes
        let ordersQuery = supabase
            .from('orders')
            .select('items')
            .eq('store_id', session.store_id);

        if (dateRange.start) {
            ordersQuery = ordersQuery.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
            ordersQuery = ordersQuery.lte('created_at', dateRange.end);
        }

        const { data: orders } = await ordersQuery;

        // Calculer les statistiques par produit
        const productsWithStats = products.map(product => {
            const consultations = views?.filter(v => v.product_id === product.id).length || product.views_count || 0;
            
            let quantitesCommandees = 0;
            if (orders) {
                orders.forEach(order => {
                    if (Array.isArray(order.items)) {
                        const item = order.items.find(i => i.product_id === product.id);
                        if (item) {
                            quantitesCommandees += parseInt(item.quantity || 0);
                        }
                    }
                });
            }

            return {
                ...product,
                consultations,
                quantites_commandees: quantitesCommandees,
                quantites_restantes: product.stock || 0
            };
        });

        return { success: true, data: productsWithStats };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export const analyticsUtils = {
    getProductAnalytics,
    getRegionalStats,
    getTrendData,
    getStoreStats,
    getProductsDetails
};


