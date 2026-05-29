"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllVehicles() {
  return prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createVehicle(data: {
  name: string;
  plateNumber: string;
  capacity: number;
}) {
  const plateNormalized = data.plateNumber.trim().toUpperCase();

  // Validate plate number uniqueness
  const existing = await prisma.vehicle.findUnique({
    where: { plateNumber: plateNormalized },
  });

  if (existing) {
    throw new Error("Plat nomor sudah terdaftar!");
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      name: data.name.trim(),
      plateNumber: plateNormalized,
      capacity: Math.round(data.capacity),
      isActive: true,
    },
  });

  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/master"); // In case templates dropdown needs it
  return vehicle;
}

export async function updateVehicleStatus(id: string, isActive: boolean) {
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/master");
  return vehicle;
}

export async function deleteVehicle(id: string) {
  try {
    const vehicle = await prisma.vehicle.delete({
      where: { id },
    });

    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/master");
    return vehicle;
  } catch (error: any) {
    // If the error code is foreign key constraint violation (Prisma P2003)
    if (error.code === "P2003" || (error.message && error.message.includes("Foreign key constraint"))) {
      throw new Error(
        "Armada tidak dapat dihapus karena sudah digunakan di Jadwal Master atau Perjalanan Harian. Anda bisa menonaktifkannya saja."
      );
    }
    throw error;
  }
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
  });
}

export async function updateVehicle(
  id: string,
  data: {
    name: string;
    plateNumber: string;
    capacity: number;
  }
) {
  const plateNormalized = data.plateNumber.trim().toUpperCase();

  // Validate that no other vehicle has this plate number
  const existing = await prisma.vehicle.findFirst({
    where: {
      plateNumber: plateNormalized,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Plat nomor sudah terdaftar pada armada lain!");
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      name: data.name.trim(),
      plateNumber: plateNormalized,
      capacity: Math.round(data.capacity),
    },
  });

  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/master");
  return vehicle;
}
