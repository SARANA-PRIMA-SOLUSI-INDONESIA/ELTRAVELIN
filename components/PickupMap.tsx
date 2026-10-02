"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PickupZone } from "@/lib/pickup";

export interface PickupMapProps {
  centerLat: number;
  centerLng: number;
  value: { lat: number; lng: number } | null;
  onChange: (value: { lat: number; lng: number }) => void;
  zones?: PickupZone[];
  showLocate?: boolean;
  className?: string;
}

const ZONE_COLORS = ["#D4AF37", "#C08A2E", "#8C6D1F", "#6B5418"];

function markerIcon() {
  return L.divIcon({
    className: "",
    html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1C1C1E;border:3px solid #D4AF37;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

export default function PickupMap({
  centerLat,
  centerLng,
  value,
  onChange,
  zones = [],
  showLocate = false,
  className,
}: PickupMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.circleMarker([centerLat, centerLng], {
      radius: 5,
      color: "#1C1C1E",
      fillColor: "#D4AF37",
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip("Titik pool");

    map.on("click", (event: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Inisialisasi map cukup sekali; perubahan koordinat ditangani effect terpisah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = zones.map((zone, index) => {
      const color = ZONE_COLORS[index % ZONE_COLORS.length];
      return L.circle([centerLat, centerLng], {
        radius: zone.maxKm * 1000,
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.06,
      })
        .addTo(map)
        .bindTooltip(
          `${zone.label} • maks ${zone.maxKm} km • Rp ${zone.feePerPax.toLocaleString("id-ID")}/pax`
        );
    });
    return () => {
      layers.forEach((layer) => layer.remove());
    };
  }, [centerLat, centerLng, zones]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng], {
        icon: markerIcon(),
        draggable: true,
      }).addTo(map);
      markerRef.current.on("dragend", () => {
        const position = markerRef.current?.getLatLng();
        if (position) onChangeRef.current({ lat: position.lat, lng: position.lng });
      });
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
  }, [value]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        onChangeRef.current(next);
        mapRef.current?.setView([next.lat, next.lng], 15);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={className || "h-72 w-full rounded-2xl overflow-hidden z-0"}
      />
      {showLocate && (
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="absolute top-3 right-3 z-[500] bg-white border border-navy-deep/10 text-navy-deep text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:border-gold-warm transition-all disabled:opacity-50"
        >
          <i className="ri-crosshair-2-line mr-1"></i>
          {locating ? "Mencari..." : "Gunakan Lokasi Saya"}
        </button>
      )}
    </div>
  );
}
