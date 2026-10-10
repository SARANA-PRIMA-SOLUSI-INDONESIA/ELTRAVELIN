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
  /** Dipanggil saat alamat terdeteksi (search / reverse dari pin). */
  onAddressChange?: (address: string) => void;
  zones?: PickupZone[];
  showLocate?: boolean;
  showAddressSearch?: boolean;
  className?: string;
}

const ZONE_COLORS = ["#D4AF37", "#C08A2E", "#8C6D1F", "#6B5418"];

type SearchHit = { lat: number; lng: number; label: string };

function markerIcon() {
  return L.divIcon({
    className: "",
    html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1C1C1E;border:3px solid #D4AF37;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

async function reverseAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { label?: string | null };
    return data.label || null;
  } catch {
    return null;
  }
}

export default function PickupMap({
  centerLat,
  centerLng,
  value,
  onChange,
  onAddressChange,
  zones = [],
  showLocate = false,
  showAddressSearch = false,
  className,
}: PickupMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const onAddressChangeRef = useRef(onAddressChange);
  onChangeRef.current = onChange;
  onAddressChangeRef.current = onAddressChange;
  const skipReverseRef = useRef(false);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const applyPoint = async (point: { lat: number; lng: number }, opts?: { address?: string; pan?: boolean }) => {
    if (opts?.address) {
      skipReverseRef.current = true;
      onAddressChangeRef.current?.(opts.address);
    }
    onChangeRef.current(point);
    if (opts?.pan) mapRef.current?.setView([point.lat, point.lng], 16);
  };

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
      void applyPoint({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
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
        if (position) void applyPoint({ lat: position.lat, lng: position.lng });
      });
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
  }, [value]);

  // Reverse-geocode when pin moves (skip if address already set from search).
  useEffect(() => {
    if (!value || !onAddressChangeRef.current) return;
    if (skipReverseRef.current) {
      skipReverseRef.current = false;
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void reverseAddress(value.lat, value.lng).then((label) => {
        if (!cancelled && label) onAddressChangeRef.current?.(label);
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    if (!showAddressSearch) return;
    const q = query.trim();
    if (q.length < 3) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q,
          nearLat: String(centerLat),
          nearLng: String(centerLng),
        });
        const res = await fetch(`/api/geocode?${params}`);
        const data = (await res.json()) as { results?: SearchHit[] };
        if (!cancelled) setHits(data.results || []);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, showAddressSearch, centerLat, centerLng]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void applyPoint(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          { pan: true }
        );
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative flex flex-col gap-2">
      {showAddressSearch && (
        <div className="relative z-[600]">
          <div className="relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari alamat / nama tempat…"
              className="w-full bg-white border border-navy-deep/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none"
              autoComplete="off"
            />
            {searching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                …
              </span>
            )}
          </div>
          {hits.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-outline-ghost rounded-xl shadow-lg">
              {hits.map((hit) => (
                <li key={`${hit.lat},${hit.lng},${hit.label}`}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 text-xs text-navy-deep hover:bg-surface-low border-b border-outline-ghost last:border-0"
                    onClick={() => {
                      void applyPoint(
                        { lat: hit.lat, lng: hit.lng },
                        { address: hit.label, pan: true }
                      );
                      setQuery(hit.label);
                      setHits([]);
                    }}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
    </div>
  );
}
