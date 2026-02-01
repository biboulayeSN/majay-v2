
export default {
  async fetch(request) {
    // Récupérer le pays depuis les headers Cloudflare
    // cf-ipcountry est le header standard ajouté par Cloudflare
    // request.cf.country est accessible dans les Workers
    const country = request.cf?.country || request.headers.get("cf-ipcountry");
    // Fallback pour les tests locaux ou si le header est manquant
    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";

    // Données de réponse par défaut
    let responseData = {
      country: country || "SN", // Par défaut Sénégal
      ip: clientIp,
      timestamp: Date.now(),
      provider: "cloudflare"
    };

    // Ajouter des métadonnées supplémentaires si disponibles via l'objet .cf
    if (request.cf) {
      responseData = {
        ...responseData,
        city: request.cf.city,
        region: request.cf.region,
        regionCode: request.cf.regionCode,
        latitude: request.cf.latitude,
        longitude: request.cf.longitude,
        timezone: request.cf.timezone,
        continent: request.cf.continent,
        asn: request.cf.asn,
        organization: request.cf.asOrganization
      };
    }

    const json = JSON.stringify(responseData, null, 2);

    return new Response(json, {
      headers: {
        "content-type": "application/json;charset=UTF-8",
        // Permettre l'accès depuis n'importe quelle origine (CORS)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  },
};
