/**
 * Routeur SPA pour les pages admin
 * Charge uniquement le contenu nécessaire, pas toute la page
 */

class AdminRouter {
    constructor() {
        this.currentRoute = '';
        this.mainContentSelector = '.admin-main-content';
        this.routes = new Map();
        // Ne pas charger automatiquement si on est déjà sur une page avec contenu
        if (document.querySelector(this.mainContentSelector)?.innerHTML.trim()) {
            // Attendre un peu pour que initAdminApp charge le sidebar
            setTimeout(() => this.init(), 100);
        } else {
            this.init();
        }
    }

    init() {
        this.currentRoute = this.getCurrentRoute();
        
        // Intercepter les clics sur les liens avec data-route
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigate(route);
            }
        });

        // Gérer le bouton retour du navigateur
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.route) {
                this.loadRoute(e.state.route, false);
            } else {
                this.loadRoute(this.getCurrentRoute(), false);
            }
        });
    }

    getCurrentRoute() {
        const path = window.location.pathname;
        const match = path.match(/\/admin\/(.+\.html)/);
        return match ? match[1] : 'dashboard.html';
    }

    async navigate(route) {
        if (this.currentRoute === route) return;

        const newUrl = `/admin/${route}`;
        window.history.pushState({ route }, '', newUrl);
        await this.loadRoute(route, true);
        this.updateActiveNavLink(route);
    }

    async loadRoute(route, updateHistory = true) {
        try {
            const mainContent = document.querySelector(this.mainContentSelector);
            if (!mainContent) {
                console.error('Main content container not found. Selector:', this.mainContentSelector);
                // Si le container n'existe pas, recharger la page complète
                window.location.href = `/admin/${route}`;
                return;
            }

            // Afficher un loader
            mainContent.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loader"></div><p style="margin-top: 15px; color: #718096;">Chargement...</p></div>';

            // Charger le HTML de la page
            const response = await fetch(`/admin/${route}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${route}: ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extraire uniquement le contenu principal
            let pageContent = doc.querySelector(this.mainContentSelector);
            
            // Si le contenu n'est pas trouvé avec le sélecteur, essayer de trouver le contenu principal
            if (!pageContent) {
                // Chercher dans .dashboard-container
                const container = doc.querySelector('.dashboard-container');
                if (container) {
                    // Extraire tout le contenu sauf le header
                    const header = container.querySelector('.admin-header') || container.previousElementSibling;
                    if (header && header.classList.contains('admin-header')) {
                        pageContent = container.cloneNode(true);
                        pageContent.querySelector('.admin-header')?.remove();
                    } else {
                        pageContent = container;
                    }
                } else {
                    // Si pas de container, utiliser le body mais exclure le header
                    pageContent = doc.body.cloneNode(true);
                    pageContent.querySelector('.admin-header')?.remove();
                    pageContent.querySelector('header')?.remove();
                }
            } else {
                // Cloner pour éviter les problèmes de référence
                pageContent = pageContent.cloneNode(true);
            }

            if (pageContent) {
                mainContent.innerHTML = pageContent.innerHTML;
                
                // Exécuter les scripts de la page chargée
                const scripts = doc.querySelectorAll('script[type="module"]');
                for (const script of scripts) {
                    const scriptContent = script.textContent || script.innerHTML;
                    if (scriptContent.trim() && !scriptContent.includes('initAdminApp')) {
                        try {
                            const newScript = document.createElement('script');
                            newScript.type = 'module';
                            newScript.textContent = scriptContent;
                            document.body.appendChild(newScript);
                            // Attendre un peu avant de supprimer pour que les imports se chargent
                            setTimeout(() => {
                                if (newScript.parentNode) {
                                    // Ne pas supprimer immédiatement car les modules peuvent être asynchrones
                                }
                            }, 100);
                        } catch (scriptError) {
                            console.error('Error executing script:', scriptError);
                        }
                    }
                }

                // Déclencher un événement pour que les modules puissent s'initialiser
                window.dispatchEvent(new CustomEvent('admin-route-changed', { detail: { route } }));
            } else {
                throw new Error('Main content not found in loaded page');
            }

            this.currentRoute = route;
        } catch (error) {
            console.error('Error loading route:', error);
            const mainContent = document.querySelector(this.mainContentSelector);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="color: #ff4757; font-size: 3em;">❌</div>
                        <p style="color: #ff4757; margin-top: 10px; font-weight: 600;">Erreur lors du chargement de la page</p>
                        <p style="color: #718096; margin-top: 5px;">${error.message}</p>
                        <button onclick="window.location.reload()" class="btn btn-primary mt-4">🔄 Recharger</button>
                        <button onclick="window.adminRouter?.navigate('dashboard.html')" class="btn btn-outline mt-4">🏠 Retour au dashboard</button>
                    </div>
                `;
            }
        }
    }

    updateActiveNavLink(route) {
        document.querySelectorAll('#adminMainNav .nav-link').forEach(link => {
            link.classList.remove('active');
            const linkRoute = link.getAttribute('data-route');
            if (linkRoute === route) {
                link.classList.add('active');
            }
        });
    }
}

// Initialiser le router globalement
window.adminRouter = new AdminRouter();

export default window.adminRouter;
