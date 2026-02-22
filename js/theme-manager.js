/**
 * Gestionnaire de thème (Mode sombre/clair)
 * Style Notion dark
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
    }

    createToggleButton(container) {
        if (document.getElementById('themeToggle')) return;

        const toggleHTML = `
            <button id="themeToggle" class="theme-toggle" onclick="window.themeManager?.toggle()"
                    title="Basculer le thème">
                <span id="themeIcon">${this.currentTheme === 'dark' ? '\u2600' : '\u263E'}</span>
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

        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '\u2600' : '\u263E';
        }

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
