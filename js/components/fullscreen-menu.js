/**
 * Menu fullscreen minimal Notion
 */
export class FullscreenMenu {
    constructor() {
        this.menuOpen = false;
        this.currentRoute = '';
        this.menuItems = [];
        this.init();
    }

    init() {
        const menuHTML = `
            <div id="fullscreenMenu" class="fullscreen-menu" style="display: none;">
                <div class="fullscreen-menu-header">
                    <div class="fullscreen-menu-title">
                        <span class="menu-indicator"></span>
                        <span>MENU</span>
                    </div>
                    <button class="fullscreen-menu-close" onclick="window.fullscreenMenu?.close()">
                        <span>&times;</span>
                    </button>
                </div>
                <nav class="fullscreen-menu-nav" id="fullscreenMenuNav">
                </nav>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', menuHTML);
    }

    setMenuItems(items) {
        this.menuItems = items;
        const nav = document.getElementById('fullscreenMenuNav');
        if (!nav) return;

        nav.innerHTML = items.map(item => {
            const isActive = item.active || false;
            return `
                <div class="fullscreen-menu-item ${isActive ? 'active' : ''}"
                     onclick="window.fullscreenMenu?.navigate('${item.route}')">
                    <span class="menu-item-text">${item.label}</span>
                </div>
            `;
        }).join('');
    }

    open() {
        const menu = document.getElementById('fullscreenMenu');
        if (menu) {
            menu.style.display = 'block';
            requestAnimationFrame(() => {
                menu.classList.add('open');
            });
            this.menuOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    close() {
        const menu = document.getElementById('fullscreenMenu');
        if (menu) {
            menu.classList.remove('open');
            setTimeout(() => {
                menu.style.display = 'none';
                this.menuOpen = false;
                document.body.style.overflow = '';
            }, 150);
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
