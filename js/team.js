import { supabase } from "./config.js";
import { authSAMASTORE } from "./auth.js";

/**
 * Obtenir tous les membres de l'équipe
 */
export async function getTeamMembers() {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('team_members')
            .select(`
                *,
                user:users!team_members_user_id_fkey (
                    id,
                    phone,
                    email,
                    full_name
                )
            `)
            .eq('store_id', session.store_id)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Ajouter un membre à l'équipe
 */
export async function addTeamMember(memberData) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase.rpc('add_team_member', {
            p_store_id: session.store_id,
            p_member_phone: memberData.phone,
            p_member_name: memberData.name,
            p_role: memberData.role || 'agent',
            p_habilitations: memberData.habilitations || {
                orders: true,
                products: true,
                customers: true,
                dashboard: true,
                inventory: false,
                crm: false
            }
        });

        if (error) throw error;

        if (!data.success) {
            throw new Error(data.message);
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour les habilitations d'un membre
 */
export async function updateHabilitations(memberId, habilitations) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('team_members')
            .update({
                habilitations: habilitations,
                updated_at: new Date().toISOString()
            })
            .eq('id', memberId)
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
 * Activer/désactiver un membre
 */
export async function toggleMember(memberId, isActive) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('team_members')
            .update({
                is_active: isActive,
                updated_at: new Date().toISOString()
            })
            .eq('id', memberId)
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
 * Supprimer un membre de l'équipe
 */
export async function removeTeamMember(memberId) {
    try {
        const session = authSAMASTORE.getSession();
        if (!session || !session.store_id) {
            throw new Error('Non authentifié');
        }

        const { data, error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId)
            .eq('store_id', session.store_id)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export const teamUtils = {
    getTeamMembers,
    addTeamMember,
    updateHabilitations,
    toggleMember,
    removeTeamMember
};


