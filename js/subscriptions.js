import { supabase } from "./config.js";
import { authSAMASTORE } from "./auth.js";

/**
 * Obtenir le plan actuel de la boutique
 */
export async function getCurrentPlan() {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data: store, error } = await supabase
            .from('stores')
            .select(`
                subscription_plan,
                subscription_starts_at,
                subscription_expires_at,
                plans!stores_subscription_plan_fkey (
                    name,
                    annual_price,
                    max_products,
                    max_stores,
                    max_photos_per_product,
                    max_team_members,
                    features
                )
            `)
            .eq('id', session.store_id)
            .single();

        if (error) throw error;

        const plan = Array.isArray(store.plans) ? store.plans[0] : store.plans;

        return {
            success: true,
            data: {
                plan_name: store.subscription_plan,
                starts_at: store.subscription_starts_at,
                expires_at: store.subscription_expires_at,
                plan_details: plan
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir l'historique des abonnements
 */
export async function getSubscriptionHistory() {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('subscriptions')
            .select(`
                *,
                plans!subscriptions_plan_name_fkey (
                    name,
                    annual_price,
                    features
                )
            `)
            .eq('store_id', session.store_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir toutes les factures
 */
export async function getInvoices() {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                subscriptions (
                    plan_name
                )
            `)
            .eq('store_id', session.store_id)
            .order('issued_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir les paiements d'une facture
 */
export async function getPayments(invoiceId) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .eq('store_id', session.store_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir tous les plans disponibles
 */
export async function getAllPlans() {
    try {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('annual_price', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export const subscriptionsUtils = {
    getCurrentPlan,
    getSubscriptionHistory,
    getInvoices,
    getPayments,
    getAllPlans
};


