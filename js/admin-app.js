/**
 * Application principale pour les pages admin
 * Initialise le menu de navigation et le router SPA
 */

import { initAdminNav } from './components/admin-nav.js';
import { adminAuth } from './admin-auth.js';
import './admin-router.js';

// Exposer globalement
window.adminAuth = adminAuth;

export function initAdminApp() {
    const session = adminAuth.getSessionAdmin();
    if (!session) {
        window.location.href = 'connexion.html';
        return;
    }

    // Déterminer la page active
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const pageName = currentPage.replace('.html', '');

    // Initialiser le menu de navigation (sidebar)
    initAdminNav(pageName);

    // Fonction de déconnexion globale
    window.deconnexionAdmin = () => {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            adminAuth.deconnexionAdmin();
        }
    };

    // Mettre à jour le nom de l'admin dans le sidebar
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = session.nom || 'Admin';
    }

    // Initialiser les fonctions toggle pour le sidebar mobile
    initAdminSidebarToggle();
}

/**
 * Initialise les fonctions de toggle pour le sidebar admin (mobile)
 */
function initAdminSidebarToggle() {
    // Fonction pour ouvrir/fermer le sidebar
    window.toggleAdminSidebar = function() {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('adminSidebarOverlay');
        const isOpen = sidebar?.classList.contains('open');
        
        if (isOpen) {
            closeAdminSidebar();
        } else {
            sidebar?.classList.add('open');
            overlay?.classList.add('active');
            const toggleIcon = document.getElementById('adminToggleIcon');
            if (toggleIcon) toggleIcon.textContent = '✕';
            document.body.style.overflow = 'hidden';
        }
    };

    // Fonction pour fermer le sidebar
    window.closeAdminSidebar = function() {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('adminSidebarOverlay');
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
        const toggleIcon = document.getElementById('adminToggleIcon');
        if (toggleIcon) toggleIcon.textContent = '☰';
        document.body.style.overflow = '';
    };

    // Ajouter les event listeners
    const toggleBtn = document.querySelector('.admin-sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.onclick = window.toggleAdminSidebar;
    }

    const overlay = document.getElementById('adminSidebarOverlay');
    if (overlay) {
        overlay.onclick = window.closeAdminSidebar;
    }
}

// Auto-initialiser si on est sur une page admin
if (window.location.pathname.includes('/admin/') && 
    !window.location.pathname.includes('connexion.html') && 
    !window.location.pathname.includes('index.html')) {
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminApp);
    } else {
        initAdminApp();
    }
}
