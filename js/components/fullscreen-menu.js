/**
 * Menu fullscreen moderne inspiré de l'image
 */
export class FullscreenMenu {
    constructor() {
        this.menuOpen = false;
        this.currentRoute = '';
        this.menuItems = [];
        this.init();
    }

    init() {
        // Créer le HTML du menu
        const menuHTML = `
            <div id="fullscreenMenu" class="fullscreen-menu" style="display: none;">
                <div class="fullscreen-menu-header">
                    <div class="fullscreen-menu-title">
                        <span class="menu-indicator" style="background: #25D366; width: 12px; height: 12px; display: inline-block;"></span>
                        <span class="menu-label" style="color: white; font-size: 1.25rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">MENU</span>
                    </div>
                    <button class="fullscreen-menu-close" onclick="window.fullscreenMenu?.close()" 
                            style="width: 48px; height: 48px; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 50%; background: transparent; color: white; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <span>✕</span>
                    </button>
                </div>
                <nav class="fullscreen-menu-nav" id="fullscreenMenuNav" style="padding: 3rem; display: flex; flex-direction: column; gap: 0;">
                    <!-- Les items seront injectés dynamiquement -->
                </nav>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', menuHTML);
    }

    setMenuItems(items) {
        this.menuItems = items;
        const nav = document.getElementById('fullscreenMenuNav');
        if (!nav) return;

        nav.innerHTML = items.map((item, index) => {
            const isActive = item.active || false;
            return `
                <div class="fullscreen-menu-item ${isActive ? 'active' : ''}" 
                     onclick="window.fullscreenMenu?.navigate('${item.route}')"
                     style="display: flex; align-items: center; gap: 1.5rem; padding: 2rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; color: ${isActive ? '#25D366' : 'white'}; font-size: 3.5rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; transition: all 0.3s ease; opacity: 0; transform: translateX(-50px); animation: slideInMenuItem 0.5s ease forwards; animation-delay: ${index * 0.1}s;">
                    <span class="menu-item-icon" style="font-size: 2.5rem; width: 60px; text-align: center;">${item.icon}</span>
                    <span class="menu-item-text" style="flex: 1; font-weight: 900; letter-spacing: 0.1em;">${item.label.toUpperCase()}</span>
                    ${isActive ? '<span class="menu-indicator" style="background: #25D366; width: 12px; height: 12px; display: inline-block;"></span>' : ''}
                </div>
            `;
        }).join('');

        // Ajouter les styles d'animation si pas déjà présents
        if (!document.getElementById('fullscreen-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'fullscreen-menu-styles';
            style.textContent = `
                @keyframes slideInMenuItem {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .fullscreen-menu-item:hover {
                    color: #25D366 !important;
                    transform: translateX(20px) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    open() {
        const menu = document.getElementById('fullscreenMenu');
        if (menu) {
            menu.style.display = 'block';
            setTimeout(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'translateX(0)';
                menu.classList.add('open');
            }, 10);
            this.menuOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    close() {
        const menu = document.getElementById('fullscreenMenu');
        if (menu) {
            menu.style.opacity = '0';
            menu.style.transform = 'translateX(-100%)';
            menu.classList.remove('open');
            setTimeout(() => {
                menu.style.display = 'none';
                this.menuOpen = false;
                document.body.style.overflow = '';
            }, 300);
        }
    }

    navigate(route) {
        this.close();
        if (window.vendorRouter) {
            window.vendorRouter.navigate(route);
        } else {
            window.location.href = `/vendeur/${route}`;
        }
    }

    toggle() {
        if (this.menuOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

// Exposer globalement
window.FullscreenMenu = FullscreenMenu;
