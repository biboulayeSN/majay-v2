/**
 * Gestionnaire de thème (Mode sombre/clair)
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Appliquer le thème au chargement
        this.applyTheme(this.currentTheme);
    }

    createToggleButton(container) {
        if (document.getElementById('themeToggle')) return;

        const toggleHTML = `
            <button id="themeToggle" class="theme-toggle" onclick="window.themeManager?.toggle()" 
                    title="Basculer le thème" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--color-gray-200); background: white; color: var(--color-text); font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-center; transition: all 0.2s;">
                <span id="themeIcon">${this.currentTheme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
        `;

        if (container) {
            container.insertAdjacentHTML('afterbegin', toggleHTML);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);

        // Mettre à jour l'icône
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        // Déclencher un événement
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
    }

    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    getTheme() {
        return this.currentTheme;
    }
}

// Exposer globalement
window.ThemeManager = ThemeManager;
