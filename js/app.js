import { supabase, getStoreSlug } from "./config.js";
import { getDemoStore, isDemoStore } from "./demo-data.js";
import { detectUserLocation, formatPhoneWithPrefix } from "./geolocation.js";

// ==================== VARIABLES GLOBALES ====================
let produits = [];
let panier = [];
let categorieActive = 'tous';
let storeInfo = {};
let isDemo = false;

// ==================== CHARGEMENT DES DONNÉES ====================
async function chargerProduits() {
    try {
        const slug = getStoreSlug();
        if (!slug) {
            afficherErreur("Aucune boutique spécifiée dans l'URL");
            return;
        }

        // Vérifier si c'est une boutique de démonstration
        if (isDemoStore(slug)) {
            isDemo = true;
            const demoStore = getDemoStore(slug);

            if (!demoStore) {
                afficherErreur("Boutique de démonstration introuvable");
                return;
            }

            storeInfo = {
                name: demoStore.name,
                whatsapp: demoStore.whatsapp,
                slug: slug
            };

            produits = demoStore.products;

            // Charger le panier depuis localStorage en mode démo
            const savedPanier = localStorage.getItem('demo_panier');
            if (savedPanier) {
                panier = JSON.parse(savedPanier);
                mettreAJourBadgePanier();
            }

            // Mettre à jour le header
            document.querySelector('.logo').textContent = `🛍️ ${demoStore.name}`;
            document.querySelector('.tagline').textContent = '✨ Boutique de démonstration - Exemples de produits';

            // Ajouter un badge de démo
            const header = document.querySelector('.header');
            const demoBadge = document.createElement('div');
            demoBadge.style.cssText = 'background: #25D366; color: white; padding: 10px 20px; text-align: center; font-weight: 700;';
            demoBadge.textContent = '🎭 Mode Démonstration - Ces produits sont des exemples';
            header.insertAdjacentElement('afterend', demoBadge);

            genererBoutonsCategories();
            afficherProduits(categorieActive);
            initialiserEvenements();
            return;
        }

        // Récupérer la boutique par slug (mode normal)
        const { data: store, error: storeError } = await supabase
            .from("stores")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .single();

        if (storeError) {
            console.error("Erreur récupération boutique:", storeError);
            // Si la boutique n'existe pas (code 406 ou PGRST116)
            if (storeError.code === 'PGRST116' || storeError.message?.includes('0 rows')) {
                afficherErreur(`Boutique "${slug}" introuvable. Vérifiez que le lien est correct.`);
            } else {
                afficherErreur(`Erreur lors du chargement de la boutique: ${storeError.message}`);
            }
            return;
        }

        if (!store) {
            afficherErreur(`Boutique "${slug}" introuvable ou inactive`);
            return;
        }

        storeInfo = store;

        // Mettre à jour le header
        document.querySelector('.logo').textContent = `🛍️ ${store.name}`;
        if (store.description) {
            document.querySelector('.tagline').textContent = store.description;
        }

        // Récupérer les produits actifs
        const { data: produitsData, error: produitsError } = await supabase
            .from("products")
            .select("*")
            .eq("store_id", store.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (produitsError) {
            console.error("Erreur récupération produits:", produitsError);
            // Ne pas bloquer l'affichage si erreur produits, juste logger
            produits = [];
        } else {
            produits = produitsData || [];
        }

        // Enregistrer un événement de vue pour analytics
        if (produits.length > 0) {
            produits.forEach(produit => {
                enregistrerClickEvent(produit.id, store.id, 'view');
            });
        }

        genererBoutonsCategories();
        afficherProduits(categorieActive);
        initialiserEvenements();

    } catch (error) {
        console.error("Erreur:", error);
        afficherErreur(error.message);
    }
}

// ==================== GÉNÉRATION DYNAMIQUE DES CATÉGORIES ====================
function genererBoutonsCategories() {
    // Si des boutons sont déjà présents dans le HTML (cas normal), ne pas les régénérer
    // Sauf si on est en mode démo où on veut peut-être forcer certaines catégories
    const nav = document.querySelector('nav[role="navigation"]');
    if (!nav) return;

    // Si le nav contient déjà des boutons (hardcodés dans catalogue.html), 
    // on ajoute juste les écouteurs d'événements via initialiserEvenements()
    if (nav.children.length > 0) return;

    // Fallback : Génération dynamique si le HTML est vide
    const categories = ['tous', ...new Set(produits.map(p => p.category).filter(Boolean))];

    const categoryIcons = {
        'tous': '🌟',
        'multimedia_hightech': '📱',
        'telephones_tablettes': '📱',
        'informatique_ordinateurs': '💻',
        'Maison_Electromenager': '🏠',
        'gros_electromenager': '❄️',
        'Mode_Beaute_Sante': '👗',
        'vetements_chaussures': '👟',
        'Agroalimentaire': '🥕',
        'Vehicules_Transport': '🚗',
        'Immobilier': '🏢',
        'Emploi_Services': '💼',
        'Divers_Loisirs': '⚽',
        'autres': '🔄'
    };

    nav.innerHTML = categories.map((cat, index) => {
        const isActive = index === 0 ? 'active' : '';
        const icon = categoryIcons[cat] || '📦';
        const label = cat === 'tous' ? 'Tous' : cat.replace(/_/g, ' ');
        const ariaLabel = cat === 'tous' ? 'Afficher tous les produits' : `Filtrer par catégorie ${cat}`;
        const ariaPressed = index === 0 ? 'true' : 'false';

        return `
            <button class="category-btn ${isActive}" data-category="${cat}" aria-label="${ariaLabel}" aria-pressed="${ariaPressed}">
                <span class="text-lg" aria-hidden="true">${icon}</span>
                <span class="hidden md:inline">${label}</span>
            </button>
        `;
    }).join('');
}

// ==================== ENREGISTREMENT CLICKS POUR ANALYTICS ====================
async function enregistrerClickEvent(productId, storeId, eventType) {
    // Ne pas enregistrer d'analytics en mode démo
    if (isDemo) return;

    try {
        // Récupérer la ville depuis l'IP (simplifié - en production utiliser un service)
        const customerCity = 'Unknown'; // À améliorer avec un service de géolocalisation

        await supabase.from('click_events').insert({
            product_id: productId,
            store_id: storeId,
            event_type: eventType,
            customer_city: customerCity,
            session_id: getSessionId()
        });
    } catch (error) {
        // Ignorer les erreurs d'analytics silencieusement
        console.warn('Erreur analytics:', error);
    }
}

function getSessionId() {
    let sessionId = sessionStorage.getItem('SAMASTORE_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('SAMASTORE_session_id', sessionId);
    }
    return sessionId;
}

// ==================== AFFICHAGE PRODUITS ====================
function afficherProduits(categorie) {
    const grid = document.getElementById('productsGrid');

    const produitsFiltres = categorie === 'tous'
        ? produits
        : produits.filter(p => {
            // Correspondance exacte
            if (p.category === categorie) return true;

            // Logique de sous-catégories pour les filtres principaux
            const mapCategories = {
                'multimedia_hightech': ['telephones_tablettes', 'informatique_ordinateurs', 'electronique_tv_video', 'consoles_jeux_video'],
                'Maison_Electromenager': ['gros_electromenager', 'petit_electromenager', 'ameublement_decoration', 'cuisine_entretien'],
                'Vehicules_Transport': ['voitures_particulieres', 'motos_scooters', 'camions_engins_btp', 'pieces_detachees'],
                'Immobilier': ['vente_maisons_terrains', 'location_appartements', 'bureaux_commerces', 'locations_saisonnieres'],
                'Mode_Beaute_Sante': ['vetements_chaussures', 'bijoux_montres_sacs', 'cosmetiques_parfumerie', 'sante_bienetre'],
                'Emploi_Services': ['offres_demandes_emploi', 'prestations_services', 'formations_cours'],
                'Agroalimentaire': ['supermarche_epicerie', 'produits_frais_locaux', 'elevage_betail'],
                'Divers_Loisirs': ['sport_fitness', 'jouets_puericulture', 'materiaux_construction', 'animaux']
            };

            const sousCategories = mapCategories[categorie];
            if (sousCategories && sousCategories.includes(p.category)) {
                return true;
            }

            return false;
        });

    if (produitsFiltres.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: white;">
                <div style="font-size: 4em; margin-bottom: 20px;">📦</div>
                <h3 style="font-size: 1.5em;">Aucun produit disponible</h3>
                <p style="margin-top: 10px;">Le vendeur n'a pas encore ajouté de produits</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = produitsFiltres.map(produit => {
        // Gérer les images pour mode normal (images array) et mode démo (image_url string)
        let imageUrl;
        if (isDemo) {
            imageUrl = produit.image_url || 'https://via.placeholder.com/300';
        } else {
            imageUrl = produit.images && produit.images.length > 0
                ? produit.images[0]
                : 'https://via.placeholder.com/300';
        }

        const currency = produit.currency || 'FCFA';

        return `
        <div class="product-card" data-id="${produit.id}">
            <img src="${imageUrl}" 
                 alt="${produit.name}" 
                 class="product-image" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300?text=Image'">
            <div class="product-info">
                <span class="product-category">${(produit.category || 'Non catégorisé').replace(/_/g, ' ')}</span>
                <h3 class="product-name">${produit.name}</h3>
                <p class="product-desc">${produit.description || ''}</p>
                <div class="product-footer">
                    <span class="product-price">${formaterPrix(produit.price)} ${currency}</span>
                    <button class="add-btn" data-id="${produit.id}">
                        <span class="btn-text">+ Ajouter</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Ajouter les événements sur les boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation(); // Empêcher l'ouverture de la modal
            const id = parseInt(this.dataset.id);
            ajouterAuPanier(id, this);
        });
    });

    // Ajouter les événements pour ouvrir la modal de détails au clic sur la carte
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function (e) {
            // Ne pas ouvrir si on clique sur le bouton "Ajouter"
            if (e.target.closest('.add-btn')) return;

            const id = parseInt(this.dataset.id);
            ouvrirModalDetails(id);
        });
    });
}

// ==================== GESTION PANIER ====================
function ajouterAuPanier(idProduit, bouton) {
    const produit = produits.find(p => p.id === idProduit);

    if (!produit) return;

    const itemExistant = panier.find(item => item.id === idProduit);

    if (itemExistant) {
        itemExistant.quantite += 1;
    } else {
        panier.push({
            ...produit,
            quantite: 1
        });
    }

    // En mode démo, sauvegarder dans localStorage
    if (isDemo) {
        localStorage.setItem('demo_panier', JSON.stringify(panier));
        localStorage.setItem('demo_store', JSON.stringify(storeInfo));
    }

    // Enregistrer l'événement "cart_add" (sauf en mode démo)
    if (!isDemo && storeInfo.id) {
        enregistrerClickEvent(idProduit, storeInfo.id, 'cart_add');
    }

    mettreAJourBadgePanier();
    animerBoutonAjout(bouton);
    afficherNotification('✅ Produit ajouté au panier');
}

function animerBoutonAjout(bouton) {
    const contenuOriginal = bouton.innerHTML;
    bouton.disabled = true;
    bouton.innerHTML = '<span class="btn-text">✓ Ajouté !</span>';
    bouton.classList.add('btn-success');

    setTimeout(() => {
        bouton.innerHTML = contenuOriginal;
        bouton.classList.remove('btn-success');
        bouton.disabled = false;
    }, 1500);
}

function retirerDuPanier(idProduit) {
    panier = panier.filter(item => item.id !== idProduit);
    mettreAJourBadgePanier();
    afficherPanier();
}

function mettreAJourBadgePanier() {
    const badge = document.getElementById('cartBadge');
    const total = panier.reduce((sum, item) => sum + item.quantite, 0);
    badge.textContent = total;
}

// ==================== AFFICHAGE MODAL PANIER ====================
function afficherPanier() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('totalAmount');
    const currency = isDemo ? 'FCFA' : (storeInfo.currency || 'XOF');

    if (panier.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p class="cart-empty-text">Votre panier est vide</p>
            </div>
        `;
        totalEl.textContent = `0 ${currency}`;
        return;
    }

    container.innerHTML = panier.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name} × ${item.quantite}</div>
                <div class="cart-item-price">${formaterPrix(parseInt(item.price) * item.quantite)} ${currency}</div>
            </div>
            <button class="remove-btn" data-id="${item.id}">✕</button>
        </div>
    `).join('');

    // Ajouter événements suppression
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.dataset.id);
            retirerDuPanier(id);
        });
    });

    const total = calculerTotal();
    totalEl.textContent = `${formaterPrix(total)} ${currency}`;
}

function calculerTotal() {
    return panier.reduce((sum, item) => sum + (parseInt(item.price) * item.quantite), 0);
}

// ==================== MODAL CONTACT CLIENT ====================
async function ouvrirModalContact() {
    fermerPanier();
    document.getElementById('contactModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialiser la détection de géolocalisation pour le téléphone
    try {
        const location = await detectUserLocation();
        const phoneInput = document.getElementById('clientPhone');

        // Afficher le préfixe
        let phonePrefix = document.getElementById('clientPhonePrefix');
        if (!phonePrefix) {
            phonePrefix = document.createElement('div');
            phonePrefix.id = 'clientPhonePrefix';
            phonePrefix.style.cssText = `
                position: absolute;
                left: 15px;
                top: 50%;
                transform: translateY(-50%);
                font-weight: 700;
                color: #25D366;
                font-size: 1em;
                pointer-events: none;
                z-index: 1;
            `;
            phoneInput.parentElement.insertBefore(phonePrefix, phoneInput);
        }
        phonePrefix.textContent = location.prefix;

        // Mettre à jour le hint
        document.getElementById('clientPhoneHint').innerHTML = `
            <span style="color: #25D366;">✓</span> Pays détecté: ${location.flag} ${location.countryName}
        `;

        // Stocker la localisation pour l'utiliser lors de la soumission
        phoneInput.dataset.countryCode = location.country;
        phoneInput.dataset.prefix = location.prefix;

    } catch (error) {
        console.error('Erreur détection localisation:', error);
    }
}

function fermerModalContact() {
    document.getElementById('contactModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    // Réinitialiser le formulaire
    document.getElementById('contactForm').reset();
}

// ==================== ENVOI WHATSAPP ====================
async function envoyerVersWhatsApp() {
    if (panier.length === 0) {
        afficherNotification('❌ Votre panier est vide !');
        return;
    }

    // MODE DÉMO : Rediriger vers l'inscription au lieu de WhatsApp
    if (isDemo) {
        const totalItems = panier.reduce((sum, item) => sum + item.quantite, 0);
        const confirmation = confirm(
            `🎭 MODE DÉMONSTRATION\n\n` +
            `Vous avez ${totalItems} article(s) dans votre panier.\n\n` +
            `Vous etes a la fin de la démonstration. Vous pouvez maintenant vous inscrire pour passer une vraie commande.\n\n` +
            `Voulez-vous vous inscrire maintenant ?`
        );

        if (confirmation) {
            window.location.href = 'vendeur/inscription.html';
        }
        return;
    }

    // Ouvrir le modal de contact pour collecter les infos du client
    ouvrirModalContact();
}

async function finaliserCommande(event) {
    event.preventDefault();

    const firstName = document.getElementById('clientFirstName').value.trim();
    const lastName = document.getElementById('clientLastName').value.trim();
    let phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim();

    if (!firstName || !phone) {
        afficherNotification('❌ Veuillez remplir les champs obligatoires');
        return;
    }

    // Récupérer le préfixe détecté
    const phoneInput = document.getElementById('clientPhone');
    const prefix = phoneInput.dataset.prefix || '+221';
    const countryCode = phoneInput.dataset.countryCode || 'SN';

    // Formater le numéro avec le préfixe
    phone = phone.replace(/\s/g, '').replace(/^0+/, '');
    if (!phone.startsWith('+')) {
        phone = prefix + phone;
    }

    try {
        // Récupérer la localisation pour le CRM
        const location = await detectUserLocation();

        // Enregistrer le client dans le CRM avec géolocalisation
        await enregistrerClientCRM({
            firstName,
            lastName,
            phone: phone,
            address,
            country: countryCode,
            city: location.city,
            region: location.region
        });

        // Préparer le message WhatsApp
        await envoyerMessageWhatsApp(phone, firstName);

    } catch (error) {
        console.error('Erreur lors de la finalisation:', error);
        afficherNotification('❌ Erreur lors de l\'enregistrement. Commande annulée.');
    }
}

async function enregistrerClientCRM(clientData) {
    try {
        // Calculer le total de la commande
        const total = calculerTotal();

        // Vérifier si le client existe déjà
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id, total_orders, total_spent')
            .eq('store_id', storeInfo.id)
            .eq('phone', clientData.phone)
            .maybeSingle();

        if (existingCustomer) {
            // Mettre à jour le client existant
            await supabase
                .from('customers')
                .update({
                    first_name: clientData.firstName,
                    last_name: clientData.lastName || existingCustomer.last_name,
                    address: clientData.address || existingCustomer.address,
                    city: clientData.city || existingCustomer.city,
                    region: clientData.region || existingCustomer.region,
                    total_orders: existingCustomer.total_orders + 1,
                    total_spent: existingCustomer.total_spent + total,
                    last_order_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingCustomer.id);
        } else {
            // Créer un nouveau client
            await supabase
                .from('customers')
                .insert({
                    store_id: storeInfo.id,
                    first_name: clientData.firstName,
                    last_name: clientData.lastName || '',
                    phone: clientData.phone,
                    address: clientData.address || '',
                    city: clientData.city || 'Unknown',
                    region: clientData.region || 'Unknown',
                    total_orders: 1,
                    total_spent: total,
                    last_order_date: new Date().toISOString(),
                    customer_segment: 'new'
                });
        }

        afficherNotification('✅ Informations enregistrées');
    } catch (error) {
        console.error('Erreur enregistrement client:', error);
        // On continue quand même vers WhatsApp même si l'enregistrement échoue
    }
}

async function envoyerMessageWhatsApp(clientPhone, clientName) {
    // Préparer le message WhatsApp
    let message = `🛍️ *NOUVELLE COMMANDE - ${storeInfo.name.toUpperCase()}*\n\n`;
    message += `👤 *Client:* ${clientName}\n`;
    message += `📞 *Téléphone:* ${clientPhone}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    const items = [];

    panier.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `   📦 Quantité: ${item.quantite}\n`;
        message += `   💰 Prix unitaire: ${formaterPrix(item.price)} ${item.currency || 'XOF'}\n`;
        message += `   ✅ Sous-total: ${formaterPrix(parseInt(item.price) * item.quantite)} ${item.currency || 'XOF'}\n\n`;

        items.push({
            product_id: item.id,
            name: item.name,
            price: parseInt(item.price),
            quantity: item.quantite
        });
    });

    const total = calculerTotal();
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💵 *TOTAL: ${formaterPrix(total)} ${storeInfo.currency || 'XOF'}*\n\n`;
    message += `Merci de confirmer ma commande ! 🙏`;

    // Enregistrer la commande dans la base de données
    try {
        // Générer un numéro de commande unique
        const orderNumber = 'CMD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();

        // Récupérer l'ID du client depuis la base
        const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('store_id', storeInfo.id)
            .eq('phone', clientPhone)
            .maybeSingle();

        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id: storeInfo.id,
                customer_id: customer?.id || null,
                order_number: orderNumber,
                customer_name: clientName,
                customer_phone: clientPhone,
                items: items,
                subtotal: total,
                delivery_fee: 0,
                total: total,
                discount_amount: 0,
                currency: storeInfo.currency || 'XOF',
                status: 'pending',
                source: 'whatsapp'
            })
            .select()
            .single();

        if (orderError) {
            console.error('Erreur enregistrement commande:', orderError);
        } else {
            // Enregistrer les événements "purchase"
            items.forEach(item => {
                enregistrerClickEvent(item.product_id, storeInfo.id, 'purchase');
            });
        }
    } catch (error) {
        console.error('Erreur enregistrement commande:', error);
    }

    // Ouvrir WhatsApp
    const numeroWhatsApp = (storeInfo.whatsapp_number || storeInfo.whatsapp || '').replace(/\s/g, '').replace(/\+/g, '');
    if (!numeroWhatsApp) {
        afficherNotification('❌ Numéro WhatsApp non configuré pour cette boutique');
        return;
    }

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Fermer le modal et vider le panier
    fermerModalContact();
    panier = [];
    mettreAJourBadgePanier();
    afficherPanier();

    afficherNotification('✅ Commande envoyée avec succès !');
}

// ==================== FILTRES ====================
function initialiserFiltres() {
    const boutons = document.querySelectorAll('.category-btn');

    boutons.forEach(btn => {
        btn.addEventListener('click', function () {
            boutons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            categorieActive = this.dataset.category;
            afficherProduits(categorieActive);
        });
    });
}

// ==================== MODAL ====================
function ouvrirPanier() {
    // En mode démo, rediriger vers la page panier
    if (isDemo) {
        localStorage.setItem('demo_panier', JSON.stringify(panier));
        localStorage.setItem('demo_store', JSON.stringify(storeInfo));
        window.location.href = 'panier-demo.html';
        return;
    }

    // En mode normal, ouvrir la modal
    afficherPanier();

    const whatsappBtn = document.getElementById('whatsappBtn');
    whatsappBtn.innerHTML = `
        <span>📲</span>
        <span>Commander sur WhatsApp</span>
    `;

    document.getElementById('cartModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fermerPanier() {
    document.getElementById('cartModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ==================== MODAL DÉTAILS PRODUIT ====================
function ouvrirModalDetails(idProduit) {
    const produit = produits.find(p => p.id === idProduit);
    if (!produit) return;

    // Récupérer toutes les images
    let images = [];
    if (isDemo) {
        images = produit.image_url ? [produit.image_url] : ['https://via.placeholder.com/300'];
    } else {
        images = produit.images && produit.images.length > 0
            ? produit.images
            : ['https://via.placeholder.com/300'];
    }

    // Remplir les informations
    document.getElementById('productDetailTitle').textContent = produit.name;
    document.getElementById('productDetailName').textContent = produit.name;
    document.getElementById('productDetailCategory').textContent = produit.category || 'Non catégorisé';
    document.getElementById('productDetailDescription').textContent = produit.description || 'Aucune description disponible.';

    const currency = produit.currency || 'FCFA';
    document.getElementById('productDetailPrice').textContent = `${formaterPrix(produit.price)} ${currency}`;

    // Afficher la première image
    document.getElementById('productDetailMainImage').src = images[0];
    document.getElementById('productDetailMainImage').alt = produit.name;

    // Créer les miniatures
    const thumbnailsContainer = document.getElementById('productDetailThumbnails');
    thumbnailsContainer.innerHTML = images.map((img, index) => `
        <img src="${img}" 
             alt="${produit.name} - Image ${index + 1}" 
             class="w-full h-20 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:opacity-75 border-2 ${index === 0 ? 'border-accent' : 'border-transparent'}"
             onclick="changerImagePrincipale('${img}', this)"
             loading="lazy">
    `).join('');

    // Événement pour le bouton "Ajouter au panier"
    const addBtn = document.getElementById('productDetailAddBtn');
    addBtn.onclick = function () {
        ajouterAuPanier(idProduit, addBtn);
        fermerModalDetails();
    };

    // Afficher la modal
    const modal = document.getElementById('productDetailModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function changerImagePrincipale(imageUrl, thumbnail) {
    document.getElementById('productDetailMainImage').src = imageUrl;

    // Mettre à jour la bordure des miniatures
    document.querySelectorAll('#productDetailThumbnails img').forEach(img => {
        img.classList.remove('border-accent');
        img.classList.add('border-transparent');
    });
    thumbnail.classList.remove('border-transparent');
    thumbnail.classList.add('border-accent');
}

function fermerModalDetails() {
    const modal = document.getElementById('productDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Exposer la fonction globalement pour les miniatures
window.changerImagePrincipale = changerImagePrincipale;

// ==================== ÉVÉNEMENTS ====================
function initialiserEvenements() {
    document.getElementById('cartBtn').addEventListener('click', ouvrirPanier);
    document.getElementById('closeBtn').addEventListener('click', fermerPanier);
    document.getElementById('modalOverlay').addEventListener('click', fermerPanier);
    document.getElementById('whatsappBtn').addEventListener('click', envoyerVersWhatsApp);

    // Événements pour le modal de contact
    document.getElementById('contactCloseBtn').addEventListener('click', fermerModalContact);
    document.getElementById('contactOverlay').addEventListener('click', fermerModalContact);
    document.getElementById('contactForm').addEventListener('submit', finaliserCommande);

    // Événements pour le modal de détails produit
    const productDetailModal = document.getElementById('productDetailModal');
    if (productDetailModal) {
        document.getElementById('productDetailCloseBtn').addEventListener('click', fermerModalDetails);
        document.getElementById('productDetailOverlay').addEventListener('click', fermerModalDetails);
    }

    initialiserFiltres();

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            fermerPanier();
            fermerModalContact();
            fermerModalDetails();
        }
    });
}

// ==================== UTILITAIRES ====================
function formaterPrix(prix) {
    return parseFloat(prix).toLocaleString('fr-FR');
}

function afficherNotification(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(37, 211, 102, 0.4);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = message;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

function afficherErreur(msg) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: white;">
            <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
            <h3 style="font-size: 1.5em; margin-bottom: 15px;">Erreur</h3>
            <p>${msg}</p>
            <button onclick="location.reload()" style="
                margin-top: 20px;
                padding: 12px 24px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-weight: 700;
                cursor: pointer;
            ">Réessayer</button>
        </div>
    `;
}

// ==================== ANIMATIONS CSS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .btn-success {
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
    }
    .cart-empty {
        text-align: center;
        padding: 60px 20px;
        color: #718096;
    }
    .cart-empty-icon {
        font-size: 4em;
        margin-bottom: 15px;
    }
    .cart-empty-text {
        font-size: 1.2em;
    }
`;
document.head.appendChild(style);

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', chargerProduits);

