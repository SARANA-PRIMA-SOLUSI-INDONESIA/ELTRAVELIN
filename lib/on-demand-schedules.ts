import { Prisma, PrismaClient } from "@prisma/client";

// Berapa hari ke depan jadwal boleh di-materialize on-demand.
// Ini bukan horizon pre-generate — jadwal dibuat hanya saat dicari.
export const BOOKING_WINDOW_DAYS = 30;

// Window perencanaan armada/driver (cron malam + filter default halaman jadwal driver).
export const DRIVER_PLANNING_DAYS = 14;

export function wibDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

/** Awal hari (00:00:00.000) dalam WIB untuk sebuah tanggal YYYY-MM-DD. */
export function wibStartOfDay(date: string): Date {
  return new Date(`${date}T00:00:00+07:00`);
}

/** Akhir hari (23:59:59.999) dalam WIB untuk sebuah tanggal YYYY-MM-DD. */
export function wibEndOfDay(date: string): Date {
  return new Date(`${date}T23:59:59+07:00`);
}

/** Awal hari WIB untuk sebuah Date (independen timezone proses). */
export function wibStartOfDayFor(date: Date): Date {
  return wibStartOfDay(wibDateKey(date));
}

/** Akhir hari WIB untuk sebuah Date (independen timezone proses). */
export function wibEndOfDayFor(date: Date): Date {
  return wibEndOfDay(wibDateKey(date));
}

/** Waktu hari ini (00:00 WIB) — independen timezone proses. */
export function wibTodayStart(): Date {
  return wibStartOfDayFor(new Date());
}

function isWithinWindow(departureWIB: Date): boolean {
  const todayStart = wibTodayStart();
  const windowEnd = new Date(todayStart.getTime() + BOOKING_WINDOW_DAYS * 86_400_000);
  return departureWIB.getTime() >= todayStart.getTime() && departureWIB.getTime() < windowEnd.getTime();
}

function buildTripTimes(dateStr: string, departureTime: string, arrivalTime: string) {
  const departureWIB = new Date(`${dateStr}T${departureTime}:00+07:00`);
  let arrival = new Date(`${dateStr}T${arrivalTime}:00+07:00`);
  if (arrival.getTime() < departureWIB.getTime()) {
    const next = new Date(arrival.getTime() + 86_400_000);
    arrival = next;
  }
  return { departureWIB, arrival };
}

/** Hari (0=Minggu..6=Sabtu) dalam WIB untuk tanggal YYYY-MM-DD — independen timezone proses. */
export function wibDayOfWeek(date: string): number {
  return new Date(`${date}T12:00:00+07:00`).getDay();
}

/**
 * Materialisasi on-demand untuk satu tanggal (WIB).
 * Idempotent: hanya membuat schedule/operatingTrip/seat yang belum ada.
 * Kembalikan jumlah schedule yang dibuat.
 */
export async function ensureSchedulesForDate(
  prismaInstance: PrismaClient | Prisma.TransactionClient,
  date: string
): Promise<number> {
  const prisma = prismaInstance as PrismaClient;

  // Validasi format tanggal (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 0;
  }

  const startOfDay = wibStartOfDay(date);
  const endOfDay = wibEndOfDay(date);
  const now = new Date();

  // Tidak perlu materialize tanggal di masa lalu / di luar window.
  if (startOfDay > endOfDay) return 0;
  if (endOfDay < now) return 0;
  const todayStart = wibTodayStart();
  if (startOfDay >= new Date(todayStart.getTime() + BOOKING_WINDOW_DAYS * 86_400_000)) {
    return 0;
  }

  const templates = await prisma.scheduleTemplate.findMany({
    where: { isActive: true },
    include: { route: { select: { origin: true, destination: true } } },
  });
  if (templates.length === 0) return 0;

  // Ambil schedule yang sudah ada di tanggal itu (per template+jam).
  const existing = await prisma.schedule.findMany({
    where: {
      departureTime: { gte: startOfDay, lte: endOfDay },
      isDeleted: false,
    },
    select: { templateId: true, departureTime: true },
  });
  const existingKeys = new Set(
    existing
      .filter((s) => s.templateId)
      .map((s) => `${s.templateId}|${s.departureTime.toISOString()}`)
  );

  const dayOfWeek = wibDayOfWeek(date);
  let created = 0;

  const vehicleCache = new Map<string, string>();

  for (const template of templates) {
    if (template.dayOfWeek != null && template.dayOfWeek !== dayOfWeek) {
      continue;
    }

    const { departureWIB, arrival } = buildTripTimes(date, template.departureTime, template.arrivalTime);
    if (!isWithinWindow(departureWIB)) continue;

    const key = `${template.id}|${departureWIB.toISOString()}`;
    if (existingKeys.has(key)) continue;

    const capacity = template.capacity || 15;
    let vehicleType = "Bus";
    if (template.vehicleId) {
      if (vehicleCache.has(template.vehicleId)) {
        vehicleType = vehicleCache.get(template.vehicleId)!;
      } else {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: template.vehicleId } });
        vehicleType = vehicle?.name || "Bus";
        vehicleCache.set(template.vehicleId, vehicleType);
      }
    }

    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newTrip = await tx.operatingTrip.create({
          data: {
            vehicleId: template.vehicleId || null,
            date: new Date(`${date}T12:00:00+07:00`),
            status: "SCHEDULED",
          },
        });        const seatNumbers = Array.from({ length: capacity }, (_, i) => (i + 1).toString());
        await tx.seat.createMany({
          data: seatNumbers.map((num: string) => ({
            operatingTripId: newTrip.id,
            seatNumber: num,
            status: "AVAILABLE",
          })),
        });
        await tx.schedule.create({
          data: {
            routeId: template.routeId,
            templateId: template.id,
            departureTime: departureWIB,
            arrivalTime: arrival,
            price: template.price,
            vehicleType,
            capacity,
            operatingTripId: newTrip.id,
            stopTimesJson: template.stopTimesJson,
          },
        });
      });
      existingKeys.add(key);
      created++;
    } catch (error) {
      // P2002 = unique constraint — schedule sudah dibuat proses lain (race).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        existingKeys.add(key);
        continue;
      }
      throw error;
    }
  }

  return created;
}

/** Cek apakah ada schedule untuk tanggal tsb (tanpa materialize). */
export async function hasSchedulesOnDate(prismaInstance: PrismaClient, date: string): Promise<boolean> {
  const count = await prismaInstance.schedule.count({
    where: { isDeleted: false, departureTime: { gte: wibStartOfDay(date), lte: wibEndOfDay(date) } },
  });
  return count > 0;
}

/** Daftar tanggal (YYYY-MM-DD, WIB) dari offsetMulai s/d offsetAkhir relatif hari ini. */
export function dateKeysFromToday(startOffset: number, endOffset: number): string[] {
  const todayStart = wibTodayStart();
  const keys: string[] = [];
  for (let i = startOffset; i <= endOffset; i++) {
    keys.push(wibDateKey(new Date(todayStart.getTime() + i * 86_400_000)));
  }
  return keys;
}

/** Daftar tanggal (YYYY-MM-DD, WIB) antara dua tanggal (inklusif). */
export function dateKeysBetween(from: string, to: string): string[] {
  const fromD = wibStartOfDay(from);
  const toD = wibStartOfDay(to);
  if (isNaN(fromD.getTime()) || isNaN(toD.getTime()) || fromD > toD) return [];
  const keys: string[] = [];
  for (let d = new Date(fromD); d <= toD; d = new Date(d.getTime() + 86_400_000)) {
    keys.push(wibDateKey(d));
  }
  return keys;
}
