
import { supabase, getStoreSlug } from "./config.js";
import { authSAMASTORE } from "./auth.js";

let products = [];
let filteredProducts = [];
let inventoryMap = new Map(); // Stores SKU/ID -> Counted Quantity

document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const session = authSAMASTORE.getSession();
    if (!session) {
        window.location.href = 'connexion.html';
        return;
    }

    await loadProducts();

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});

async function loadProducts() {
    const slug = getStoreSlug();
    if (!slug) return;

    // Get Store ID first
    const { data: store } = await supabase.from('stores').select('id').eq('slug', slug).single();
    if (!store) return;

    // Fetch Products
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error loading products:', error);
        return;
    }

    products = data;

    // Initialize inventory map with current stock
    products.forEach(p => {
        // Default counted quantity is the current system quantity
        inventoryMap.set(p.id, {
            original: p.stock_quantity || 0,
            counted: p.stock_quantity || 0
        });
    });

    filteredProducts = [...products];
    renderProducts();
    updateProgress();
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term))
    );
    renderProducts();
}

function renderProducts() {
    const container = document.getElementById('inventoryList');
    container.innerHTML = '';

    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-gray-500">Aucun produit trouvé</div>';
        return;
    }

    filteredProducts.forEach(product => {
        const stockData = inventoryMap.get(product.id);
        const isMatch = stockData.counted === stockData.original;
        const diff = stockData.counted - stockData.original;

        const card = document.createElement('div');
        card.className = 'product-card-ios';

        let statusBadge = '';
        if (isMatch) {
            statusBadge = `<div class="status-badge status-match">✓ Stock OK</div>`;
        } else {
            const diffText = diff > 0 ? `+${diff}` : diff;
            statusBadge = `<div class="status-badge status-discrepancy">⚠️ Écart: ${diffText}</div>`;
        }

        card.innerHTML = `
            <img src="${product.images && product.images[0] ? product.images[0] : '../assets/placeholder.png'}" class="product-thumb" alt="${product.name}">
            <div class="product-details">
                <div class="product-name">${product.name}</div>
                <div class="product-sku">SKU: ${product.sku || 'N/A'}</div>
                ${statusBadge}
            </div>
            <div class="stepper-container">
                <button class="stepper-btn" onclick="updateStock('${product.id}', -1)">-</button>
                <input type="number" class="stepper-input" value="${stockData.counted}" readonly>
                <button class="stepper-btn" onclick="updateStock('${product.id}', 1)">+</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Make updateStock global so inline onclick handlers can find it
window.updateStock = (productId, change) => {
    const data = inventoryMap.get(productId);
    if (!data) return;

    data.counted += change;
    if (data.counted < 0) data.counted = 0;

    inventoryMap.set(productId, data);

    // Re-render only this card? For simplicty re-render all or optimize later. 
    // To preserve focus / scroll, we ideally should just update DOM elements. 
    // For MVP/Proto, re-rendering filtered list is fast enough for <100 items.
    renderProducts();
    updateProgress();
};

function updateProgress() {
    // Progress could be defined as "percentage of items reviewed"
    // For now, let's say interaction count or just 100% since we loaded all.
    // Or maybe "Items with Discrepancy" vs "Matched". 

    // Let's make the progress bar fill as we "touch" items.
    // Since we auto-filled with default, technically 100% is 'done'.
    // Let's calculate purely matching items % ?

    let matches = 0;
    products.forEach(p => {
        const d = inventoryMap.get(p.id);
        if (d.counted === d.original) matches++;
    });

    const pct = Math.round((matches / products.length) * 100);
    document.getElementById('progressBar').style.width = `${pct}%`;
}

window.simulateScan = () => {
    alert("Scanner de code-barres simulé. Cette fonctionnalité nécessiterait l'accès caméra.");
};

window.completeInventory = async () => {
    const btn = document.querySelector('.btn-complete');
    const originalText = btn.textContent;
    btn.textContent = 'Enregistrement...';
    btn.disabled = true;

    try {
        // In a real app, we would loop through products where counted != original and create inventory adjustment records
        // For this demo, we'll just update the stock_quantity directly.

        let updates = [];
        for (const [id, data] of inventoryMap) {
            if (data.counted !== data.original) {
                updates.push({
                    id: id,
                    stock_quantity: data.counted
                });
            }
        }

        if (updates.length > 0) {
            // Bulk update or individual updates
            for (const update of updates) {
                const { error } = await supabase
                    .from('products')
                    .update({ stock_quantity: update.stock_quantity })
                    .eq('id', update.id);

                if (error) throw error;
            }

            const { showSuccess } = await import("./notifications.js");
            showSuccess(`Inventaire terminé. ${updates.length} produits mis à jour.`);
        } else {
            const { showSuccess } = await import("./notifications.js");
            showSuccess("Aucun changement de stock détecté.");
        }

        setTimeout(() => {
            window.location.href = 'produits.html';
        }, 1500);

    } catch (err) {
        console.error(err);
        alert("Erreur lors de la sauvegarde: " + err.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
};
