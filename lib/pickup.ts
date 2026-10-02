// Helper bersama untuk layanan jemput (pickup) booking travel biasa.
// Berisi tipe + logika murni agar aman dipakai di client maupun server.

export const PICKUP_CONFIG_KEY = "pickupConfig";

export interface PickupZone {
  label: string;
  /** Ambang batas jarak (km) dari titik pool. Zona dipilih dari ambang terkecil yang mencakup jarak. */
  maxKm: number;
  feePerPax: number;
}

export interface PickupCity {
  name: string;
  matchKeyword: string;
  poolLat?: number;
  poolLng?: number;
  notes?: string;
  zones: PickupZone[];
}

export interface PickupConfig {
  enabled: boolean;
  cities: PickupCity[];
}

export interface PickupLocationValid {
  ok: true;
  lat: number;
  lng: number;
  distanceKm: number;
  city: PickupCity;
  zone: PickupZone;
}

export interface PickupLocationInvalid {
  ok: false;
  error: string;
}

export const DEFAULT_PICKUP_CONFIG: PickupConfig = {
  enabled: true,
  cities: [
    {
      name: "Bandung",
      matchKeyword: "Bandung",
      poolLat: -6.9197,
      poolLng: 107.6558,
      notes: "Tentukan titik jemput di peta. Alamat hanya dipakai sebagai patokan driver.",
      zones: [
        { label: "Zona 1 (0-5 km)", maxKm: 5, feePerPax: 15000 },
        { label: "Zona 2 (5-10 km)", maxKm: 10, feePerPax: 25000 },
        { label: "Zona 3 (10-20 km)", maxKm: 20, feePerPax: 40000 },
      ],
    },
    {
      name: "Jakarta",
      matchKeyword: "Jakarta, Soekarno Hatta",
      poolLat: -6.229,
      poolLng: 106.83,
      notes: "Tentukan titik jemput di peta. Alamat hanya dipakai sebagai patokan driver.",
      zones: [
        { label: "Zona 1 (0-5 km)", maxKm: 5, feePerPax: 20000 },
        { label: "Zona 2 (5-10 km)", maxKm: 10, feePerPax: 35000 },
        { label: "Zona 3 (10-20 km)", maxKm: 20, feePerPax: 50000 },
      ],
    },
  ],
};

function toNumber(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function sanitizeCoord(value: unknown, min: number, max: number): number | undefined {
  const num = toNumber(value);
  if (num === null || num < min || num > max) return undefined;
  return num;
}

function sanitizeZone(raw: unknown): PickupZone | null {
  if (!raw || typeof raw !== "object") return null;
  const zone = raw as Record<string, unknown>;
  const label = typeof zone.label === "string" ? zone.label.trim() : "";
  const maxKm = toNumber(zone.maxKm ?? zone.radiusKm);
  if (!label || maxKm === null || maxKm <= 0) return null;
  const feePerPax = Math.max(0, Math.round(toNumber(zone.feePerPax) ?? 0));
  return { label, maxKm: Math.round(maxKm * 10) / 10, feePerPax };
}

function sanitizeCity(raw: unknown): PickupCity | null {
  if (!raw || typeof raw !== "object") return null;
  const city = raw as Record<string, unknown>;
  const name = typeof city.name === "string" ? city.name.trim() : "";
  if (!name) return null;
  const matchKeyword =
    typeof city.matchKeyword === "string" && city.matchKeyword.trim()
      ? city.matchKeyword.trim()
      : name;
  const notes = typeof city.notes === "string" ? city.notes.trim() : "";
  const zonesRaw = Array.isArray(city.zones)
    ? city.zones.map(sanitizeZone).filter((zone): zone is PickupZone => Boolean(zone))
    : [];
  const zones = zonesRaw
    .sort((a, b) => a.maxKm - b.maxKm)
    .filter((zone, index, arr) => index === 0 || zone.maxKm !== arr[index - 1].maxKm);
  if (zones.length === 0) return null;
  return {
    name,
    matchKeyword,
    poolLat: sanitizeCoord(city.poolLat, -90, 90),
    poolLng: sanitizeCoord(city.poolLng, -180, 180),
    notes: notes || undefined,
    zones,
  };
}

/** Validasi + normalisasi konfigurasi (dipakai server saat menyimpan & memuat). */
export function mergePickupConfig(raw: unknown): PickupConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_PICKUP_CONFIG;
  const data = raw as Record<string, unknown>;
  const enabled = typeof data.enabled === "boolean" ? data.enabled : DEFAULT_PICKUP_CONFIG.enabled;
  const cities = Array.isArray(data.cities)
    ? data.cities.map(sanitizeCity).filter((city): city is PickupCity => Boolean(city))
    : [];
  if (cities.length === 0) return { enabled, cities: DEFAULT_PICKUP_CONFIG.cities };
  return { enabled, cities };
}

/**
 * Cari kota layanan jemput dari teks keberangkatan (origin rute dan/atau titik naik).
 * `matchKeyword` boleh berisi beberapa kata kunci dipisah koma, contoh:
 * "Jakarta, Soekarno Hatta".
 */
export function findPickupCity(
  config: PickupConfig | null | undefined,
  routeOrigin?: string | null,
  boardingPoint?: string | null
): PickupCity | null {
  if (!config?.enabled) return null;
  const haystack = [routeOrigin, boardingPoint]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" | ")
    .toLowerCase();
  if (!haystack) return null;

  return (
    config.cities.find((city) =>
      city.matchKeyword
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean)
        .some((keyword) => haystack.includes(keyword))
    ) || null
  );
}

export function hasPoolCoords(
  city: PickupCity | null | undefined
): city is PickupCity & { poolLat: number; poolLng: number } {
  return Boolean(
    city && Number.isFinite(city.poolLat) && Number.isFinite(city.poolLng)
  );
}

export function findPickupZone(
  city: PickupCity | null | undefined,
  zoneLabel?: string | null
): PickupZone | null {
  if (!city || !zoneLabel) return null;
  return city.zones.find((zone) => zone.label === zoneLabel) || null;
}

export function calcPickupFee(zone: PickupZone | null | undefined, paxCount: number): number {
  if (!zone) return 0;
  const pax = Math.max(1, Math.round(paxCount || 1));
  return Math.max(0, Math.round(zone.feePerPax)) * pax;
}

/** Jarak garis lurus (km) antara dua koordinat, dibulatkan 1 desimal. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
}

export function maxPickupRadiusKm(city: PickupCity): number {
  return city.zones.reduce((max, zone) => Math.max(max, zone.maxKm), 0);
}

/** Zona ditentukan otomatis dari jarak; null berarti di luar area layanan. */
export function resolvePickupZoneByDistance(
  city: PickupCity | null | undefined,
  distanceKm: number
): PickupZone | null {
  if (!city || !Number.isFinite(distanceKm)) return null;
  const km = Math.max(0, distanceKm);
  for (const zone of [...city.zones].sort((a, b) => a.maxKm - b.maxKm)) {
    if (km <= zone.maxKm) return zone;
  }
  return null;
}

/** Validasi lokasi jemput di server — sumber kebenaran, jangan percaya input client. */
export function validatePickupLocation(
  config: PickupConfig | null | undefined,
  routeOrigin: string | null | undefined,
  lat: unknown,
  lng: unknown,
  boardingPoint?: string | null
): PickupLocationValid | PickupLocationInvalid {
  const city = findPickupCity(config, routeOrigin, boardingPoint);
  if (!city) return { ok: false, error: "Layanan jemput belum tersedia untuk rute ini." };
  if (!hasPoolCoords(city)) {
    return { ok: false, error: `Titik pool ${city.name} belum diatur oleh admin.` };
  }

  const parsedLat = toNumber(lat);
  const parsedLng = toNumber(lng);
  if (
    parsedLat === null ||
    parsedLng === null ||
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLng < -180 ||
    parsedLng > 180
  ) {
    return { ok: false, error: "Koordinat lokasi jemput tidak valid." };
  }

  const distanceKm = haversineKm(parsedLat, parsedLng, city.poolLat, city.poolLng);
  const zone = resolvePickupZoneByDistance(city, distanceKm);
  if (!zone) {
    return {
      ok: false,
      error: `Lokasi berada di luar area penjemputan ${city.name} (± ${distanceKm} km, maks ${maxPickupRadiusKm(city)} km).`,
    };
  }

  return { ok: true, lat: parsedLat, lng: parsedLng, distanceKm, city, zone };
}

/** Hitung ulang biaya jemput dari data tersimpan (reschedule / edit booking). */
export function recalcPickupFee(
  config: PickupConfig | null | undefined,
  cityName?: string | null,
  zoneLabel?: string | null,
  paxCount = 1,
  distanceKm?: number | null
): number {
  if (!config || !cityName) return 0;
  const city = config.cities.find((item) => item.name === cityName) || null;
  if (!city) return 0;
  if (typeof distanceKm === "number" && Number.isFinite(distanceKm)) {
    return calcPickupFee(resolvePickupZoneByDistance(city, distanceKm), paxCount);
  }
  return calcPickupFee(findPickupZone(city, zoneLabel), paxCount);
}

export function formatPickupDistance(distanceKm?: number | null): string {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm)) return "-";
  return `${distanceKm.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;
}

export function formatPickupFee(fee: number): string {
  return `Rp ${Math.round(fee).toLocaleString("id-ID")}`;
}
