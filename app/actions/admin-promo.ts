"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPromo(data: {
  code: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
}) {
  const promo = await prisma.promoCode.create({
    data: {
      ...data,
      code: data.code.toUpperCase(),
      isActive: true
    }
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

export async function deletePromo(id: string) {
  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promos");
}
