"use server";

import { prisma } from "@/lib/prisma";
import { syncSchedulesFromTemplates } from "@/lib/schedule-generator";
import { revalidatePath } from "next/cache";

// --- Route Actions ---

export async function createRoute(origin: string, destination: string) {
  const route = await prisma.route.create({
    data: { origin, destination }
  });
  revalidatePath("/admin/master");
  revalidatePath("/");
  revalidatePath("/routes");
  return route;
}

export async function deleteRoute(id: string) {
  // Soft delete for reports and data integrity
  await prisma.route.update({
    where: { id },
    data: { isDeleted: true }
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
  vehicleId: string;
}) {
  const template = await prisma.scheduleTemplate.create({
    data: {
      routeId: data.routeId,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      price: data.price,
      vehicleId: data.vehicleId,
      isActive: true
    }
  });
  revalidatePath("/admin/master");
  revalidatePath("/");
  revalidatePath("/routes");
  return template;
}

export async function updateTemplateStatus(id: string, isActive: boolean) {
  await prisma.scheduleTemplate.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath("/admin/master");
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
  await prisma.scheduleTemplate.delete({ where: { id } });
  revalidatePath("/admin/master");
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
  // Soft delete for safety
  await prisma.schedule.update({
    where: { id },
    data: { isDeleted: true }
  });
  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/routes");
}

// --- RouteStop Actions ---

export async function createRouteStop(routeId: string, name: string, sequence: number, stopTime?: string, price?: number) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get all stops with sequence >= input sequence, ordered descending
    const stopsToShift = await tx.routeStop.findMany({
      where: {
        routeId,
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
  } catch (e) {}
  return result;
}

export async function deleteRouteStop(id: string) {
  await prisma.$transaction(async (tx) => {
    const stop = await tx.routeStop.findUnique({ where: { id } });
    if (!stop) return;

    // 1. Delete the stop
    await tx.routeStop.delete({ where: { id } });

    // 2. Shift all subsequent stops by -1 to close the gap
    await tx.routeStop.updateMany({
      where: {
        routeId: stop.routeId,
        sequence: { gt: stop.sequence }
      },
      data: {
        sequence: { decrement: 1 }
      }
    });
  });

  try {
    revalidatePath("/admin/master");
    revalidatePath("/");
    revalidatePath("/routes");
  } catch (e) {}
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
  } catch (e) {}
}

export async function getRouteWithStops(id: string) {
  return prisma.route.findUnique({
    where: { id },
    include: {
      stops: {
        orderBy: { sequence: 'asc' }
      }
    }
  });
}
