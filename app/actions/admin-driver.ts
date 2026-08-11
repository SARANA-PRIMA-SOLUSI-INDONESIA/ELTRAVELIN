"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function clean(value?: string) {
  const result = value?.trim();
  return result || null;
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

export async function createDriver(data: { name: string; phone?: string; licenseNo?: string }) {
  const name = data.name.trim();
  if (!name) throw new Error("Nama driver wajib diisi");
  const driver = await prisma.driver.create({ data: { name, phone: clean(data.phone), licenseNo: clean(data.licenseNo) } });
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/driver-schedules");
  return driver;
}

export async function updateDriver(id: string, data: { name: string; phone?: string; licenseNo?: string; isActive: boolean }) {
  const name = data.name.trim();
  if (!name) throw new Error("Nama driver wajib diisi");
  const driver = await prisma.driver.update({
    where: { id },
    data: { name, phone: clean(data.phone), licenseNo: clean(data.licenseNo), isActive: data.isActive },
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

export async function assignDriverForRouteDeparture(scheduleId: string, driverId: string | null) {
  const selectedSchedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: { id: true, routeId: true, isDeleted: true, departureTime: true, arrivalTime: true, operatingTripId: true },
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
    const conflict = await prisma.schedule.findFirst({
      where: {
        id: { notIn: schedules.map((schedule) => schedule.id) }, isDeleted: false,
        OR: schedules.map((schedule) => ({ departureTime: { lt: schedule.arrivalTime }, arrivalTime: { gt: schedule.departureTime } })),
        operatingTrip: { driverId },
      },
      include: { route: { select: { origin: true, destination: true } } },
      orderBy: { departureTime: "asc" },
    });
    if (conflict) {
      throw new Error(`Driver sudah bertugas pada ${conflict.departureTime.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} untuk rute ${conflict.route.origin} → ${conflict.route.destination}.`);
    }
  }

  await prisma.operatingTrip.updateMany({
    where: { id: { in: schedules.map((schedule) => schedule.operatingTripId as string) } },
    data: { driverId },
  });
  revalidatePath("/admin/driver-schedules");
  revalidatePath("/admin/schedules");
}
