"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  checkDriverFeasibility,
  findAssignmentConflict,
  type DriverTripWithHours,
} from "@/lib/driver-scheduling";
import { ensureSchedulesForDate, dateKeysBetween, wibStartOfDay, wibEndOfDay } from "@/lib/on-demand-schedules";
import type { Route, Schedule, OperatingTrip } from "@prisma/client";

function clean(value?: string) {
  const result = value?.trim();
  return result || null;
}

const MINUTE = 60_000;

type ScheduleWithRoute = Schedule & { route: Pick<Route, "origin" | "destination">; operatingTrip?: Pick<OperatingTrip, "driverId"> | null };

function toTrip(schedule: ScheduleWithRoute): DriverTripWithHours {
  return {
    id: schedule.id,
    departureTime: schedule.departureTime,
    arrivalTime: schedule.arrivalTime,
    origin: schedule.route.origin,
    destination: schedule.route.destination,
    durationMinutes: (schedule.arrivalTime.getTime() - schedule.departureTime.getTime()) / MINUTE,
  };
}

// Sebar hari libur round-robin (0=Minggu..6=Sabtu) untuk driver baru.
function pickRestDay(count: number): number {
  // Sedikit bias agar libur tidak semua di Minggu/Sabtu.
  return (count * 2 + 1) % 7;
}

export async function getDrivers() {
  return prisma.driver.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { operatingTrips: true } } },
  });
}

export async function getDriversPage(page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { operatingTrips: true } } },
    }),
    prisma.driver.count(),
  ]);

  return { drivers, total };
}

export async function createDriver(data: { name: string; phone?: string; licenseNo?: string; restDayOfWeek?: number | null }) {
  const name = data.name.trim();
  if (!name) throw new Error("Nama driver wajib diisi");
  const driverCount = await prisma.driver.count();
  const driver = await prisma.driver.create({
    data: {
      name,
      phone: clean(data.phone),
      licenseNo: clean(data.licenseNo),
      restDayOfWeek: data.restDayOfWeek ?? pickRestDay(driverCount),
    },
  });
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/driver-schedules");
  return driver;
}

export async function updateDriver(id: string, data: { name: string; phone?: string; licenseNo?: string; isActive: boolean; restDayOfWeek?: number | null }) {
  const name = data.name.trim();
  if (!name) throw new Error("Nama driver wajib diisi");
  const driver = await prisma.driver.update({
    where: { id },
    data: {
      name,
      phone: clean(data.phone),
      licenseNo: clean(data.licenseNo),
      isActive: data.isActive,
      restDayOfWeek: data.restDayOfWeek ?? null,
    },
  });
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/driver-schedules");
  return driver;
}

export async function deleteDriver(id: string) {
  await prisma.driver.delete({ where: { id } });
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/driver-schedules");
}

export async function assignDriverForRouteDeparture(scheduleId: string, driverId: string | null, override = false) {
  const selectedSchedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      routeId: true,
      isDeleted: true,
      departureTime: true,
      arrivalTime: true,
      operatingTripId: true,
      route: { select: { origin: true, destination: true } },
    },
  });
  if (!selectedSchedule || selectedSchedule.isDeleted || !selectedSchedule.operatingTripId) {
    throw new Error("Jadwal tidak tersedia untuk penugasan driver");
  }

  const schedules = await prisma.schedule.findMany({
    where: { isDeleted: false, routeId: selectedSchedule.routeId, departureTime: selectedSchedule.departureTime },
    select: { id: true, departureTime: true, arrivalTime: true, operatingTripId: true },
  });
  if (schedules.length === 0 || schedules.some((schedule) => !schedule.operatingTripId)) {
    throw new Error("Jadwal tidak tersedia untuk penugasan driver");
  }

  if (driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver || !driver.isActive) throw new Error("Driver tidak aktif atau tidak ditemukan");

    const historyRows = await prisma.schedule.findMany({
      where: {
        isDeleted: false,
        operatingTrip: { driverId },
        departureTime: { lt: selectedSchedule.departureTime },
      },
      include: { route: { select: { origin: true, destination: true } } },
      orderBy: { departureTime: "asc" },
    });
    const history = historyRows.map(toTrip);

    const conflict = checkDriverFeasibility(
      history,
      {
        id: selectedSchedule.id,
        departureTime: selectedSchedule.departureTime,
        arrivalTime: selectedSchedule.arrivalTime,
        origin: selectedSchedule.route.origin,
        destination: selectedSchedule.route.destination,
        durationMinutes: (selectedSchedule.arrivalTime.getTime() - selectedSchedule.departureTime.getTime()) / MINUTE,
      },
      { restDayOfWeek: driver.restDayOfWeek, override }
    );
    if (conflict) {
      throw new Error(conflict.message);
    }
  }

  await prisma.operatingTrip.updateMany({
    where: { id: { in: schedules.map((schedule) => schedule.operatingTripId as string) } },
    data: { driverId },
  });
  revalidatePath("/admin/driver-schedules");
  revalidatePath("/admin/schedules");
}

// ========== AUTO ASSIGN ==========

export async function autoAssignDrivers(from: string, to: string) {
  const fromD = wibStartOfDay(from);
  const toD = wibEndOfDay(to);
  if (isNaN(fromD.getTime()) || isNaN(toD.getTime()) || fromD > toD) {
    throw new Error("Rentang tanggal tidak valid");
  }

  // Materialize jadwal untuk seluruh rentang dulu, sehingga Auto Assign
  // membuat jadwal sekaligus menugaskan driver (tanpa menunggu customer/cron).
  for (const key of dateKeysBetween(from, to)) {
    await ensureSchedulesForDate(prisma, key);
  }

  const [drivers, trips] = await Promise.all([
    prisma.driver.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.schedule.findMany({
      where: {
        isDeleted: false,
        departureTime: { gte: fromD, lte: toD },
        template: { isActive: true },
      },
      include: { route: { select: { origin: true, destination: true } }, operatingTrip: true },
      orderBy: { departureTime: "asc" },
    }),
  ]);

  if (drivers.length === 0) {
    return { assigned: 0, skipped: [], skippedCount: 0, message: "Tidak ada driver aktif" };
  }

  // Backfill restDayOfWeek untuk driver yang belum punya hari libur.
  let idx = 0;
  for (const d of drivers) {
    if (d.restDayOfWeek == null) {
      d.restDayOfWeek = pickRestDay(idx++);
      await prisma.driver.update({ where: { id: d.id }, data: { restDayOfWeek: d.restDayOfWeek } });
    }
  }

  // Riwayat driver sebelum range (untuk lokasi lintas hari) + yang pernah bertugas di range.
  const prior = await prisma.schedule.findMany({
    where: {
      isDeleted: false,
      departureTime: { lt: fromD },
      operatingTrip: { driverId: { in: drivers.map((d) => d.id) } },
    },
    include: {
      route: { select: { origin: true, destination: true } },
      operatingTrip: { select: { driverId: true } },
    },
    orderBy: { departureTime: "asc" },
  });

  const history: Record<string, DriverTripWithHours[]> = {};
  const load = new Map<string, number>();
  for (const d of drivers) {
    history[d.id] = [];
    load.set(d.id, 0);
  }
  for (const p of prior) {
    if (!p.operatingTrip?.driverId) continue;
    (history[p.operatingTrip.driverId] ??= []).push(toTrip(p));
    load.set(p.operatingTrip.driverId, (load.get(p.operatingTrip.driverId) ?? 0) + 1);
  }

  // Group per (routeId, departureTime) — konsisten dengan assign manual.
  const groups = new Map<string, typeof trips>();
  for (const s of trips) {
    const key = `${s.routeId}|${s.departureTime.toISOString()}`;
    const list = groups.get(key);
    if (list) list.push(s);
    else groups.set(key, [s]);
  }

  // Sudah ditugaskan manual di range → lewati (jangan timpa keputusan admin).
  const alreadyAssigned = new Set<string>();
  for (const s of trips) {
    if (s.operatingTrip?.driverId) {
      const key = `${s.routeId}|${s.departureTime.toISOString()}`;
      alreadyAssigned.add(key);
    }
  }

  let assigned = 0;
  const skipped: string[] = [];

  const sortedGroups = [...groups.entries()]
    .sort((a, b) => new Date(a[1][0].departureTime).getTime() - new Date(b[1][0].departureTime).getTime());

  for (const [key, g] of sortedGroups) {
    if (alreadyAssigned.has(key)) continue;

    const origin = g[0].route.origin;
    const destination = g[0].route.destination;
    const departureTime = g[0].departureTime;
    const arrivalTime = new Date(Math.max(...g.map((s) => s.arrivalTime.getTime())));

    const candidates = [...drivers]
      .sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0))
      .filter((d) => {
        const conflict = findAssignmentConflict(history[d.id] ?? [], {
          id: g[0].id,
          departureTime,
          arrivalTime,
          origin,
          destination,
          durationMinutes: (arrivalTime.getTime() - departureTime.getTime()) / MINUTE,
        }, { restDayOfWeek: d.restDayOfWeek });
        return !conflict;
      });

    if (candidates.length === 0) {
      skipped.push(`${origin} → ${destination} ${departureTime.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}`);
      continue;
    }

    const chosen = candidates[0];
    await prisma.operatingTrip.updateMany({
      where: { id: { in: g.map((s) => s.operatingTripId).filter(Boolean) as string[] } },
      data: { driverId: chosen.id },
    });

    history[chosen.id] = [...(history[chosen.id] ?? []), {
      id: g[0].id,
      departureTime,
      arrivalTime,
      origin,
      destination,
      durationMinutes: (arrivalTime.getTime() - departureTime.getTime()) / MINUTE,
    }];
    load.set(chosen.id, (load.get(chosen.id) ?? 0) + 1);
    assigned++;
  }

  revalidatePath("/admin/driver-schedules");
  revalidatePath("/admin/schedules");

  return {
    assigned,
    skipped,
    skippedCount: skipped.length,
    message: skipped.length > 0
      ? `${assigned} trip ditugaskan, ${skipped.length} trip dilewati (kurang driver / semua driver libur / lokasi tidak cocok).`
      : `${assigned} trip berhasil ditugaskan otomatis.`,
  };
}
