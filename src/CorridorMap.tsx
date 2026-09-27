import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CORRIDOR, STOPS, type Report } from "./model";
import { freshnessOf, isUnverified, statusLabel } from "./labels";

interface Props {
  reports: Report[];
  selectedId: string | null;
  pendingPin: { lat: number; lng: number } | null;
  onSelect: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onTilesFailed?: () => void;
}

export function CorridorMap({
  reports,
  selectedId,
  pendingPin,
  onSelect,
  onMapClick,
  onTilesFailed,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const failedRef = useRef(false);
  const clickRef = useRef(onMapClick);
  const tilesFailRef = useRef(onTilesFailed);
  clickRef.current = onMapClick;
  tilesFailRef.current = onTilesFailed;

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const map = L.map(hostRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    map.setView([19.401, -99.194], 15);

    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap · mapa de fondo, no es seguimiento en vivo",
    });
    tiles.on("tileerror", () => {
      if (!failedRef.current) {
        failedRef.current = true;
        tilesFailRef.current?.();
      }
    });
    tiles.addTo(map);

    L.polyline(CORRIDOR, {
      color: "#0f5c4c",
      weight: 6,
      opacity: 0.85,
    }).addTo(map);

    STOPS.forEach((stop) => {
      L.circleMarker([stop.lat, stop.lng], {
        radius: 5,
        color: "#0f5c4c",
        fillColor: "#fff",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(stop.label, { permanent: false })
        .addTo(map);
    });

    layersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      clickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layersRef.current;
    if (!group) return;
    group.clearLayers();

    reports.forEach((report) => {
      const selected = report.id === selectedId;
      const unverified = isUnverified(report.verificationStatus);
      const stale = freshnessOf(report.createdAt) === "stale";
      const color = unverified
        ? "#c45c12"
        : report.verificationStatus === "action_closed"
          ? "#5c6570"
          : "#0f5c4c";
      const marker = L.circleMarker([report.lat, report.lng], {
        radius: selected ? 11 : 8,
        color,
        fillColor: stale ? "#d7dbe0" : color,
        fillOpacity: 0.9,
        weight: selected ? 3 : 2,
      });
      marker.bindPopup(
        `<strong>${report.id}</strong><br/>${statusLabel(report.verificationStatus)}<br/>DEMO / SIMULATED DATA`,
      );
      marker.on("click", () => onSelect(report.id));
      marker.addTo(group);
    });

    if (pendingPin) {
      L.circleMarker([pendingPin.lat, pendingPin.lng], {
        radius: 9,
        color: "#1d4f91",
        fillColor: "#4d8ddb",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip("Ubicación del nuevo reporte", { permanent: true })
        .addTo(group);
    }
  }, [reports, selectedId, pendingPin, onSelect]);

  return (
    <div
      ref={hostRef}
      className="map-host"
      role="img"
      aria-label="Mapa del corredor DEMO Tacubaya-Observatorio"
    />
  );
}
