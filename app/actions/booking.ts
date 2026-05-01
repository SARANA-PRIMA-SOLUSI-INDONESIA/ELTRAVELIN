"use server";

import { prisma } from "@/lib/prisma";

export async function getSchedules(origin: string, destination: string, date: string) {
  const searchDate = new Date(date);
  const nextDay = new Date(searchDate);
  nextDay.setDate(searchDate.getDate() + 1);

  return prisma.schedule.findMany({
    where: {
      route: {
        origin: { contains: origin, mode: 'insensitive' },
        destination: { contains: destination, mode: 'insensitive' },
      },
      departureTime: {
        gte: searchDate,
        lt: nextDay,
      },
      isActive: true,
      isDeleted: false,
    },
    include: {
      route: true,
      _count: {
        select: {
          seats: {
            where: { status: 'AVAILABLE' }
          }
        }
      }
    },
    orderBy: {
      departureTime: 'asc',
    },
  });
}

export async function getScheduleById(id: string) {
  return prisma.schedule.findUnique({
    where: { id },
    include: {
      route: true,
      seats: {
        orderBy: { seatNumber: 'asc' }
      }
    }
  });
}

export async function updatePaymentMethod(bookingCode: string, paymentMethod: string) {
  return prisma.booking.update({
    where: { bookingCode },
    data: { paymentMethod }
  });
}

export async function validatePromoCode(code: string, totalAmount: number) {
  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase(), isActive: true }
  });

  if (!promo) return { valid: false, message: "Kode promo tidak ditemukan", discount: 0 };
  if (totalAmount < promo.minOrder) return { valid: false, message: `Minimal pemesanan Rp ${promo.minOrder.toLocaleString('id-ID')}`, discount: 0 };

  let discount = 0;
  if (promo.discountType === 'FIXED') {
    discount = promo.discountValue;
  } else {
    discount = (totalAmount * promo.discountValue) / 100;
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  }

  return { valid: true, discount, promoId: promo.id };
}

export async function createBooking(data: {
  scheduleId: string;
  contactName: string;
  contactEmail?: string;
  contactPhone: string;
  passengerNames: string[];
  seatNumbers: string[];
  promoCodeId?: string;
  paymentMethod?: string;
}) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
    include: { route: true }
  });

  if (!schedule) throw new Error("Jadwal tidak ditemukan");

  const basePrice = schedule.price * data.seatNumbers.length;
  let discountAmount = 0;

  if (data.promoCodeId) {
    const promoVal = await validatePromoCodeById(data.promoCodeId, basePrice);
    if (promoVal.valid) {
      discountAmount = promoVal.discount;
    }
  }

  // Generate unique code for Moota verification (random 3 digits)
  const uniqueCode = Math.floor(100 + Math.random() * 899);
  const totalPrice = (basePrice - discountAmount) + uniqueCode;
  const bookingCode = `EL-${Math.floor(100000 + Math.random() * 900000)}-${data.seatNumbers[0]}`;

  return prisma.$transaction(async (tx: any) => {
    // 1. Create the booking
    const booking = await tx.booking.create({
      data: {
        bookingCode,
        scheduleId: data.scheduleId,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        totalPrice,
        discountAmount,
        promoCodeId: data.promoCodeId,
        paymentMethod: data.paymentMethod || 'UNSET',
        status: 'PENDING',
        // Still keep these for basic compatibility or empty them
        passengerName: data.passengerNames[0],
        passengerPhone: data.contactPhone,
        passengerEmail: data.contactEmail,
        // Create passengers
        passengers: {
          create: data.passengerNames.map(name => ({ name }))
        }
      },
    });

    // 2. Update all selected seats status
    await Promise.all(data.seatNumbers.map(num => 
      tx.seat.update({
        where: {
          scheduleId_seatNumber: {
            scheduleId: data.scheduleId,
            seatNumber: num,
          },
        },
        data: {
          status: 'BOOKED',
          bookingId: booking.id,
        },
      })
    ));

    return booking;
  });
}

// Helper for internal use
async function validatePromoCodeById(id: string, totalAmount: number) {
  const promo = await prisma.promoCode.findUnique({ where: { id, isActive: true } });
  if (!promo) return { valid: false, discount: 0 };
  
  let discount = 0;
  if (promo.discountType === 'FIXED') {
    discount = promo.discountValue;
  } else {
    discount = (totalAmount * promo.discountValue) / 100;
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  }
  return { valid: true, discount };
}

export async function getBookingByCode(code: string) {
  return prisma.booking.findUnique({
    where: { bookingCode: code },
    include: {
      schedule: {
        include: {
          route: true
        }
      },
      seats: true,
      passengers: true
    }
  });
}
