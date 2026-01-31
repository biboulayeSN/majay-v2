import { supabase } from "./config.js";
import { authSAMASTORE } from "./auth.js";

/**
 * Obtenir tous les clients d'une boutique
 */
export async function getCustomers(filters = {}) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        let query = supabase
            .from('customers')
            .select('*')
            .eq('store_id', session.store_id)
            .order('created_at', { ascending: false });

        if (filters.segment) {
            query = query.eq('customer_segment', filters.segment);
        }

        if (filters.city) {
            query = query.eq('city', filters.city);
        }

        if (filters.search) {
            query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir un client par ID
 */
export async function getCustomer(customerId) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('customers')
            .select(`
                *,
                orders:orders!orders_customer_id_fkey (
                    id,
                    order_number,
                    total,
                    status,
                    created_at
                )
            `)
            .eq('id', customerId)
            .eq('store_id', session.store_id)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Créer ou mettre à jour un client
 */
export async function upsertCustomer(customerData) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('customers')
            .upsert({
                ...customerData,
                store_id: session.store_id
            }, {
                onConflict: 'store_id,phone',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour le segment d'un client
 */
export async function updateCustomerSegment(customerId, segment) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('customers')
            .update({
                customer_segment: segment,
                updated_at: new Date().toISOString()
            })
            .eq('id', customerId)
            .eq('store_id', session.store_id)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Ajouter une note privée à un client
 */
export async function addCustomerNote(customerId, note) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('private_notes')
            .eq('id', customerId)
            .eq('store_id', session.store_id)
            .single();

        if (fetchError) throw fetchError;

        const existingNotes = customer.private_notes || '';
        const newNotes = existingNotes 
            ? `${existingNotes}\n[${new Date().toLocaleString('fr-FR')}] ${note}`
            : `[${new Date().toLocaleString('fr-FR')}] ${note}`;

        const { data, error } = await supabase
            .from('customers')
            .update({
                private_notes: newNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', customerId)
            .eq('store_id', session.store_id)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Ajouter des tags à un client
 */
export async function addCustomerTags(customerId, tags) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('tags')
            .eq('id', customerId)
            .eq('store_id', session.store_id)
            .single();

        if (fetchError) throw fetchError;

        const existingTags = customer.tags || [];
        const newTags = Array.isArray(tags) ? tags : [tags];
        const mergedTags = [...new Set([...existingTags, ...newTags])];

        const { data, error } = await supabase
            .from('customers')
            .update({
                tags: mergedTags,
                updated_at: new Date().toISOString()
            })
            .eq('id', customerId)
            .eq('store_id', session.store_id)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export const customersUtils = {
    getCustomers,
    getCustomer,
    upsertCustomer,
    updateCustomerSegment,
    addCustomerNote,
    addCustomerTags
};


