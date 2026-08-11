"use server";

import { prisma } from "@/lib/prisma";
import { syncSchedulesFromTemplates } from "@/lib/schedule-generator";
import { revalidatePath } from "next/cache";

export async function createRoute(origin: string, destination: string) {
  const originClean = origin.trim();
  const destClean = destination.trim();

  const existing = await prisma.route.findFirst({
    where: {
      origin: originClean,
      destination: destClean,
      isDeleted: false
    }
  });

  if (existing) {
    throw new Error("Rute dengan asal dan tujuan tersebut sudah terdaftar!");
  }

  const route = await prisma.route.create({
    data: { origin: originClean, destination: destClean }
  });
  revalidatePath("/admin/master");
  revalidatePath("/");
  revalidatePath("/routes");
  return route;
}

export async function deleteRoute(id: string) {
  const route = await prisma.route.findUnique({ where: { id } });
  if (!route) throw new Error("Rute tidak ditemukan.");

  const schedules = await prisma.schedule.findMany({
    where: { routeId: id },
    select: { id: true }
  });

  if (schedules.length > 0) {
    const activeBookings = await prisma.booking.count({
      where: {
        scheduleId: { in: schedules.map(s => s.id) },
        status: { notIn: ['CANCELLED'] }
      }
    });

    if (activeBookings > 0) {
      throw new Error(
        `Rute tidak dapat dihapus karena masih memiliki ${activeBookings} booking aktif. ` +
        `Batalkan atau selesaikan booking tersebut terlebih dahulu.`
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.scheduleTemplate.updateMany({ where: { routeId: id }, data: { isActive: false } });
    await tx.route.update({ where: { id }, data: { isDeleted: true } });
  });

  revalidatePath("/admin/master");
  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/routes");
}

export async function updateRoute(id: string, origin: string, destination: string) {
  await prisma.route.update({
    where: { id },
    data: { origin, destination }
  });
  revalidatePath("/admin/master");
  revalidatePath("/");
  revalidatePath("/routes");
}

// --- Template Actions ---

export async function createTemplate(data: {
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  capacity: number;
  vehicleId?: string;
  dayOfWeek?: number;
}) {
  const template = await prisma.scheduleTemplate.create({
    data: {
      routeId: data.routeId,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      price: data.price,
      capacity: data.capacity,
      vehicleId: data.vehicleId || null,
      dayOfWeek: data.dayOfWeek ?? null,
      isActive: true
    }
  });
  revalidatePath("/admin/master");
  revalidatePath("/");
  revalidatePath("/routes");
  return template;
}

export async function updateTemplateStatus(id: string, isActive: boolean) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    await tx.scheduleTemplate.update({
      where: { id },
      data: { isActive }
    });
    if (!isActive) {
      await tx.schedule.updateMany({
        where: {
          templateId: id,
          departureTime: { gte: today }
        },
        data: { isDeleted: true }
      });
    } else {
      await tx.schedule.updateMany({
        where: {
          templateId: id,
          departureTime: { gte: today }
        },
        data: { isDeleted: false }
      });
    }
  });
  revalidatePath("/admin/master");
  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/routes");
}

// --- Vehicle Actions ---

export async function getVehicles() {
  return prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });
}

export async function deleteTemplate(id: string) {
  await prisma.$transaction(async (tx) => {
    await tx.schedule.updateMany({
      where: { templateId: id },
      // Jadwal yang sudah dibuat tetap dipertahankan untuk histori/booking,
      // tetapi harus dilepas dari template sebelum template dihapus.
      data: { isDeleted: true, templateId: null }
    });
    await tx.scheduleTemplate.delete({ where: { id } });
  });
  revalidatePath("/admin/master");
  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/routes");
}

// --- Sync Action ---

export async function triggerSyncSchedules(days: number = 7) {
  await syncSchedulesFromTemplates(prisma as any, days);
  revalidatePath("/admin/schedules");
  revalidatePath("/admin/master");
  revalidatePath("/");
  revalidatePath("/routes");
}

// --- Schedule Specific Actions ---

export async function updateScheduleStatus(id: string, isActive: boolean) {
  await prisma.schedule.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/routes");
}

export async function deleteSchedule(id: string) {
  try {
    await prisma.schedule.delete({
      where: { id }
    });
    revalidatePath("/admin/schedules");
    revalidatePath("/");
    revalidatePath("/routes");
  } catch (error: any) {
    if (error.code === 'P2003' || (error.message && error.message.includes("Foreign key constraint"))) {
      throw new Error("Jadwal tidak dapat dihapus secara permanen karena sudah memiliki transaksi/booking aktif.");
    }
    throw error;
  }
}

// --- RouteStop Actions ---

export async function createRouteStop(routeId: string, name: string, sequence: number, stopTime?: string, price?: number) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get all stops with sequence >= input sequence, ordered descending
    const stopsToShift = await tx.routeStop.findMany({
      where: {
        routeId,
        isDeleted: false,
        sequence: { gte: sequence }
      },
      orderBy: {
        sequence: "desc"
      }
    });

    // 2. Shift each stop one-by-one in descending order
    for (const stop of stopsToShift) {
      await tx.routeStop.update({
        where: { id: stop.id },
        data: { sequence: stop.sequence + 1 }
      });
    }

    // 3. Create the new stop
    const newStop = await tx.routeStop.create({
      data: {
        routeId,
        name,
        sequence,
        stopTime: stopTime || null,
        price: price || 0
      }
    });

    return newStop;
  });

  try {
    revalidatePath("/admin/master");
    revalidatePath("/");
    revalidatePath("/routes");
  } catch (e) { }
  return result;
}

export async function deleteRouteStop(id: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const stop = await tx.routeStop.findUnique({ where: { id } });
      if (!stop) return { success: false as const, error: "Titik singgah tidak ditemukan." };

      // Soft delete: stop hilang dari UI baru, tetapi tetap ada untuk histori BookingSegment.
      await tx.routeStop.update({ where: { id }, data: { isActive: false, isDeleted: true } });

      return { success: true as const };
    });

    if (!result.success) return result;

    revalidatePath("/admin/master");
    revalidatePath("/");
    revalidatePath("/routes");
    return result;
  } catch {
    return {
      success: false as const,
      error: "Titik singgah gagal dihapus. Silakan coba lagi.",
    };
  }
}

export async function reorderRouteStops(routeId: string, orderedIds: string[]) {
  await prisma.$transaction(async (tx) => {
    // Step 1: Temporarily negate all sequences to free up positive integers
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.routeStop.update({
        where: { id: orderedIds[i] },
        data: { sequence: -(i + 1) }
      });
    }

    // Step 2: Apply the final positive sequences in order
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.routeStop.update({
        where: { id: orderedIds[i] },
        data: { sequence: i + 1 }
      });
    }
  });

  try {
    revalidatePath("/admin/master");
    revalidatePath("/");
    revalidatePath("/routes");
  } catch (e) { }
}

export async function updateRouteStopStatus(id: string, isActive: boolean) {
  const result = await prisma.routeStop.updateMany({
    where: { id, isDeleted: false },
    data: { isActive }
  });

  try {
    revalidatePath("/admin/master");
    revalidatePath("/");
    revalidatePath("/routes");
  } catch (e) { }

  return result.count > 0;
}

export async function getRouteById(id: string) {
  return prisma.route.findUnique({
    where: { id },
    include: {
      stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } },
      scheduleTemplates: { orderBy: { departureTime: 'asc' } }
    }
  });
}

export async function getRouteWithStops(id: string) {
  return prisma.route.findUnique({
    where: { id },
    include: {
      stops: {
        where: { isDeleted: false },
        orderBy: { sequence: 'asc' }
      }
    }
  });
}

export async function updateTemplate(id: string, data: {
  departureTime: string;
  arrivalTime: string;
  price: number;
  capacity: number;
  vehicleId?: string;
  dayOfWeek?: number;
}) {
  await prisma.scheduleTemplate.update({
    where: { id },
    data: {
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      price: data.price,
      capacity: data.capacity,
      vehicleId: data.vehicleId || null,
      dayOfWeek: data.dayOfWeek ?? null,
    }
  });
  revalidatePath("/admin/master");
  revalidatePath("/");
  revalidatePath("/routes");
}

export async function getTemplateById(id: string) {
  return prisma.scheduleTemplate.findUnique({
    where: { id },
    include: {
      vehicle: true,
      route: {
        include: {
          stops: { where: { isDeleted: false }, orderBy: { sequence: "asc" } }
        }
      }
    }
  });
}

export async function getTemplateWithStops(templateId: string) {
  return prisma.scheduleTemplate.findUnique({
    where: { id: templateId },
    include: {
      vehicle: true,
      route: {
        include: {
          stops: { where: { isDeleted: false }, orderBy: { sequence: "asc" } }
        }
      }
    }
  });
}

export async function updateTemplateStopTimes(templateId: string, stopTimesJson: string) {
  // 1. Update the template
  const template = await prisma.scheduleTemplate.update({
    where: { id: templateId },
    data: { stopTimesJson }
  });

  // 2. Update all future generated schedules from this template (WIB departureTime >= today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.schedule.updateMany({
    where: {
      templateId,
      departureTime: { gte: today }
    },
    data: { stopTimesJson }
  });

  revalidatePath("/admin/master");
  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/routes");
  return template;
}
