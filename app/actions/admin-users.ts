"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

async function checkAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getAdmins() {
  await checkAuth();
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return admins;
}

export async function createAdmin(data: { email: string; password: string; name: string }) {
  await checkAuth();

  const existing = await prisma.admin.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email sudah digunakan");

  const passwordHash = await bcrypt.hash(data.password, 10);

  await prisma.admin.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
    },
  });

  return { success: true };
}

export async function updateAdmin(id: string, data: { name?: string; password?: string }) {
  const session = await checkAuth();

  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw new Error("Admin tidak ditemukan");

  const updateData: Record<string, string> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

  if (Object.keys(updateData).length === 0) throw new Error("Tidak ada data yang diubah");

  await prisma.admin.update({
    where: { id },
    data: updateData,
  });

  return { success: true };
}

export async function deleteAdmin(id: string) {
  const session = await checkAuth();

  const count = await prisma.admin.count();
  if (count <= 1) throw new Error("Tidak dapat menghapus admin terakhir");

  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw new Error("Admin tidak ditemukan");

  await prisma.admin.delete({ where: { id } });

  return { success: true };
}
