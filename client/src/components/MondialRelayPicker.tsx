// client/src/components/MondialRelayPicker.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { theme } from "../config/theme";
import {
  mondialRelayService,
  type RelayPoint,
} from "../services/mondialRelayService";

const GOOGLE_LIBRARIES: (
  | "marker"
  | "places"
  | "geometry"
  | "drawing"
  | "visualization"
)[] = ["marker"];

type Props = {
  brandCode: string;
  country: string;
  postCode: string;
  city?: string;
  onSelect: (relay: {
    id: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
  }) => void;
};

function toNumber(v: any) {
  if (v == null) return null;
  const s = String(v).trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function fmtAddress(p: RelayPoint) {
  const bits = [
    p.address,
    [p.postalCode, p.city].filter(Boolean).join(" "),
    p.country,
  ].filter(Boolean);
  return bits.join(", ");
}

/**
 * ✅ Fix distance display
 * MR renvoie parfois:
 * - des mètres (ex: "834")
 * - des km (ex: "2.073")
 * - ou des formats bizarres selon l’implémentation côté parsing
 *
 * Stratégie pragmatique:
 * - si value >= 1000 et pas de décimales => probablement mètres (ex: 2073m)
 * - si value < 100 => probablement km (ex: 2.07km)
 * - si value entre 100 et 999 => probablement mètres (ex: 834m)
 */
function formatDistanceSmart(distanceRaw: any): string | null {
  if (distanceRaw == null) return null;

  // accepte "834", "2.073", "2,073", etc.
  const s = String(distanceRaw).trim().replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) return null;

  // Cas très fréquent : MR renvoie des mètres
  // Ex: 834 -> 834m
  if (n >= 100 && n < 1000) return `${Math.round(n)} m`;

  // Ex: 2073 -> 2073m -> 2.07km
  if (n >= 1000) {
    const km = n / 1000;
    return `${km.toFixed(2)} km`;
  }

  // n < 100 : souvent c'est déjà des km (ex 2.07)
  // On affiche en km mais si < 1 => en mètres
  if (n < 1) return `${Math.round(n * 1000)} m`;
  return `${n.toFixed(2)} km`;
}

export function MondialRelayPicker({
  country,
  postCode,
  city,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [points, setPoints] = useState<RelayPoint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ✅ pour afficher le box détails (InfoWindow)
  const [infoOpenId, setInfoOpenId] = useState<string | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY as string,
    libraries: GOOGLE_LIBRARIES,
  });

  // 1) fetch points
  useEffect(() => {
    const pc = (postCode || "").trim();
    const ctry = (country || "").trim().toUpperCase();

    if (!ctry || pc.length < 4) {
      setPoints([]);
      setSelectedId(null);
      setInfoOpenId(null);
      setErr(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await mondialRelayService.listPoints({
          country: ctry,
          postcode: pc,
          city: (city || "").trim() || undefined,
          limit: 15,
        });

        if (cancelled) return;

        const pts = (res.points || []).filter(Boolean);
        setPoints(pts);

        const firstId = pts.length ? pts[0].id : null;
        setSelectedId(firstId);
        setInfoOpenId(null);
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || "Impossible de charger les points relais.");
        setPoints([]);
        setSelectedId(null);
        setInfoOpenId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [country, postCode, city]);

  const pointsWithCoords = useMemo(() => {
    return points
      .map((p) => {
        const lat = toNumber(p.latitude);
        const lng = toNumber(p.longitude);
        return { p, lat, lng };
      })
      .filter((x) => x.lat != null && x.lng != null) as {
      p: RelayPoint;
      lat: number;
      lng: number;
    }[];
  }, [points]);

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedId) || null,
    [points, selectedId],
  );

  const infoPoint = useMemo(
    () => points.find((p) => p.id === infoOpenId) || null,
    [points, infoOpenId],
  );

  const infoLatLng = useMemo(() => {
    if (!infoPoint) return null;
    const lat = toNumber(infoPoint.latitude);
    const lng = toNumber(infoPoint.longitude);
    if (lat == null || lng == null) return null;
    return { lat, lng };
  }, [infoPoint]);

  const mapCenter = useMemo(() => {
    if (selectedPoint) {
      const lat = toNumber(selectedPoint.latitude);
      const lng = toNumber(selectedPoint.longitude);
      if (lat != null && lng != null) return { lat, lng };
    }
    if (pointsWithCoords.length)
      return { lat: pointsWithCoords[0].lat, lng: pointsWithCoords[0].lng };
    return { lat: 50.8503, lng: 4.3517 };
  }, [selectedPoint, pointsWithCoords]);

  const onChoose = (p: RelayPoint, openInfo = false) => {
    setSelectedId(p.id);

    onSelect({
      id: p.id,
      name: p.name ?? null,
      address: p.address ?? null,
      city: p.city ?? null,
      postalCode: p.postalCode ?? null,
      country: p.country ?? null,
    });

    if (openInfo) setInfoOpenId(p.id);
  };

  // 2) markers update (re-run when points change)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!isLoaded) return;

    // clear old markers
    markersRef.current.forEach((m) => {
      try {
        // AdvancedMarkerElement: m.map = null
        // Marker: m.setMap(null)
        if (m?.setMap) m.setMap(null);
        else if (m && typeof m === "object") m.map = null;
      } catch {}
    });
    markersRef.current = [];

    if (!pointsWithCoords.length) return;

    // fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    pointsWithCoords.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds);

    pointsWithCoords.forEach(({ p, lat, lng }) => {
      const hasAdvanced =
        // @ts-ignore
        !!window.google?.maps?.marker?.AdvancedMarkerElement;

      if (hasAdvanced) {
        // @ts-ignore
        const adv = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat, lng },
          title: p.name || p.id,
        });

        // ✅ IMPORTANT: event AdvancedMarker = "gmp-click"
        // @ts-ignore
        adv.addEventListener("gmp-click", () => onChoose(p, true));

        markersRef.current.push(adv);
      } else {
        const mk = new window.google.maps.Marker({
          map,
          position: { lat, lng },
          title: p.name || p.id,
        });
        mk.addListener("click", () => onChoose(p, true));
        markersRef.current.push(mk);
      }
    });
  }, [isLoaded, pointsWithCoords]);

  const mapOptions = useMemo(() => {
    const mapId = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID;
    return {
      mapId: mapId || undefined,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
    } as google.maps.MapOptions;
  }, []);

  return (
    <div style={{ display: "grid", gap: theme.spacing.md }}>
      <div style={{ fontSize: 13, color: theme.colors.text.secondary }}>
        Entrez un code postal complet (ex: 6044), puis choisissez un Point
        Relais.
      </div>

      {loadError && (
        <div
          style={{
            padding: 12,
            border: `1px solid ${theme.colors.error.main}`,
            backgroundColor: theme.colors.error[50],
            color: theme.colors.error.main,
            borderRadius: theme.borderRadius.md,
          }}
        >
          Erreur Google Maps: {String(loadError)}
        </div>
      )}

      {err && (
        <div
          style={{
            padding: 12,
            border: `1px solid ${theme.colors.error.main}`,
            backgroundColor: theme.colors.error[50],
            color: theme.colors.error.main,
            borderRadius: theme.borderRadius.md,
          }}
        >
          {err}
        </div>
      )}

      {loading && (
        <div style={{ fontSize: 13, color: theme.colors.text.secondary }}>
          Chargement des points relais...
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: theme.spacing.md,
        }}
        className="mr-grid"
      >
        {/* LISTE */}
        <div
          style={{
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.borderRadius.lg,
            overflow: "hidden",
            background: theme.colors.background.secondary,
          }}
        >
          <div
            style={{
              padding: theme.spacing.md,
              borderBottom: `1px solid ${theme.colors.border.light}`,
            }}
          >
            <b>Points relais trouvés</b> ({points.length})
          </div>

          <div style={{ maxHeight: 320, overflow: "auto" }}>
            {!points.length ? (
              <div
                style={{
                  padding: theme.spacing.md,
                  color: theme.colors.text.secondary,
                }}
              >
                Aucun point relais trouvé pour ce code postal.
              </div>
            ) : (
              points.map((p) => {
                const active = p.id === selectedId;
                const distText = formatDistanceSmart(p.distance);

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onChoose(p, true); // ✅ ouvre aussi le box
                      // recentre doucement sur le point si possible
                      const lat = toNumber(p.latitude);
                      const lng = toNumber(p.longitude);
                      if (mapRef.current && lat != null && lng != null) {
                        mapRef.current.panTo({ lat, lng });
                        mapRef.current.setZoom(
                          Math.max(mapRef.current.getZoom() || 12, 13),
                        );
                      }
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: theme.spacing.md,
                      border: "none",
                      background: active
                        ? theme.colors.background.sage
                        : "transparent",
                      cursor: "pointer",
                      borderBottom: `1px solid ${theme.colors.border.light}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {p.name || `Point Relais ${p.id}`}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      {fmtAddress(p)}
                    </div>

                    {distText && (
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.colors.text.light,
                          marginTop: 4,
                        }}
                      >
                        Distance: {distText}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* MAP */}
        <div
          style={{
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.borderRadius.lg,
            overflow: "hidden",
            background: "#fff",
            minHeight: 360,
          }}
        >
          {!isLoaded ? (
            <div
              style={{
                padding: theme.spacing.md,
                color: theme.colors.text.secondary,
              }}
            >
              Chargement de Google Maps...
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: 360 }}
              center={mapCenter}
              zoom={12}
              options={mapOptions}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              onUnmount={() => {
                mapRef.current = null;
                markersRef.current.forEach((m) => {
                  try {
                    if (m && typeof m === "object") m.map = null;
                  } catch {}
                });
                markersRef.current = [];
              }}
              onClick={() => setInfoOpenId(null)} // ✅ clic map = fermer
            >
              {/* ✅ Petit box détails */}
              {infoPoint && infoLatLng && (
                <InfoWindow
                  position={infoLatLng}
                  onCloseClick={() => setInfoOpenId(null)}
                >
                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      {infoPoint.name || `Point Relais ${infoPoint.id}`}
                    </div>
                    <div style={{ fontSize: 13, color: "#333" }}>
                      {fmtAddress(infoPoint)}
                    </div>

                    {formatDistanceSmart(infoPoint.distance) && (
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                        Distance: {formatDistanceSmart(infoPoint.distance)}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onChoose(infoPoint, false);
                        setInfoOpenId(null);
                      }}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: `1px solid ${theme.colors.border.light}`,
                        background: theme.colors.background.sage,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Choisir ce point relais
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .mr-grid {
            grid-template-columns: 1fr 1.4fr !important;
          }
        }
      `}</style>
    </div>
  );
}
