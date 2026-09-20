// Helper bersama untuk fitur Tour & Sewa.

export const TOUR_SERVICE_TYPES = ["TOUR_PACKAGE", "DAILY_RENTAL"] as const;
export type TourServiceTypeValue = (typeof TOUR_SERVICE_TYPES)[number];

export const TOUR_PRICE_UNITS = ["PER_PAX", "PER_VEHICLE", "PER_DAY"] as const;
export type TourPriceUnitValue = (typeof TOUR_PRICE_UNITS)[number];

export const TOUR_INQUIRY_STATUSES = [
  "NEW",
  "QUOTED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
] as const;

export const TOUR_QUOTE_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;

export const TOUR_PAYMENT_METHODS = ["MOOTA", "POOL", "MANUAL"] as const;
export type TourPaymentMethodValue = (typeof TOUR_PAYMENT_METHODS)[number];

export const TOUR_TYPE_LABELS: Record<string, string> = {
  TOUR_PACKAGE: "Paket Tour",
  DAILY_RENTAL: "Sewa Harian",
};

export const TOUR_PRICE_UNIT_LABELS: Record<string, string> = {
  PER_PAX: "per pax",
  PER_VEHICLE: "per unit",
  PER_DAY: "per hari",
};

export const TOUR_INQUIRY_STATUS_LABELS: Record<string, string> = {
  NEW: "Baru",
  QUOTED: "Penawaran Terkirim",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  CONVERTED: "Jadi Booking",
};

export const TOUR_QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Terkirim",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
};

export const TOUR_PAYMENT_METHOD_LABELS: Record<string, string> = {
  MOOTA: "Transfer Bank (Otomatis)",
  POOL: "Bayar di Pool / Loket",
  MANUAL: "Transfer Manual (Verifikasi Admin)",
};

/** Hanya SUPER_ADMIN & ADMIN yang boleh memberi diskon pada quote. */
export function canManageTourDiscount(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

/** Semua role admin boleh mengakses menu Tour & Sewa. */
export function canAccessTourAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "CS";
}

export function parseJsonArray<T = unknown>(raw?: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseLines(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Jumlah hari sewa (inklusif). endDate kosong dianggap 1 hari. */
export function countDays(startDate: Date, endDate?: Date | null): number {
  const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  if (!endDate) return 1;
  const end = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const diff = Math.floor((end - start) / 86_400_000) + 1;
  return diff > 0 ? diff : 1;
}

/**
 * Hitung subtotal dari harga satuan.
 * PER_PAX → harga × pax; PER_VEHICLE → harga × jumlah unit;
 * PER_DAY → harga × jumlah hari × jumlah unit.
 */
export function calcTourSubtotal(params: {
  pricePerUnit: number;
  priceUnit: string;
  paxCount: number;
  unitCount?: number;
  startDate: Date;
  endDate?: Date | null;
}): { qty: number; subtotal: number; days: number; units: number } {
  const price = Math.max(0, Math.round(params.pricePerUnit));
  const units = Math.max(1, Math.round(params.unitCount || 1));
  const days = countDays(params.startDate, params.endDate);
  const qty =
    params.priceUnit === "PER_DAY"
      ? days * units
      : params.priceUnit === "PER_VEHICLE"
        ? units
        : Math.max(1, Math.round(params.paxCount));
  return { qty, subtotal: price * qty, days, units };
}

/** Label ringkas pengali harga, mis. "2 unit × 3 hari" atau "4 pax". */
export function tourQtyLabel(params: {
  priceUnit: string;
  paxCount: number;
  unitCount: number;
  days: number;
}): string {
  const units = Math.max(1, Math.round(params.unitCount || 1));
  if (params.priceUnit === "PER_DAY") return `${units} unit × ${params.days} hari`;
  if (params.priceUnit === "PER_VEHICLE") return `${units} unit`;
  return `${Math.max(1, Math.round(params.paxCount))} pax`;
}

export function calcTourDiscount(
  subtotal: number,
  discountType?: string | null,
  discountValue?: number | null
): number {
  const value = Math.round(discountValue || 0);
  if (!discountType || value <= 0) return 0;
  const raw = discountType === "PERCENT" ? Math.round((subtotal * value) / 100) : value;
  return Math.max(0, Math.min(subtotal, raw));
}

/** Kode unik 3 digit untuk rekonsiliasi transfer bank (pola sama dengan tiket). */
export function randomUniqueCode(): number {
  return Math.floor(Math.random() * 900) + 100;
}

export function formatIDR(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatTourDate(date: Date | string, withTime = false): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  });
}
