/**
 * Application principale pour les pages vendeur
 * Initialise le sidebar et le router SPA
 */

import { initSidebar, initSidebarNavigation } from './components/sidebar.js';
import { authSAMASTORE } from './auth.js';
import { ThemeManager } from './theme-manager.js';
import './vendor-router.js';

// Exposer authSAMASTORE globalement pour le sidebar
window.authSAMASTORE = authSAMASTORE;

// Initialiser le gestionnaire de thème
window.themeManager = new ThemeManager();

/**
 * Initialise l'application vendeur
 */
export function initVendorApp() {
    const session = authSAMASTORE.getSession();
    if (!session) {
        window.location.href = 'connexion.html';
        return;
    }

    // Déterminer la page active
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const pageName = currentPage.replace('.html', '');

    // Initialiser le sidebar
    initSidebar(pageName);

    // Initialiser la navigation du sidebar
    initSidebarNavigation();

    // Sidebar toggle functions
    function toggleSidebar() {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const isOpen = sidebar?.classList.contains('open');
        
        if (isOpen) {
            closeSidebar();
        } else {
            sidebar?.classList.add('open');
            overlay?.classList.add('active');
            const toggleIcon = document.getElementById('toggleIcon');
            if (toggleIcon) toggleIcon.textContent = '✕';
        }
    }

    function closeSidebar() {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
        const toggleIcon = document.getElementById('toggleIcon');
        if (toggleIcon) toggleIcon.textContent = '☰';
    }

    // Exposer globalement
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;

    // Initialiser les boutons sidebar toggle si présents
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.onclick = toggleSidebar;
    }

    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.onclick = closeSidebar;
    }

    // Ajouter le toggle de thème dans le sidebar footer
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter && window.themeManager) {
        window.themeManager.createToggleButton(sidebarFooter);
    }
}

// Auto-initialiser si on est sur une page vendeur
if (window.location.pathname.includes('/vendeur/') && !window.location.pathname.includes('connexion.html') && !window.location.pathname.includes('inscription.html')) {
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVendorApp);
    } else {
        initVendorApp();
    }
}

