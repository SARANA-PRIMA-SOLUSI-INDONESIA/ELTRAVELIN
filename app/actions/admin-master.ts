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
  return route;
}

export async function deleteRoute(id: string) {
  // Check if there are any templates/bookings first? 
  // For now just delete (Prisma will throw if there's a constraint)
  await prisma.route.delete({ where: { id } });
  revalidatePath("/admin/master");
}

// --- Template Actions ---

export async function createTemplate(data: {
  routeId: string;
  departureTime: string;
  price: number;
  vehicleType: string;
  capacity: number;
}) {
  const template = await prisma.scheduleTemplate.create({
    data: {
      ...data,
      isActive: true
    }
  });
  revalidatePath("/admin/master");
  return template;
}

export async function updateTemplateStatus(id: string, isActive: boolean) {
  await prisma.scheduleTemplate.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath("/admin/master");
}

export async function deleteTemplate(id: string) {
  await prisma.scheduleTemplate.delete({ where: { id } });
  revalidatePath("/admin/master");
}

// --- Sync Action ---

export async function triggerSyncSchedules(days: number = 7) {
  await syncSchedulesFromTemplates(prisma as any, days);
  revalidatePath("/admin/schedules");
  revalidatePath("/admin/master");
}

// --- Schedule Specific Actions ---

export async function updateScheduleStatus(id: string, isActive: boolean) {
  await prisma.schedule.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath("/admin/schedules");
}

export async function deleteSchedule(id: string) {
  // Soft delete for safety
  await prisma.schedule.update({
    where: { id },
    data: { isDeleted: true }
  });
  revalidatePath("/admin/schedules");
}
