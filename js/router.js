/**
 * Système de routage pour SAMASTORE
 * Gère les URLs propres pour les boutiques et l'admin
 */

/**
 * Détecte si on est sur le sous-domaine admin
 */
export function isAdminDomain() {
    const hostname = window.location.hostname;
    return hostname.startsWith('admin.') || hostname === 'localhost' && window.location.pathname.startsWith('/admin');
}

/**
 * Détecte si on est sur une page boutique
 */
export function isStorePage() {
    const path = window.location.pathname;
    
    // Exclure les pages système et dossiers spéciaux
    const systemPages = [
        '/index.html', '/catalogue.html', '/test-connection.html', 
        '/test-complet.html', '/store-router.html', '/panier-demo.html',
        '/cgu.html', '/demo-shop.html'
    ];
    const systemDirs = ['/admin', '/vendeur', '/css', '/js', '/assets', '/cloudflare'];
    
    const isSystemPage = systemPages.some(page => path === page || path.includes(page));
    const isSystemDir = systemDirs.some(dir => path.startsWith(dir));
    
    // Si c'est une page système ou un dossier système, ce n'est pas une boutique
    if (isSystemPage || isSystemDir) return false;
    
    // Si c'est juste "/" ou "/index.html", ce n'est pas une boutique
    if (path === '/' || path === '/index.html') return false;
    
    // Si le path contient une extension autre que .html, ce n'est probablement pas une boutique
    const hasExtension = /\.[a-z]+$/i.test(path);
    if (hasExtension && !path.endsWith('.html') && !path.endsWith('/')) return false;
    
    // Sinon, c'est probablement une boutique
    return true;
}

/**
 * Extrait le slug de la boutique depuis l'URL
 * Format: www.site.com/lien_boutique ou www.site.com/lien_boutique.html
 */
export function getStoreSlugFromPath() {
    const path = window.location.pathname;
    
    // Enlever le "/" initial et les extensions
    let slug = path.replace(/^\//, '').replace(/\.html$/, '');
    
    // Nettoyer les paramètres de requête si présents
    if (slug.includes('?')) {
        slug = slug.split('?')[0];
    }
    
    // Si c'est vide ou "index", pas de boutique
    if (!slug || slug === 'index') return null;
    
    // Vérifier que le slug contient uniquement des caractères valides (lettres, chiffres, tirets)
    if (!/^[a-z0-9-]+$/i.test(slug)) {
        console.warn(`Slug invalide détecté: ${slug}`);
        return null;
    }
    
    return slug;
}

/**
 * Génère l'URL complète d'une boutique
 */
export function getStoreUrl(slug) {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/${slug}`;
}

/**
 * Redirige vers une boutique
 */
export function navigateToStore(slug) {
    window.location.href = getStoreUrl(slug);
}

/**
 * Redirige vers l'admin
 */
export function navigateToAdmin(path = '') {
    const hostname = window.location.hostname;
    let adminUrl;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // En développement, utiliser /admin
        adminUrl = `/admin${path}`;
    } else {
        // En production, utiliser le sous-domaine
        const domain = hostname.replace(/^www\./, '');
        adminUrl = `https://admin.${domain}${path}`;
    }
    
    window.location.href = adminUrl;
}

/**
 * Redirige vers la page d'accueil
 */
export function navigateToHome() {
    window.location.href = '/';
}

/**
 * Redirige vers la page de connexion vendeur
 */
export function navigateToVendorLogin() {
    window.location.href = '/vendeur/connexion.html';
}

/**
 * Redirige vers la page d'inscription vendeur
 */
export function navigateToVendorSignup() {
    window.location.href = '/vendeur/inscription.html';
}

/**
 * Initialise le routage au chargement de la page
 */
export function initRouter() {
    // Si on est sur une page boutique, charger la boutique
    if (isStorePage() && !isAdminDomain()) {
        const slug = getStoreSlugFromPath();
        if (slug) {
            // Charger le catalogue avec le slug
            loadStoreCatalog(slug);
            return;
        }
    }
    
    // Si on est sur admin, rediriger vers la page admin appropriée
    if (isAdminDomain()) {
        const path = window.location.pathname;
        if (path === '/' || path === '/admin' || path === '/admin/') {
            window.location.href = '/admin/dashboard.html';
        }
    }
}

/**
 * Charge le catalogue d'une boutique
 * Si on est déjà sur catalogue.html, utilise le slug directement
 * Sinon, redirige vers catalogue.html avec le slug
 */
async function loadStoreCatalog(slug) {
    const currentPath = window.location.pathname;
    
    // Si on est déjà sur catalogue.html, on peut charger directement avec le slug dans l'URL
    if (currentPath.includes('/catalogue.html')) {
        // Mettre à jour l'URL sans recharger la page si possible
        const newUrl = `/catalogue.html?shop=${slug}`;
        if (window.location.search !== `?shop=${slug}`) {
            window.history.replaceState({}, '', newUrl);
        }
        // Le script app.js chargera automatiquement avec getStoreSlug()
        return;
    }
    
    // Sinon, rediriger vers catalogue.html avec le slug
    window.location.href = `/catalogue.html?shop=${slug}`;
}


