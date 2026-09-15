import express from "express";
import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";

const router = express.Router();

const MR_API_URL =
  process.env.MR_API_URL?.trim() || "https://api.mondialrelay.com/WebService.asmx";

const MR_ENSEIGNE = (process.env.MR_ENSEIGNE || "").trim();
const MR_PRIVATE_KEY = (process.env.MR_PRIVATE_KEY || "").trim();

/**
 * Mondial Relay "Security" :
 * Security = MD5(
 *  Enseigne + Pays + NumPointRelais + Ville + CP + Latitude + Longitude +
 *  Taille + Poids + Action + DelaiEnvoi + RayonRecherche + TypeActivite + NACE + ClePrivee
 * ).toUpperCase()
 */
function buildSecurity({
  Enseigne,
  Pays,
  NumPointRelais,
  Ville,
  CP,
  Latitude,
  Longitude,
  Taille,
  Poids,
  Action,
  DelaiEnvoi,
  RayonRecherche,
  TypeActivite,
  NACE,
  ClePrivee,
}) {
  const raw = [
    Enseigne,
    Pays,
    NumPointRelais,
    Ville,
    CP,
    Latitude,
    Longitude,
    Taille,
    Poids,
    Action,
    DelaiEnvoi,
    RayonRecherche,
    TypeActivite,
    NACE,
    ClePrivee,
  ].join("");

  return crypto.createHash("md5").update(raw, "utf8").digest("hex").toUpperCase();
}

function escapeXml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSoapEnvelope(params) {
  // SOAP 1.1
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI3_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${escapeXml(params.Enseigne)}</Enseigne>
      <Pays>${escapeXml(params.Pays)}</Pays>
      <NumPointRelais>${escapeXml(params.NumPointRelais)}</NumPointRelais>
      <Ville>${escapeXml(params.Ville)}</Ville>
      <CP>${escapeXml(params.CP)}</CP>
      <Latitude>${escapeXml(params.Latitude)}</Latitude>
      <Longitude>${escapeXml(params.Longitude)}</Longitude>
      <Taille>${escapeXml(params.Taille)}</Taille>
      <Poids>${escapeXml(params.Poids)}</Poids>
      <Action>${escapeXml(params.Action)}</Action>
      <DelaiEnvoi>${escapeXml(params.DelaiEnvoi)}</DelaiEnvoi>
      <RayonRecherche>${escapeXml(params.RayonRecherche)}</RayonRecherche>
      <TypeActivite>${escapeXml(params.TypeActivite)}</TypeActivite>
      <NACE>${escapeXml(params.NACE)}</NACE>
      <Security>${escapeXml(params.Security)}</Security>
    </WSI3_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`;
}

function normalizePoint(p) {
  // p vient du XML MR (PointRelais_Details)
  const id = String(p?.Num ?? "").trim();
  if (!id) return null;

  const addressParts = [
    p?.LgAdr1,
    p?.LgAdr2,
    p?.LgAdr3,
    p?.LgAdr4,
  ]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);

  return {
    id,
    name: String(p?.LgAdr1 ?? "").trim() || null,
    address: addressParts.join(", ") || null,
    city: String(p?.Ville ?? "").trim() || null,
    postalCode: String(p?.CP ?? "").trim() || null,
    country: String(p?.Pays ?? "").trim() || null,
    latitude: p?.Latitude != null ? String(p.Latitude).trim() : null,
    longitude: p?.Longitude != null ? String(p.Longitude).trim() : null,
    distance: p?.Distance != null ? String(p.Distance).trim() : null,
  };
}

/**
 * GET /api/mondial-relay/points?country=BE&postcode=6044&city=Roux&limit=10&radius=10
 */
router.get("/points", async (req, res) => {
  try {
    if (!MR_ENSEIGNE || !MR_PRIVATE_KEY) {
      return res.status(500).json({
        error:
          "Mondial Relay non configuré: MR_ENSEIGNE et/ou MR_PRIVATE_KEY manquant(s) dans .env",
      });
    }

    const country = String(req.query.country || "").trim().toUpperCase();
    const postcode = String(req.query.postcode || "").trim();
    const city = String(req.query.city || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 10) || 10, 1), 30);
    const radius = String(req.query.radius || "10").trim(); // 10 km par défaut

    if (!country) return res.status(400).json({ error: "country est requis" });
    if (!postcode || postcode.length < 4) {
      return res.status(400).json({ error: "postcode invalide (min 4 caractères)" });
    }

    // Paramètres MR (on garde simple)
    const soapParams = {
      Enseigne: MR_ENSEIGNE,
      Pays: country,
      NumPointRelais: "", // vide => recherche
      Ville: city,
      CP: postcode,
      Latitude: "",
      Longitude: "",
      Taille: "",
      Poids: "",
      Action: "", // selon besoins (ex: "REL")
      DelaiEnvoi: "",
      RayonRecherche: radius,
      TypeActivite: "",
      NACE: "",
    };

    soapParams.Security = buildSecurity({
      ...soapParams,
      ClePrivee: MR_PRIVATE_KEY,
    });

    const xml = buildSoapEnvelope(soapParams);

    const response = await fetch(MR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://www.mondialrelay.fr/webservice/WSI3_PointRelais_Recherche",
      },
      body: xml,
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        error: "Erreur Mondial Relay (HTTP)",
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      });
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      // évite de transformer tout en nombres, on préfère string
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
    });

    const data = parser.parse(text);

    // Chemin typique SOAP 1.1 :
    // Envelope -> Body -> WSI3_PointRelais_RechercheResponse -> WSI3_PointRelais_RechercheResult
    const body =
      data?.["soap:Envelope"]?.["soap:Body"] ||
      data?.["Envelope"]?.["Body"] ||
      data?.["soapenv:Envelope"]?.["soapenv:Body"];

    const resp =
      body?.["WSI3_PointRelais_RechercheResponse"] ||
      body?.["m:WSI3_PointRelais_RechercheResponse"] ||
      body?.["WSI3_PointRelais_RechercheResponse".toLowerCase()];

    const result =
      resp?.["WSI3_PointRelais_RechercheResult"] ||
      resp?.["m:WSI3_PointRelais_RechercheResult"];

    // PointsRelais peut contenir un seul PointRelais_Details ou un tableau
    const pointsRelais = result?.["PointsRelais"];
    const details = pointsRelais?.["PointRelais_Details"];

    const arr = Array.isArray(details) ? details : details ? [details] : [];

    // Normalisation + filtrage des points valides
    const points = arr
      .map(normalizePoint)
      .filter(Boolean)
      .slice(0, limit);

    return res.json({
      points,
      meta: {
        country,
        postcode,
        city: city || null,
        limit,
        radius,
      },
    });
  } catch (e) {
    console.error("MondialRelay /points error:", e);
    return res.status(500).json({
      error: e?.message || "Erreur serveur Mondial Relay",
    });
  }
});

export default router;
