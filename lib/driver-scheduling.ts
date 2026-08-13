// Driver scheduling engine: feasibility rules + auto-assignment.
// Dipakai bersama oleh assign manual, auto-assign, dan cron agar logika konsisten.

export const DRIVER_RULES = {
  PRE_TRIP_BUFFER_MINUTES: 30,
  MIN_REST_AT_DEST_MINUTES: 60,
  MIN_OVERNIGHT_REST_HOURS: 8,
  MAX_CONSECUTIVE_WORK_DAYS: 6,
  MAX_DUTY_HOURS_PER_DAY: 12,
};

export const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export type ConflictType = "HARD" | "SOFT";

export interface AssignmentConflict {
  type: ConflictType;
  message: string;
}

export interface DriverTrip {
  id: string;
  departureTime: Date;
  arrivalTime: Date;
  origin: string;
  destination: string;
}

export interface DriverTripWithHours extends DriverTrip {
  durationMinutes: number;
}

const MINUTE = 60_000;
const DAY = 86_400_000;

export function gapMinutes(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / MINUTE;
}

export function wibDayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}

export function wibDayOfWeek(d: Date): number {
  return new Date(wibDayKey(d) + "T12:00:00+07:00").getDay();
}

/** Lokasi driver = destinasi trip terakhir yang berangkat sebelum refTime. */
export function getDriverLocation(trips: DriverTrip[], ref: Date): string | null {
  const prior = trips
    .filter((t) => t.departureTime.getTime() <= ref.getTime())
    .sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
  return prior.length > 0 ? prior[prior.length - 1].destination : null;
}

/**
 * Engine feasibilitas. Mengembalikan konflik pertama (HARD/SOFT) atau null jika aman.
 * - HARD: mustahil secara fisik (bentrok waktu, lokasi tidak cocok) — tidak bisa di-override.
 * - SOFT: kebijakan (libur mingguan, istirahat kurang, jam kerja) — bisa di-override admin.
 */
export function findAssignmentConflict(
  history: DriverTripWithHours[],
  trip: DriverTripWithHours,
  options?: { restDayOfWeek?: number | null }
): AssignmentConflict | null {
  // 1) Bentrok waktu dengan buffer persiapan
  const prepStart = new Date(trip.departureTime.getTime() - DRIVER_RULES.PRE_TRIP_BUFFER_MINUTES * MINUTE);
  for (const t of history) {
    if (prepStart < t.arrivalTime && trip.arrivalTime > t.departureTime) {
      return {
        type: "HARD",
        message: `Bentrok waktu dengan ${t.origin} → ${t.destination} (${t.departureTime.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })})`,
      };
    }
  }

  // 2) Lokasi: driver harus sudah berada di titik asal trip
  const location = getDriverLocation(history, trip.departureTime);
  if (location && location !== trip.origin) {
    return {
      type: "HARD",
      message: `Driver masih berada di ${location}, bukan ${trip.origin}. Tugaskan trip balik ke ${trip.origin} terlebih dahulu.`,
    };
  }

  // 3) Istirahat (turnaround same-day / overnight)
  const prior = [...history]
    .filter((t) => t.departureTime.getTime() < trip.departureTime.getTime())
    .sort((a, b) => b.departureTime.getTime() - a.departureTime.getTime())[0];
  if (prior) {
    const gap = gapMinutes(prior.arrivalTime, trip.departureTime);
    const sameDay = wibDayKey(prior.arrivalTime) === wibDayKey(trip.departureTime);
    if (sameDay && gap < DRIVER_RULES.MIN_REST_AT_DEST_MINUTES) {
      return {
        type: "SOFT",
        message: `Istirahat kurang: tiba ${prior.arrivalTime.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} lalu berangkat ${Math.max(0, Math.round(gap))} menit kemudian.`,
      };
    }
    if (!sameDay && gap < DRIVER_RULES.MIN_OVERNIGHT_REST_HOURS * 60) {
      return {
        type: "SOFT",
        message: `Istirahat bermalam kurang dari ${DRIVER_RULES.MIN_OVERNIGHT_REST_HOURS} jam.`,
      };
    }
  }

  // 4) Libur mingguan (restDayOfWeek) — 1 hari libur per minggu
  if (options?.restDayOfWeek != null) {
    const tripDay = wibDayOfWeek(trip.departureTime);
    if (tripDay === options.restDayOfWeek) {
      return {
        type: "SOFT",
        message: `Driver libur mingguan (${DAY_NAMES[options.restDayOfWeek]}). Pilih driver lain atau override.`,
      };
    }
  }

  // 5) Pengaman: maksimal 6 hari kerja berturut-turut dalam 7 hari terakhir
  const tripDayKey = wibDayKey(trip.departureTime);
  const windowStart = new Date(trip.departureTime.getTime() - 6 * DAY);
  const workedDays = new Set(
    history
      .filter(
        (t) =>
          t.departureTime.getTime() >= windowStart.getTime() &&
          t.departureTime.getTime() <= trip.departureTime.getTime()
      )
      .map((t) => wibDayKey(t.departureTime))
  );
  if (workedDays.size >= DRIVER_RULES.MAX_CONSECUTIVE_WORK_DAYS && !workedDays.has(tripDayKey)) {
    return {
      type: "SOFT",
      message: `Driver sudah bekerja ${DRIVER_RULES.MAX_CONSECUTIVE_WORK_DAYS} hari berturut-turut; hari ini (${DAY_NAMES[wibDayOfWeek(trip.departureTime)]}) harus libur.`,
    };
  }

  // 6) Batas jam bertugas harian (WIB)
  if (trip.durationMinutes > 0) {
    const tripDayKey2 = wibDayKey(trip.departureTime);
    const dutyTrips = history.filter((t) => wibDayKey(t.departureTime) === tripDayKey2);
    const duty = dutyTrips.reduce((sum, t) => sum + t.durationMinutes, 0) + trip.durationMinutes;
    if (duty > DRIVER_RULES.MAX_DUTY_HOURS_PER_DAY * 60) {
      return {
        type: "SOFT",
        message: `Total jam bertugas hari ini (${Math.round(duty / 60)} jam) melebihi ${DRIVER_RULES.MAX_DUTY_HOURS_PER_DAY} jam.`,
      };
    }
  }

  return null;
}

/**
 * Helper untuk assign manual: HARD selalu ditolak; SOFT ditolak kecuali override=true.
 */
export function checkDriverFeasibility(
  history: DriverTripWithHours[],
  trip: DriverTripWithHours,
  options?: { restDayOfWeek?: number | null; override?: boolean }
): AssignmentConflict | null {
  const conflict = findAssignmentConflict(history, trip, options);
  if (!conflict) return null;
  if (conflict.type === "HARD") return conflict;
  if (options?.override) return null;
  return conflict;
}
