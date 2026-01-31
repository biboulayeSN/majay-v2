/**
 * Utilitaires pour les pages admin
 * Fonctions helper pour affichage cohérent
 */

/**
 * Affiche un état vide de manière cohérente
 * @param {string} message - Message à afficher
 * @param {string} icon - Icône à afficher (emoji)
 * @returns {string} HTML de l'état vide
 */
export function afficherEtatVide(message = "Aucune donnée disponible", icon = "📭") {
    return `
        <div class="empty-state-relief">
            <div class="empty-state-icon">${icon}</div>
            <h3>Aucune donnée</h3>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Vérifie si une liste est vide et retourne l'état vide ou le contenu
 * @param {Array} liste - Liste à vérifier
 * @param {Function} renderFunction - Fonction pour rendre le contenu
 * @param {string} emptyMessage - Message si vide
 * @param {string} emptyIcon - Icône si vide
 * @returns {string} HTML rendu
 */
export function renderListeAvecEtatVide(liste, renderFunction, emptyMessage = "Aucune donnée disponible", emptyIcon = "📭") {
    if (!liste || liste.length === 0) {
        return afficherEtatVide(emptyMessage, emptyIcon);
    }
    return renderFunction(liste);
}
