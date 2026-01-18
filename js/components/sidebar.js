/**
 * Composant Sidebar réutilisable pour toutes les pages vendeur
 */
export function initSidebar(activePage = '') {
    const session = window.authMaJay?.getSession();
    if (!session) return;

    // Déterminer la page active depuis le nom de la page
    const pageName = activePage.replace('.html', '');

    // Structure du sidebar standard
    const sidebarHTML = `
        <aside class="dashboard-sidebar" id="dashboardSidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">🛍️ MA-JAY</div>
            </div>
            
            <nav class="sidebar-nav" id="mainNav">
                <a href="#" data-route="dashboard.html" class="sidebar-nav-link ${pageName === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
                <a href="#" data-route="produits.html" class="sidebar-nav-link ${pageName === 'produits' ? 'active' : ''}">📦 Produits</a>
                <a href="#" data-route="commandes.html" class="sidebar-nav-link ${pageName === 'commandes' ? 'active' : ''}">🛒 Commandes</a>
                <a href="#" data-route="clients.html" class="sidebar-nav-link ${pageName === 'clients' ? 'active' : ''}">👥 Clients</a>
                <a href="#" data-route="analytics.html" class="sidebar-nav-link ${pageName === 'analytics' ? 'active' : ''}">📈 Analytics</a>
                <a href="#" data-route="abonnements.html" class="sidebar-nav-link ${pageName === 'abonnements' ? 'active' : ''}">💳 Abonnements</a>
                <a href="#" data-route="profil.html" class="sidebar-nav-link ${pageName === 'profil' ? 'active' : ''}">⚙️ Profil</a>
            </nav>

            <div class="sidebar-footer">
                <a href="#" data-route="abonnements.html" class="sidebar-plan-badge badge-info" id="userPlan" title="Gérer mon abonnement">${(session.subscription_plan || 'free').toUpperCase()}</a>
            </div>
        </aside>
    `;

    // Remplace le sidebar existant ou l'insère
    const existingSidebar = document.querySelector('.dashboard-sidebar');
    const wrapper = document.querySelector('.dashboard-wrapper');
    
    if (existingSidebar && wrapper) {
        existingSidebar.outerHTML = sidebarHTML;
    } else if (wrapper) {
        wrapper.insertAdjacentHTML('afterbegin', sidebarHTML);
    }

    // Ajouter les liens conditionnels selon le plan
    if (session.subscription_plan === 'entreprise') {
        const nav = document.getElementById('mainNav');
        if (nav) {
            const mesBoutiquesHTML = `
                <div class="sidebar-menu-item">
                    <div class="sidebar-nav-link has-submenu" onclick="toggleSubmenu(this)">🏪 Mes Boutiques</div>
                    <div class="sidebar-submenu">
                        <a href="#" data-route="agents.html" class="sidebar-submenu-link">👤 Agents</a>
                        <a href="#" data-route="creation-boutique.html" class="sidebar-submenu-link">➕ Créer une boutique</a>
                        <a href="#" data-route="depot.html" class="sidebar-submenu-link">📦 Dépôt</a>
                        <a href="#" data-route="transferts.html" class="sidebar-submenu-link">🚚 Transferts</a>
                        <a href="#" data-route="comptabilite.html" class="sidebar-submenu-link">💰 Comptabilité</a>
                        <a href="#" data-route="rapports.html" class="sidebar-submenu-link">📊 Rapports</a>
                    </div>
                </div>
            `;
            nav.insertAdjacentHTML('beforeend', mesBoutiquesHTML);
        }
    }

    // Mettre à jour le badge du plan
    const userPlan = document.getElementById('userPlan');
    if (userPlan) {
        userPlan.textContent = (session.subscription_plan || 'free').toUpperCase();
        userPlan.className = `sidebar-plan-badge badge-${session.subscription_plan || 'free'}`;
    }
}

/**
 * Initialise la navigation SPA pour les liens du sidebar
 */
export function initSidebarNavigation() {
    document.querySelectorAll('[data-route]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (window.vendorRouter) {
                window.vendorRouter.navigate(route);
            } else {
                // Fallback : navigation classique
                window.location.href = `/vendeur/${route}`;
            }
        });
    });
}

// Fonction toggle submenu (global)
window.toggleSubmenu = function(element) {
    const submenu = element.nextElementSibling;
    if (submenu) {
        submenu.classList.toggle('open');
        element.classList.toggle('open');
    }
};
