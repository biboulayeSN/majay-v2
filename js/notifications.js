/**
 * Système de notifications amélioré pour SAMASTORE
 */

export function showNotification(message, type = 'success', duration = 3000) {
    // Supprimer les notifications existantes
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    notification.innerHTML = `
        <span style="font-size: 1.5em;">${icons[type] || icons.success}</span>
        <span style="flex: 1; font-weight: 600;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.2em; cursor: pointer; color: #718096;">&times;</button>
    `;

    document.body.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease';
    }, 10);

    // Suppression automatique
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

export function showSuccess(message) {
    showNotification(message, 'success');
}

export function showError(message) {
    showNotification(message, 'error', 5000);
}

export function showWarning(message) {
    showNotification(message, 'warning');
}

export function showInfo(message) {
    showNotification(message, 'info');
}

// Ajouter les styles et animations CSS si elles n'existent pas
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 500px;
            font-size: 14px;
            animation: slideInRight 0.3s ease;
        }
        
        .notification-success {
            border-left: 4px solid #4daa57;
        }
        
        .notification-error {
            border-left: 4px solid #ff4757;
        }
        
        .notification-warning {
            border-left: 4px solid #ffa502;
        }
        
        .notification-info {
            border-left: 4px solid #3742fa;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}


