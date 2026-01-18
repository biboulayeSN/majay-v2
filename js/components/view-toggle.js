/**
 * Composant pour basculer entre vue grille et vue liste
 */
export class ViewToggle {
    constructor(containerId, gridClass = 'grid', listClass = 'list') {
        this.container = document.getElementById(containerId);
        this.currentView = localStorage.getItem('view-mode') || 'grid';
        this.gridClass = gridClass;
        this.listClass = listClass;
        this.init();
    }

    init() {
        // Créer le toggle UI
        const toggleHTML = `
            <div class="view-toggle-container" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <button id="gridViewBtn" class="view-toggle-btn ${this.currentView === 'grid' ? 'active' : ''}" 
                        onclick="window.viewToggle?.setView('grid')" 
                        title="Vue grille">
                    <span style="font-size: 1.2em;">⊞</span>
                </button>
                <button id="listViewBtn" class="view-toggle-btn ${this.currentView === 'list' ? 'active' : ''}" 
                        onclick="window.viewToggle?.setView('list')" 
                        title="Vue liste">
                    <span style="font-size: 1.2em;">☰</span>
                </button>
            </div>
        `;

        if (this.container) {
            this.container.insertAdjacentHTML('beforebegin', toggleHTML);
        }

        // Appliquer la vue actuelle
        this.setView(this.currentView);
    }

    setView(view) {
        this.currentView = view;
        localStorage.setItem('view-mode', view);

        // Mettre à jour les boutons
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        
        if (gridBtn) gridBtn.classList.toggle('active', view === 'grid');
        if (listBtn) listBtn.classList.toggle('active', view === 'list');

        // Appliquer les classes au container
        if (this.container) {
            this.container.classList.remove('grid-view', 'list-view', 'space-y-3');
            this.container.classList.add(`${view}-view`);

            if (view === 'grid') {
                // Vue grille
                this.container.style.display = 'grid';
                this.container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
                this.container.style.gap = '1.5rem';
            } else {
                // Vue liste
                this.container.style.display = 'flex';
                this.container.style.flexDirection = 'column';
                this.container.style.gap = '1rem';
            }
        }

        // Déclencher un événement pour que les pages puissent adapter leur affichage
        window.dispatchEvent(new CustomEvent('view-changed', { detail: { view } }));
    }
}

// Exposer globalement
window.ViewToggle = ViewToggle;
