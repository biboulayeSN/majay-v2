/**
 * Gestion des rôles et permissions admin
 */

import { supabase } from "./config.js";

/**
 * Rôles admin disponibles
 */
export const ADMIN_ROLES = {
    SUPER_ADMIN: 'super_admin',
    COMMERCIAL: 'admin_commercial',
    GESTIONNAIRE: 'admin_gestionnaire',
    COMMERCIAL_GESTIONNAIRE: 'admin_commercial_gestionnaire', // Rôle combiné
    ANALYTICS: 'admin_analytics',
    FINANCIAL: 'admin_financial'
};

/**
 * Vérifier si l'utilisateur a une permission
 */
export async function checkPermission(permission) {
    const session = getAdminSession();
    if (!session) return false;

    // Super admin a tous les droits
    if (session.admin_role === ADMIN_ROLES.SUPER_ADMIN) {
        return true;
    }

    // Rôle combiné a toutes les permissions commercial + gestionnaire
    if (session.admin_role === ADMIN_ROLES.COMMERCIAL_GESTIONNAIRE) {
        const commercialPerms = ['view_vendors', 'edit_vendors', 'activate_vendors', 'deactivate_vendors', 'view_stores'];
        const gestionnairePerms = ['edit_stores', 'ban_stores', 'restrict_products', 'view_enterprise_vendors', 'manage_enterprise_vendors'];
        if (commercialPerms.includes(permission) || gestionnairePerms.includes(permission)) {
            return true;
        }
    }

    // Vérifier via RPC
    const { data, error } = await supabase.rpc('check_admin_permission', {
        p_user_id: session.user_id,
        p_permission: permission
    });

    if (error) {
        console.error('Erreur vérification permission:', error);
        return false;
    }

    return data === true;
}

/**
 * Obtenir la session admin avec le rôle
 */
export function getAdminSession() {
    const s = localStorage.getItem("SAMASTORE_admin");
    if (!s) return null;
    
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
}

/**
 * Vérifier si l'utilisateur peut accéder à une page
 */
export async function canAccessPage(requiredPermission) {
    const session = getAdminSession();
    if (!session) return false;

    // Super admin peut tout
    if (session.admin_role === ADMIN_ROLES.SUPER_ADMIN) {
        return true;
    }

    return await checkPermission(requiredPermission);
}

/**
 * Rediriger si pas d'accès
 */
export async function requirePermission(permission, redirectTo = 'dashboard.html') {
    const hasAccess = await canAccessPage(permission);
    if (!hasAccess) {
        const { showError } = await import('./notifications.js');
        showError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        setTimeout(() => {
            window.location.href = redirectTo;
        }, 2000);
        return false;
    }
    return true;
}

/**
 * Créer un nouvel admin (super admin uniquement)
 */
export async function createAdmin(adminData) {
    const session = getAdminSession();
    
    if (!session || (session.admin_role !== ADMIN_ROLES.SUPER_ADMIN && !session.can_create_admins)) {
        throw new Error('Seul un super admin peut créer des administrateurs');
    }

    // Nettoyer le numéro de téléphone
    let phone = adminData.phone.replace(/\s/g, '');
    if (phone.startsWith('7')) {
        phone = '+221' + phone;
    } else if (!phone.startsWith('+')) {
        phone = '+221' + phone;
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(adminData.password);

    const { data, error } = await supabase.rpc('create_admin', {
        p_phone: phone,
        p_email: adminData.email || null,
        p_full_name: adminData.full_name,
        p_admin_role: adminData.admin_role,
        p_password_hash: passwordHash,
        p_created_by: session.user_id
    });

    if (error) {
        console.error('Erreur création admin:', error);
        throw new Error(error.message || 'Erreur lors de la création de l\'administrateur');
    }
    return data;
}

/**
 * Hasher un mot de passe avec SHA-256
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Obtenir tous les admins
 */
export async function getAllAdmins() {
    const { data, error } = await supabase
        .from('admin_users_view')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Activer/désactiver un admin
 */
export async function toggleAdmin(adminId, isActive) {
    const { data, error } = await supabase
        .from('users')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', adminId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Obtenir les permissions d'un rôle
 */
export function getRolePermissions(role) {
    const permissions = {
        [ADMIN_ROLES.SUPER_ADMIN]: {
            label: 'Super Administrateur',
            description: 'Accès complet, peut créer d\'autres admins',
            permissions: ['all']
        },
        [ADMIN_ROLES.COMMERCIAL]: {
            label: 'Admin Commercial',
            description: 'Gestion des vendeurs propriétaires',
            permissions: ['view_vendors', 'edit_vendors', 'activate_vendors', 'deactivate_vendors', 'view_stores']
        },
        [ADMIN_ROLES.GESTIONNAIRE]: {
            label: 'Admin Gestionnaire',
            description: 'Gestion des vendeurs entreprises et boutiques',
            permissions: ['view_stores', 'edit_stores', 'ban_stores', 'restrict_products', 'view_enterprise_vendors', 'manage_enterprise_vendors']
        },
        [ADMIN_ROLES.COMMERCIAL_GESTIONNAIRE]: {
            label: 'Admin Commercial & Gestionnaire',
            description: 'Gestion complète des vendeurs et boutiques (rôle combiné)',
            permissions: ['view_vendors', 'edit_vendors', 'activate_vendors', 'deactivate_vendors', 'view_stores', 'edit_stores', 'ban_stores', 'restrict_products', 'view_enterprise_vendors', 'manage_enterprise_vendors']
        },
        [ADMIN_ROLES.ANALYTICS]: {
            label: 'Admin Analytics',
            description: 'Statistiques et analyses de la base de données',
            permissions: ['view_analytics', 'view_stats', 'export_data', 'view_reports']
        },
        [ADMIN_ROLES.FINANCIAL]: {
            label: 'Admin Financial',
            description: 'Gestion des conformités de paiements',
            permissions: ['view_payments', 'verify_payments', 'view_invoices', 'manage_subscriptions', 'view_financial_reports']
        }
    };

    return permissions[role] || null;
}


