/**
 * Composant Sidebar réutilisable pour toutes les pages admin
 * Design minimal Notion
 */
import { adminAuth } from "../admin-auth.js";
import { ADMIN_ROLES } from "../admin-roles.js";

export function initAdminNav(activePage = '') {
    const session = adminAuth.getSessionAdmin();
    if (!session) return;

    const role = session.admin_role;
    const pageName = activePage.replace('.html', '');

    // Déterminer les liens selon le rôle
    let navLinks = [
        { route: 'dashboard.html', label: 'Dashboard' }
    ];

    if (role === ADMIN_ROLES.SUPER_ADMIN) {
        navLinks.push(
            { route: 'admins.html', label: 'Admins' },
            { route: 'vendeur.html', label: 'Vendeurs' },
            { route: 'stores.html', label: 'Boutiques' },
            { route: 'analytics.html', label: 'Analytics' },
            { route: 'subscriptions.html', label: 'Abonnements' }
        );
    } else if (role === ADMIN_ROLES.COMMERCIAL || role === ADMIN_ROLES.COMMERCIAL_GESTIONNAIRE) {
        navLinks.push(
            { route: 'commercial.html', label: 'Vendeurs' }
        );
    }

    if (role === ADMIN_ROLES.GESTIONNAIRE || role === ADMIN_ROLES.COMMERCIAL_GESTIONNAIRE) {
        navLinks.push(
            { route: 'gestionnaire.html', label: 'Boutiques' }
        );
    }

    if (role === ADMIN_ROLES.COMMERCIAL_GESTIONNAIRE) {
        navLinks.push(
            { route: 'commercial-gestionnaire.html', label: 'Vue d\'ensemble' }
        );
    }

    if (role === ADMIN_ROLES.ANALYTICS) {
        navLinks.push(
            { route: 'analytics.html', label: 'Analytics' }
        );
    }

    if (role === ADMIN_ROLES.FINANCIAL) {
        navLinks.push(
            { route: 'financial.html', label: 'Financial' }
        );
    }

    const initials = (session.nom || 'A').charAt(0).toUpperCase();

    const sidebarHTML = `
        <aside class="dashboard-sidebar admin-sidebar" id="adminSidebar">
            <div class="sidebar-header admin-sidebar-header">
                <div class="sidebar-logo admin-sidebar-logo">ADMIN</div>
                <div class="admin-sidebar-subtitle">SAMASTORE</div>
            </div>

            <nav class="sidebar-nav admin-sidebar-nav" id="adminMainNav">
                ${navLinks.map(link => {
        const linkPageName = link.route.replace('.html', '');
        const isActive = pageName === linkPageName ||
            (pageName === 'dashboard' && link.route === 'dashboard.html');
        return `
                        <a href="#"
                           data-route="${link.route}"
                           class="sidebar-nav-link admin-sidebar-link ${isActive ? 'active' : ''}"
                           title="${link.label}">
                            <span class="admin-nav-label">${link.label}</span>
                        </a>
                    `;
    }).join('')}
            </nav>

            <div class="sidebar-footer admin-sidebar-footer">
                <div class="admin-info">
                    <div class="admin-avatar">${initials}</div>
                    <div class="admin-details">
                        <div class="admin-name" id="adminName">${session.nom || 'Admin'}</div>
                        <div class="admin-role">${getRoleLabel(role)}</div>
                    </div>
                </div>
                <button onclick="window.deconnexionAdmin()" class="btn-admin-logout">
                    Déconnexion
                </button>
            </div>
        </aside>
    `;

    const existingSidebar = document.querySelector('.dashboard-sidebar.admin-sidebar');
    const wrapper = document.querySelector('.dashboard-wrapper.admin-wrapper');

    if (existingSidebar && wrapper) {
        existingSidebar.outerHTML = sidebarHTML;
    } else if (wrapper) {
        wrapper.insertAdjacentHTML('afterbegin', sidebarHTML);
    } else {
        const bodyContent = document.body.innerHTML;
        document.body.innerHTML = `
            <div class="dashboard-wrapper admin-wrapper">
                ${sidebarHTML}
                <main class="dashboard-main admin-main">
                    <div class="admin-main-content">
                        ${bodyContent}
                    </div>
                </main>
            </div>
        `;
    }

    initAdminNavListeners();
}

function getRoleLabel(role) {
    const labels = {
        [ADMIN_ROLES.SUPER_ADMIN]: 'Super Admin',
        [ADMIN_ROLES.COMMERCIAL]: 'Commercial',
        [ADMIN_ROLES.GESTIONNAIRE]: 'Gestionnaire',
        [ADMIN_ROLES.COMMERCIAL_GESTIONNAIRE]: 'Commercial/Gestionnaire',
        [ADMIN_ROLES.ANALYTICS]: 'Analytics',
        [ADMIN_ROLES.FINANCIAL]: 'Financial'
    };
    return labels[role] || 'Admin';
}

function initAdminNavListeners() {
    document.querySelectorAll('#adminMainNav [data-route]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (window.adminRouter) {
                window.adminRouter.navigate(route);
            } else {
                window.location.href = route;
            }
        });
    });
}
