/**
 * Routeur SPA pour les pages vendeur
 * Charge uniquement le contenu nécessaire, pas toute la page
 */

class VendorRouter {
    constructor() {
        this.currentRoute = '';
        this.mainContentSelector = '.dashboard-main-content';
        this.cache = new Map(); // Cache pour les pages déjà chargées
        this.init();
    }

    init() {
        // Initialiser avec la route actuelle
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
                // Si pas d'état, recharger la page actuelle
                this.loadRoute(this.getCurrentRoute(), false);
            }
        });
    }

    getCurrentRoute() {
        const path = window.location.pathname;
        const match = path.match(/\/vendeur\/(.+\.html)/);
        return match ? match[1] : 'dashboard.html';
    }

    /**
     * Navigue vers une nouvelle route
     */
    async navigate(route) {
        if (this.currentRoute === route) return;

        // Mettre à jour l'URL sans recharger
        const newUrl = `/vendeur/${route}`;
        window.history.pushState({ route }, '', newUrl);

        // Charger le contenu
        await this.loadRoute(route, true);

        // Mettre à jour la route active dans le sidebar
        this.updateActiveSidebarLink(route);
    }

    /**
     * Charge le contenu d'une route
     */
    async loadRoute(route, updateHistory = true) {
        try {
            // Vérifier le cache d'abord
            if (this.cache.has(route)) {
                const cached = this.cache.get(route);
                this.renderContent(cached.content);
                this.executeScripts(cached.scripts);
                this.currentRoute = route;
                this.updateActiveSidebarLink(route);
                return;
            }

            // Afficher un loader
            const mainContent = document.querySelector(this.mainContentSelector);
            if (!mainContent) {
                console.error('Main content container not found');
                return;
            }

            // Créer un loader élégant
            mainContent.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
                    <div class="loader"></div>
                </div>
            `;

            // Charger le HTML de la page
            const response = await fetch(`/vendeur/${route}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${route}: ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extraire uniquement le contenu principal (pas le sidebar ni le wrapper)
            const pageContent = doc.querySelector(this.mainContentSelector);
            
            if (!pageContent) {
                throw new Error('Main content not found in loaded page');
            }

            // Extraire les scripts
            const scripts = Array.from(doc.querySelectorAll('script[type="module"]'));
            const scriptsContent = scripts.map(s => s.textContent || s.innerHTML);

            // Mettre en cache
            this.cache.set(route, {
                content: pageContent.innerHTML,
                scripts: scriptsContent
            });

            // Rendre le contenu
            this.renderContent(pageContent.innerHTML);
            
            // Exécuter les scripts
            this.executeScripts(scriptsContent);

            this.currentRoute = route;

            // Déclencher un événement pour que les modules puissent s'initialiser
            window.dispatchEvent(new CustomEvent('route-changed', { detail: { route } }));
            
            // Scroll vers le haut
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('Error loading route:', error);
            const mainContent = document.querySelector(this.mainContentSelector);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="text-center p-8">
                        <p class="text-danger mb-4">❌ Erreur lors du chargement de la page</p>
                        <p class="text-text-light mb-4">${error.message}</p>
                        <button onclick="window.location.reload()" class="btn btn-primary">🔄 Recharger la page</button>
                        <button onclick="window.vendorRouter?.navigate('dashboard.html')" class="btn btn-outline ml-2">🏠 Retour au Dashboard</button>
                    </div>
                `;
            }
        }
    }

    /**
     * Rendre le contenu dans le conteneur principal
     */
    renderContent(html) {
        const mainContent = document.querySelector(this.mainContentSelector);
        if (mainContent) {
            mainContent.innerHTML = html;
        }
    }

    /**
     * Exécute les scripts d'une page
     */
    executeScripts(scriptsContent) {
        scriptsContent.forEach((scriptContent, index) => {
            if (scriptContent.trim()) {
                try {
                    // Créer un nouveau script et l'exécuter
                    const newScript = document.createElement('script');
                    newScript.type = 'module';
                    newScript.id = `route-script-${Date.now()}-${index}`;
                    newScript.textContent = scriptContent;
                    
                    // Supprimer les anciens scripts de route pour éviter les doublons
                    const oldScripts = document.querySelectorAll(`[id^="route-script-"]`);
                    oldScripts.forEach(s => s.remove());
                    
                    document.body.appendChild(newScript);
                } catch (error) {
                    console.error('Error executing route script:', error);
                }
            }
        });
    }

    /**
     * Met à jour le lien actif dans le sidebar
     */
    updateActiveSidebarLink(route) {
        document.querySelectorAll('.sidebar-nav-link, .sidebar-submenu-link').forEach(link => {
            link.classList.remove('active');
            const linkRoute = link.getAttribute('data-route');
            if (linkRoute === route) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Vide le cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Initialiser le router globalement
if (!window.vendorRouter) {
    window.vendorRouter = new VendorRouter();
}

export default window.vendorRouter;
