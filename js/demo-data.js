// Données de démonstration pour les boutiques d'exemple
// 3 boutiques avec max 5 produits par catégorie
export const DEMO_STORES = {
    'fashion-store-demo': {
        name: 'Fashion Store',
        whatsapp: '+221771234567',
        products: [
            // Mode Femme (max 5)
            {
                id: 1,
                name: 'Robe d\'été élégante',
                description: 'Robe légère parfaite pour l\'été. Tissu respirant et coupe moderne.',
                price: 35000,
                category: 'Femme',
                image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'
            },
            {
                id: 2,
                name: 'Jean skinny noir',
                description: 'Jean stretch confortable. Coupe moderne et tendance.',
                price: 42000,
                category: 'Femme',
                image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400'
            },
            // Mode Homme (max 5)
            {
                id: 3,
                name: 'Chemise homme slim',
                description: 'Chemise ajustée en coton. Idéale pour le travail ou les sorties.',
                price: 28000,
                category: 'Homme',
                image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400'
            },
            {
                id: 4,
                name: 'Veste en cuir',
                description: 'Veste en simili-cuir de qualité. Style intemporel.',
                price: 65000,
                category: 'Homme',
                image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'
            },
            // Chaussures (max 5)
            {
                id: 5,
                name: 'Sneakers blanches',
                description: 'Baskets tendance et confortables. Semelle souple.',
                price: 38000,
                category: 'Chaussures',
                image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
            }
        ]
    },
    'tech-shop-demo': {
        name: 'Tech Shop',
        whatsapp: '+221771234568',
        products: [
            // Audio (max 5)
            {
                id: 7,
                name: 'Écouteurs Bluetooth',
                description: 'Son de haute qualité. Autonomie de 20h. Réduction de bruit.',
                price: 55000,
                category: 'Audio',
                image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
            },
            // Accessoires (max 5)
            {
                id: 8,
                name: 'Chargeur rapide USB-C',
                description: 'Charge rapide 65W. Compatible tous appareils USB-C.',
                price: 18000,
                category: 'Accessoires',
                image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400'
            },
            {
                id: 11,
                name: 'Power Bank 20000mAh',
                description: 'Batterie externe haute capacité. Charge rapide.',
                price: 35000,
                category: 'Accessoires',
                image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400'
            },
            {
                id: 12,
                name: 'Support téléphone voiture',
                description: 'Fixation magnétique. Rotation 360°. Très stable.',
                price: 12000,
                category: 'Accessoires',
                image_url: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400'
            },
            // Wearable (max 5)
            {
                id: 10,
                name: 'Montre connectée',
                description: 'Suivi sport et santé. Notifications smartphone. Étanche.',
                price: 85000,
                category: 'Wearable',
                image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
            }
        ]
    },
    'beauty-corner-demo': {
        name: 'Beauty Corner',
        whatsapp: '+221771234569',
        products: [
            // Maquillage (max 5)
            {
                id: 13,
                name: 'Rouge à lèvres mat',
                description: 'Tenue longue durée. Couleur intense. Ne dessèche pas.',
                price: 15000,
                category: 'Maquillage',
                image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'
            },
            {
                id: 15,
                name: 'Palette fards à paupières',
                description: '12 couleurs tendance. Pigmentation intense. Mat et nacré.',
                price: 32000,
                category: 'Maquillage',
                image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400'
            },
            {
                id: 18,
                name: 'Mascara waterproof',
                description: 'Volume et longueur. Résistant à l\'eau. Noir intense.',
                price: 18000,
                category: 'Maquillage',
                image_url: 'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400'
            },
            // Soins (max 5)
            {
                id: 14,
                name: 'Crème hydratante visage',
                description: 'Hydratation 24h. Tous types de peau. Sans parabènes.',
                price: 28000,
                category: 'Soins',
                image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400'
            },
            {
                id: 17,
                name: 'Sérum anti-âge',
                description: 'Réduit les rides. Vitamine C et acide hyaluronique.',
                price: 38000,
                category: 'Soins',
                image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'
            }
        ]
    }
};

// Fonction pour obtenir les données d'une boutique de démo
export function getDemoStore(slug) {
    return DEMO_STORES[slug] || null;
}

// Fonction pour vérifier si c'est une boutique de démo
export function isDemoStore(slug) {
    return slug && slug.endsWith('-demo');
}

// Fonction pour obtenir les produits par catégorie (max 5 par catégorie)
export function getProductsByCategory(storeSlug, category) {
    const store = getDemoStore(storeSlug);
    if (!store) return [];
    
    if (category === 'tous') {
        return store.products;
    }
    
    // Grouper par catégorie et limiter à 5 par catégorie
    const productsByCat = {};
    store.products.forEach(product => {
        if (!productsByCat[product.category]) {
            productsByCat[product.category] = [];
        }
        if (productsByCat[product.category].length < 5) {
            productsByCat[product.category].push(product);
        }
    });
    
    return productsByCat[category] || [];
}
