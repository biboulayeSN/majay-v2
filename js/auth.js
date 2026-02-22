import { supabase } from "./config.js";

// ================= AUTHENTIFICATION SUPABASE PHONE =================

/**
 * Envoyer le code OTP par SMS
 */
async function envoyerOTP(telephone) {
  try {
    const phone = telephone.replace(/\s/g, '').replace(/^0/, '+221');
    if (!phone.startsWith('+')) {
      throw new Error('Le numéro doit commencer par + (ex: +221771234567)');
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: { channel: 'sms' }
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

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id, phone, email, full_name, role_type,
        stores!inner (id, name, slug, subscription_plan, whatsapp_number, is_active)
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

// ================= NUMEROS DE DEVELOPPEMENT =================

const DEV_PHONE = '+221706152830';
const DEV_NUMBERS = ['+221706152830', '706152830', '+2210706152830'];

function isDevNumber(phone) {
  const normalized = phone.replace(/^\+2210/, '+221');
  return DEV_NUMBERS.includes(phone) || normalized === DEV_PHONE;
}

// ================= INSCRIPTION =================

/**
 * Inscrire un nouveau vendeur avec création de boutique
 */
async function inscrireVendeur(data) {
  try {
    const { nom, slug, telephone, whatsapp, full_name } = data;

    const phone = telephone.replace(/\s/g, '');

    if (!phone.startsWith('+')) {
      throw new Error('Le numéro doit commencer par + (ex: +221771234567)');
    }

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

    // Stocker les données d'inscription
    const normalizedPhone = phone.replace(/^\+2210/, '+221');
    sessionStorage.setItem('SAMASTORE_inscription_temp', JSON.stringify({
      nom,
      slug,
      telephone: normalizedPhone,
      whatsapp: whatsapp || normalizedPhone,
      full_name: full_name || nom
    }));

    // Bypass OTP pour le numéro de développement
    if (isDevNumber(phone)) {
      return {
        success: true,
        message: 'Mode dev: utilisez le code 123456',
        phone: normalizedPhone,
        bypassOTP: true
      };
    }

    // Envoyer OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: 'sms',
        data: {
          full_name: full_name || nom,
          store_name: nom,
          store_slug: slug,
          whatsapp_number: whatsapp || normalizedPhone
        }
      }
    });

    if (otpError) throw otpError;

    return {
      success: true,
      message: 'Code de vérification envoyé par SMS',
      phone: normalizedPhone
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
    let phone = telephone.replace(/\s/g, '');

    if (!phone.startsWith('+')) {
      phone = phone.replace(/^0/, '+221');
      if (!phone.startsWith('+')) {
        phone = '+221' + phone;
      }
    }

    const tempData = JSON.parse(sessionStorage.getItem('SAMASTORE_inscription_temp') || '{}');
    if (!tempData.nom) {
      throw new Error('Données d\'inscription introuvables. Veuillez recommencer.');
    }

    // Bypass pour numéro de développement : créer directement sans OTP
    if (isDevNumber(phone)) {
      // Générer un UUID pour le user dev
      const devUserId = crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Date.now();

      // Créer l'utilisateur dans public.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: devUserId,
          phone: DEV_PHONE,
          full_name: tempData.full_name || tempData.nom,
          role_type: 'owner'
        });

      if (userError && userError.code !== '23505') {
        throw userError;
      }

      // Si l'utilisateur existe déjà, récupérer son ID
      let userId = devUserId;
      if (userError && userError.code === '23505') {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone', DEV_PHONE)
          .single();
        if (existingUser) userId = existingUser.id;
      }

      // Créer la boutique
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: tempData.nom,
          slug: tempData.slug,
          owner_id: userId,
          whatsapp_number: tempData.whatsapp || DEV_PHONE,
          subscription_plan: 'free',
          is_active: true
        })
        .select()
        .single();

      if (storeError) throw storeError;

      sessionStorage.removeItem('SAMASTORE_inscription_temp');

      const sessionData = {
        user_id: userId,
        store_id: storeData.id,
        phone: DEV_PHONE,
        email: null,
        full_name: tempData.full_name || tempData.nom,
        store_name: storeData.name,
        store_slug: storeData.slug,
        subscription_plan: storeData.subscription_plan,
        whatsapp_number: storeData.whatsapp_number,
        role_type: 'owner',
        timestamp: Date.now()
      };

      sauvegarderSession(sessionData);
      return { success: true, data: sessionData };
    }

    // Flow normal avec OTP
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: 'sms'
    });

    if (authError) throw authError;

    // Créer l'utilisateur dans public.users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        phone: phone,
        full_name: tempData.full_name || tempData.nom,
        role_type: 'owner'
      });

    if (userError && userError.code !== '23505') {
      throw userError;
    }

    // Créer la boutique
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

    if (storeError) throw storeError;

    sessionStorage.removeItem('SAMASTORE_inscription_temp');

    const sessionData = {
      user_id: authData.user.id,
      store_id: storeData.id,
      phone: authData.user.phone || phone,
      email: authData.user.email || null,
      full_name: tempData.full_name || tempData.nom,
      store_name: storeData.name,
      store_slug: storeData.slug,
      subscription_plan: storeData.subscription_plan,
      whatsapp_number: storeData.whatsapp_number,
      role_type: 'owner',
      timestamp: Date.now()
    };

    sauvegarderSession(sessionData);
    return { success: true, data: sessionData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================= CONNEXION =================

/**
 * Connexion d'un vendeur existant (envoie OTP)
 */
async function connexionVendeur(telephone) {
  try {
    let phone = telephone.replace(/\s/g, '');

    if (!phone.startsWith('+')) {
      if (phone.startsWith('0')) {
        phone = '+221' + phone.substring(1);
      } else {
        phone = '+221' + phone;
      }
    }

    // Bypass OTP pour le numéro de développement
    if (isDevNumber(phone)) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, phone, email, full_name, role_type')
        .eq('phone', DEV_PHONE)
        .maybeSingle();

      if (userError || !user) {
        return {
          success: false,
          error: 'Aucun compte trouvé avec ce numéro. Veuillez vous inscrire d\'abord.',
          needsSignup: true
        };
      }

      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name, slug, subscription_plan, whatsapp_number, is_active')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (storesError || !stores || stores.length === 0) {
        return {
          success: false,
          error: 'Aucune boutique active trouvée. Veuillez vous inscrire pour créer une boutique.',
          needsSignup: true
        };
      }

      const store = stores[0];
      const sessionData = {
        user_id: user.id,
        store_id: store.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name || store.name,
        store_name: store.name,
        store_slug: store.slug,
        subscription_plan: store.subscription_plan,
        whatsapp_number: store.whatsapp_number,
        role_type: user.role_type,
        timestamp: Date.now()
      };

      sauvegarderSession(sessionData);
      return {
        success: true,
        message: 'Connexion directe réussie (mode développement)',
        data: sessionData,
        bypassOTP: true
      };
    }

    // Vérifier que l'utilisateur existe
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
    if (!result.success) return result;

    sessionStorage.setItem('SAMASTORE_connexion_phone', phone);
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
    const phone = sessionStorage.getItem('SAMASTORE_connexion_phone');
    if (!phone) {
      throw new Error('Session de connexion expirée. Veuillez recommencer.');
    }

    const result = await verifierOTP(phone, code);
    if (result.success) {
      sessionStorage.removeItem('SAMASTORE_connexion_phone');
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================= SESSION =================

function sauvegarderSession(session) {
  localStorage.setItem("SAMASTORE_session", JSON.stringify(session));
}

function getSession() {
  const s = localStorage.getItem("SAMASTORE_session");
  if (!s) return null;

  try {
    const data = JSON.parse(s);
    const age = Date.now() - (data.timestamp || 0);
    if (age > 30 * 24 * 60 * 60 * 1000) {
      deconnexion();
      return null;
    }
    data.timestamp = Date.now();
    sauvegarderSession(data);
    return data;
  } catch {
    return null;
  }
}

function deconnexion() {
  localStorage.removeItem("SAMASTORE_session");
  sessionStorage.removeItem('SAMASTORE_inscription_temp');
  sessionStorage.removeItem('SAMASTORE_connexion_phone');
  supabase.auth.signOut();
  window.location.href = "connexion.html";
}

// ================= EXPORT =================

export const authSAMASTORE = {
  envoyerOTP,
  verifierOTP,
  inscrireVendeur,
  finaliserInscription,
  connexionVendeur,
  verifierConnexion,
  getSession,
  deconnexion,
  sauvegarderSession
};
