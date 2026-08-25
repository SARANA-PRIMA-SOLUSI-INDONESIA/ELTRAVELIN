"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPromo(data: {
  code: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  showOnCheckout?: boolean;
}) {
  const promo = await prisma.promoCode.create({
    data: {
      ...data,
      discountValue: Math.round(data.discountValue),
      minOrder: Math.round(data.minOrder),
      maxDiscount: data.maxDiscount ? Math.round(data.maxDiscount) : undefined,
      usageLimit: data.usageLimit ? Math.round(data.usageLimit) : undefined,
      code: data.code.toUpperCase(),
      isActive: true,
      showOnCheckout: data.showOnCheckout || false,
    } as any
  });
  revalidatePath("/admin/promos");
  return promo;
}

export async function updatePromoStatus(id: string, isActive: boolean) {
  await prisma.promoCode.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath("/admin/promos");
}

export async function updatePromoShowStatus(id: string, showOnCheckout: boolean) {
  await prisma.promoCode.update({
    where: { id },
    data: { showOnCheckout }
  });
  revalidatePath("/admin/promos");
}

export async function deletePromo(id: string) {
  await prisma.$transaction(async (tx) => {
    const promo = await tx.promoCode.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!promo) throw new Error("Kode promo tidak ditemukan");

    // Booking lama tetap dipertahankan, tetapi tidak boleh masih
    // mereferensikan promo yang akan dihapus.
    await tx.booking.updateMany({
      where: { promoCodeId: id },
      data: { promoCodeId: null },
    });

    await tx.promoCode.delete({ where: { id } });
  });
  revalidatePath("/admin/promos");
}

export async function getPromoById(id: string) {
  return prisma.promoCode.findUnique({ where: { id } });
}

export async function updatePromo(id: string, data: {
  code: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  minOrder: number;
  maxDiscount?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  usageLimit?: number | null;
  showOnCheckout?: boolean;
}) {
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) throw new Error("Kode promo tidak ditemukan");

  // Cek bentrok kode unik (jika kode diubah) terhadap promo lain.
  const newCode = data.code.toUpperCase();
  if (newCode !== promo.code) {
    const existing = await prisma.promoCode.findUnique({ where: { code: newCode } });
    if (existing) throw new Error("Kode promo sudah digunakan oleh promo lain.");
  }

  await prisma.promoCode.update({
    where: { id },
    data: {
      code: newCode,
      discountType: data.discountType,
      discountValue: Math.round(data.discountValue),
      minOrder: Math.round(data.minOrder),
      maxDiscount: data.maxDiscount ? Math.round(data.maxDiscount) : null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      usageLimit: data.usageLimit ? Math.round(data.usageLimit) : null,
      showOnCheckout: data.showOnCheckout ?? false,
    }
  });
  revalidatePath("/admin/promos");
}
