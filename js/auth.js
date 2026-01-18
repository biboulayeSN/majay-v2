import { supabase } from "./config.js";

// ================= AUTHENTIFICATION SUPABASE PHONE =================

/**
 * Envoyer le code OTP par SMS
 */
async function envoyerOTP(telephone) {
  try {
    // Nettoyer le numéro (enlever espaces, garder +)
    const phone = telephone.replace(/\s/g, '').replace(/^0/, '+221');
    if (!phone.startsWith('+')) {
      throw new Error('Le numéro doit commencer par + (ex: +221771234567)');
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms'
      }
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Vérifier le code OTP et connecter l'utilisateur
 */
async function verifierOTP(telephone, code) {
  try {
    const phone = telephone.replace(/\s/g, '').replace(/^0/, '+221');
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: 'sms'
    });

    if (error) throw error;

    // Récupérer l'utilisateur et sa boutique
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        phone,
        email,
        full_name,
        role_type,
        stores!inner (
          id,
          name,
          slug,
          subscription_plan,
          whatsapp_number,
          is_active
        )
      `)
      .eq('id', data.user.id)
      .eq('stores.is_active', true)
      .limit(1)
      .single();

    if (userError) throw userError;

    if (!userData.stores || userData.stores.length === 0) {
      throw new Error('Aucune boutique active trouvée pour ce compte');
    }

    const store = Array.isArray(userData.stores) ? userData.stores[0] : userData.stores;

    const sessionData = {
      user_id: userData.id,
      store_id: store.id,
      phone: userData.phone,
      email: userData.email,
      full_name: userData.full_name || store.name,
      store_name: store.name,
      store_slug: store.slug,
      subscription_plan: store.subscription_plan,
      whatsapp_number: store.whatsapp_number,
      role_type: userData.role_type,
      timestamp: Date.now()
    };

    sauvegarderSession(sessionData);
    return { success: true, data: sessionData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================= INSCRIPTION =================

/**
 * Inscrire un nouveau vendeur avec création de boutique
 */
async function inscrireVendeur(data) {
  try {
    const { nom, slug, telephone, whatsapp, full_name } = data;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:102',message:'inscrireVendeur ENTRY',data:{telephone_received:telephone},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion

    // Le numéro est déjà formaté depuis inscription.html, on enlève juste les espaces
    const phone = telephone.replace(/\s/g, '');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:108',message:'Phone AFTER cleanup',data:{phone_cleaned:phone,starts_with_plus:phone.startsWith('+')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    
    if (!phone.startsWith('+')) {
      throw new Error('Le numéro doit commencer par + (ex: +221771234567)');
    }

    // Vérifier que le slug est valide
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets');
    }

    // Vérifier que le slug n'existe pas déjà
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingStore) {
      throw new Error('Ce nom de boutique est déjà pris. Choisissez-en un autre.');
    }

    // Envoyer OTP pour créer le compte
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:129',message:'BEFORE signInWithOtp',data:{phone_to_send:phone},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms',
        data: {
          full_name: full_name || nom,
          store_name: nom,
          store_slug: slug,
          whatsapp_number: whatsapp || phone
        }
      }
    });

    if (otpError) throw otpError;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:143',message:'OTP sent successfully',data:{phone_used:phone},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Stocker temporairement les données d'inscription
    sessionStorage.setItem('majay_inscription_temp', JSON.stringify({
      nom,
      slug,
      telephone: phone,
      whatsapp: whatsapp || phone,
      full_name: full_name || nom
    }));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:170',message:'inscrireVendeur EXIT',data:{phone_returned:phone},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    return { 
      success: true, 
      message: 'Code de vérification envoyé par SMS',
      phone: phone
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Finaliser l'inscription après vérification OTP
 */
async function finaliserInscription(telephone, code) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:166',message:'finaliserInscription ENTRY',data:{telephone_received:telephone,code_length:code.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion
    
    // Nettoyer le numéro (enlever espaces) mais garder le préfixe s'il existe déjà
    let phone = telephone.replace(/\s/g, '');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:175',message:'Phone BEFORE prefix check',data:{phone_before:phone,starts_with_plus:phone.startsWith('+')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Ajouter le préfixe seulement si le numéro ne commence pas par +
    if (!phone.startsWith('+')) {
      phone = phone.replace(/^0/, '+221');
      if (!phone.startsWith('+')) {
        phone = '+221' + phone;
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:188',message:'Phone AFTER formatting for verifyOtp',data:{phone_final:phone},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Vérifier le code OTP
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: 'sms'
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:199',message:'verifyOtp RESULT',data:{has_error:!!authError,error_message:authError?.message,error_code:authError?.code,has_data:!!authData,user_id:authData?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F,G,H'})}).catch(()=>{});
    // #endregion

    if (authError) throw authError;

    // Récupérer les données temporaires
    const tempData = JSON.parse(sessionStorage.getItem('majay_inscription_temp') || '{}');
    
    if (!tempData.nom) {
      throw new Error('Données d\'inscription introuvables. Veuillez recommencer.');
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:210',message:'Creating user in public.users (RLS disabled)',data:{user_id:authData.user.id,store_name:tempData.nom,store_slug:tempData.slug},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v4',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    // Créer l'utilisateur dans public.users (requis pour la FK de stores)
    // RLS doit être désactivé sur users pour que ceci fonctionne
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        phone: phone,
        full_name: tempData.full_name || tempData.nom,
        role_type: 'owner'
      });

    if (userError && userError.code !== '23505') { // 23505 = duplicate key (user already exists)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:228',message:'User insert ERROR',data:{error_message:userError.message,error_code:userError.code},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v4',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      throw userError;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:235',message:'User created in public.users SUCCESS',data:{user_id:authData.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v4',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    // Créer la boutique dans la table stores
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        name: tempData.nom,
        slug: tempData.slug,
        owner_id: authData.user.id,
        whatsapp_number: tempData.whatsapp || phone,
        subscription_plan: 'free',
        is_active: true
      })
      .select()
      .single();

    if (storeError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:253',message:'Store insert ERROR',data:{error_message:storeError.message,error_code:storeError.code},timestamp:Date.now(),sessionId:'debug-session',runId:'fix',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      throw storeError;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:260',message:'Store created successfully',data:{store_id:storeData.id,store_slug:storeData.slug},timestamp:Date.now(),sessionId:'debug-session',runId:'fix',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    // Nettoyer les données temporaires
    sessionStorage.removeItem('majay_inscription_temp');

    // Créer la session avec les données qu'on a déjà (de Auth et Store)
    const sessionData = {
      user_id: authData.user.id,
      store_id: storeData.id,
      phone: authData.user.phone || phone, // Utiliser le phone de auth.users
      email: authData.user.email || null,
      full_name: tempData.full_name || tempData.nom,
      store_name: storeData.name,
      store_slug: storeData.slug,
      subscription_plan: storeData.subscription_plan,
      whatsapp_number: storeData.whatsapp_number,
      role_type: 'owner',
      timestamp: Date.now()
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:278',message:'Session created SUCCESS',data:{user_id:sessionData.user_id,store_id:sessionData.store_id,store_slug:sessionData.store_slug,subscription_plan:sessionData.subscription_plan},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v3',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

    sauvegarderSession(sessionData);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9699f09f-c80e-465a-b118-2ac168d0b2da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:289',message:'finaliserInscription EXIT - SUCCESS',data:{success:true,store_slug:sessionData.store_slug},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v3',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    
    return { success: true, data: sessionData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================= CONNEXION =================

/**
 * Connexion d'un vendeur existant (envoie OTP)
 * IMPORTANT: L'utilisateur doit être préalablement inscrit
 */
async function connexionVendeur(telephone) {
  try {
    const phone = telephone.replace(/\s/g, '').replace(/^0/, '+221');
    
    // Vérifier que l'utilisateur existe dans la table users
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, phone')
      .eq('phone', phone)
      .single();

    if (userError || !existingUser) {
      return { 
        success: false, 
        error: 'Aucun compte trouvé avec ce numéro. Veuillez vous inscrire d\'abord.',
        needsSignup: true
      };
    }

    // Vérifier que l'utilisateur a au moins une boutique active
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', existingUser.id)
      .eq('is_active', true)
      .limit(1);

    if (storesError || !stores || stores.length === 0) {
      return { 
        success: false, 
        error: 'Aucune boutique active trouvée. Veuillez vous inscrire pour créer une boutique.',
        needsSignup: true
      };
    }
    
    // Envoyer OTP
    const result = await envoyerOTP(phone);
    if (!result.success) {
      return result;
    }

    // Stocker le numéro pour la vérification
    sessionStorage.setItem('majay_connexion_phone', phone);
    
    return { 
      success: true, 
      message: 'Code de vérification envoyé par SMS',
      phone: phone
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Vérifier le code OTP et connecter
 */
async function verifierConnexion(code) {
  try {
    const phone = sessionStorage.getItem('majay_connexion_phone');
    if (!phone) {
      throw new Error('Session de connexion expirée. Veuillez recommencer.');
    }

    const result = await verifierOTP(phone, code);
    if (result.success) {
      sessionStorage.removeItem('majay_connexion_phone');
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================= SESSION =================

function sauvegarderSession(session) {
  localStorage.setItem("majay_session", JSON.stringify(session));
}

function getSession() {
  const s = localStorage.getItem("majay_session");
  if (!s) return null;
  
  try {
    const data = JSON.parse(s);
    // Vérifier expiration (30 jours d'inactivité)
    const age = Date.now() - (data.timestamp || 0);
    if (age > 30 * 24 * 60 * 60 * 1000) {
      deconnexion();
      return null;
    }
    
    // Renouveler le timestamp à chaque utilisation pour maintenir la session active
    // Cela garantit que la session persiste tant que l'utilisateur utilise l'application
    data.timestamp = Date.now();
    sauvegarderSession(data);
    
    return data;
  } catch {
    return null;
  }
}

function deconnexion() {
  localStorage.removeItem("majay_session");
  sessionStorage.removeItem('majay_inscription_temp');
  sessionStorage.removeItem('majay_connexion_phone');
  supabase.auth.signOut();
  window.location.href = "connexion.html";
}

// ================= COMPATIBILITÉ ANCIEN CODE =================

/**
 * @deprecated Utiliser connexionVendeur() puis verifierConnexion()
 * Fonction de compatibilité pour l'ancien code
 */
async function connexionVendeurAncien(telephone) {
  // Pour compatibilité, on envoie juste l'OTP
  return await connexionVendeur(telephone);
}

export const authMaJay = {
  // Nouvelles fonctions
  envoyerOTP,
  verifierOTP,
  inscrireVendeur,
  finaliserInscription,
  connexionVendeur,
  verifierConnexion,
  getSession,
  deconnexion,
  sauvegarderSession,
  // Compatibilité
  connexionVendeurAncien
};
