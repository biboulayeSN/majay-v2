import { supabase } from "./config.js";
import { authSAMASTORE } from "./auth.js";

/**
 * Obtenir la boutique actuelle depuis la session
 */
export function getCurrentStore() {
    const session = authSAMASTORE.getSession();
    if (!session || !session.store_id) {
        return null;
    }
    return {
        id: session.store_id,
        name: session.store_name,
        slug: session.store_slug,
        subscription_plan: session.subscription_plan
    };
}

/**
 * Obtenir toutes les boutiques d'un propriétaire
 */
export async function getOwnerStores(ownerId) {
    try {
        const { data, error } = await supabase.rpc('get_owner_stores', {
            p_owner_id: ownerId
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Créer une nouvelle boutique (avec vérification des limites)
 */
export async function createStore(storeData) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase.rpc('create_store_with_limits', {
            p_owner_id: session.user_id,
            p_store_name: storeData.name,
            p_store_slug: storeData.slug,
            p_whatsapp_number: storeData.whatsapp_number,
            p_subscription_plan: storeData.subscription_plan || 'free'
        });

        if (error) throw error;

        if (!data.success) {
            throw new Error(data.message);
        }

        return { success: true, data: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Basculer vers une autre boutique
 */
export async function switchStore(storeId) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session) {
            throw new Error('Non authentifié');
        }

        // Récupérer les données de la boutique
        const { data: store, error } = await supabase
            .from('stores')
            .select('*')
            .eq('id', storeId)
            .eq('owner_id', session.user_id)
            .single();

        if (error) throw error;

        // Mettre à jour la session
        const newSession = {
            ...session,
            store_id: store.id,
            store_name: store.name,
            store_slug: store.slug,
            subscription_plan: store.subscription_plan,
            whatsapp_number: store.whatsapp_number
        };

        authSAMASTORE.sauvegarderSession(newSession);

        return { success: true, data: store };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Vérifier les limites du plan actuel
 */
export async function checkPlanLimits(checkType) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase.rpc('check_plan_limits', {
            p_user_id: session.user_id,
            p_check_type: checkType // 'stores' ou 'team_members'
        });

        if (error) throw error;

        return { success: true, data: data[0] || null };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour les informations d'une boutique
 */
export async function updateStore(storeId, updates) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session) {
            throw new Error('Non authentifié');
        }

        // Vérifier que l'utilisateur est propriétaire
        const { data: store, error: checkError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', storeId)
            .single();

        if (checkError) throw checkError;

        if (store.owner_id !== session.user_id) {
            throw new Error('Vous n\'êtes pas propriétaire de cette boutique');
        }

        const { data, error } = await supabase
            .from('stores')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', storeId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export const storesUtils = {
    getCurrentStore,
    getOwnerStores,
    createStore,
    switchStore,
    checkPlanLimits,
    updateStore
};


