import soap from "soap";
import crypto from "node:crypto";

const MR_API_URL = process.env.MR_API_URL;
const ENSEIGNE = process.env.MR_ENSEIGNE;
const PRIVATE_KEY = process.env.MR_PRIVATE_KEY;

// Mondial Relay utilise un champ "Security" = MD5( concat(params) + PRIVATE_KEY )
// (concat = sans séparateur, dans l’ordre exact demandé)
function md5(str) {
  return crypto.createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

/**
 * Recherche Points Relais (API SOAP)
 * Méthode courante: WSI4_PointRelais_Recherche
 */
export async function searchParcelShops({
  country = "BE",
  postCode = "",
  city = "",
  limit = 10,
}) {
  if (!MR_API_URL) throw new Error("MR_API_URL missing");
  if (!ENSEIGNE) throw new Error("MR_ENSEIGNE missing");
  if (!PRIVATE_KEY) throw new Error("MR_PRIVATE_KEY missing");

  const WSDL = `${MR_API_URL}?WSDL`;
  const client = await soap.createClientAsync(WSDL);

  // Paramètres minimaux généralement utilisés
  // Poids en grammes (ex: 1000), Action/Taille souvent "0"
  const Pays = (country || "BE").toUpperCase();
  const CP = String(postCode || "").trim();
  const Ville = String(city || "").trim();
  const NbPointRelais = Math.min(Math.max(Number(limit || 10), 1), 30);

  const Poids = "1000";
  const Action = "0";
  const Taille = "0";

  // ⚠️ L’ordre exact peut varier selon la doc MR, mais c’est typiquement :
  // Enseigne + Pays + CP + Ville + Poids + Action + Taille + NbPointRelais + PRIVATE_KEY
  const Security = md5(
    `${ENSEIGNE}${Pays}${CP}${Ville}${Poids}${Action}${Taille}${NbPointRelais}${PRIVATE_KEY}`
  );

  const args = {
    Enseigne: ENSEIGNE,
    Pays,
    CP,
    Ville,
    Poids,
    Action,
    Taille,
    NbPointRelais,
    Security,
  };

  const [result] = await client.WSI4_PointRelais_RechercheAsync(args);

  // Selon le client SOAP, la réponse peut être imbriquée :
  const data =
    result?.WSI4_PointRelais_RechercheResult ||
    result?.WSI4_PointRelais_RechercheResponse?.WSI4_PointRelais_RechercheResult ||
    result;

  // Ici on te renvoie brut + une liste simplifiée
  const points = data?.PointsRelais?.PointRelais_Details || [];

  const normalized = (Array.isArray(points) ? points : [points])
    .filter(Boolean)
    .map((p) => ({
      id: String(p.Num || p.ID || ""),
      name: p.Nom || "",
      address: `${p.Adresse1 || ""} ${p.Adresse2 || ""}`.trim(),
      city: p.Ville || "",
      postalCode: p.CP || "",
      country: p.Pays || Pays,
      lat: p.Latitude ? Number(p.Latitude) : null,
      lng: p.Longitude ? Number(p.Longitude) : null,
      hours: p.Horaires_Lundi || null, // selon les champs dispo
    }));

  return { raw: data, points: normalized };
}
