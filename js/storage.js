import { supabase } from './config.js';

export const storage = {
    /**
     * Uploade une image de produit dans le bucket 'products'
     * @param {File} file - Le fichier à uploader
     * @returns {Promise<{url: string, error: string}>}
     */
    async uploadProductImage(file) {
        try {
            // Vérifier le type
            if (!file.type.startsWith('image/')) {
                throw new Error('Le fichier doit être une image');
            }

            // Vérifier la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('L\'image ne doit pas dépasser 5MB');
            }

            // Créer un nom unique : timestamp_random.ext
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload
            const { data, error } = await supabase.storage
                .from('products')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Erreur upload:', error);
            return { url: null, error: error.message };
        }
    }
};
