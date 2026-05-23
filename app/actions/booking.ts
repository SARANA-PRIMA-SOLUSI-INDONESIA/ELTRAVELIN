"use server";

import { prisma } from "@/lib/prisma";
import { sendBookingSuccessMessage } from "@/lib/whatsapp";

// Helper to get a Date object forced to Jakarta time
function getJakartaDate(dateStr?: string, hour = 0, minute = 0, second = 0) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const jktString = date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const jktDate = new Date(jktString);
  jktDate.setHours(hour, minute, second, 0);
  return jktDate;
}

export async function getSchedules(
  origin: string, 
  destination: string, 
  date: string, 
  options?: {
    timeFilter?: string[];
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  // Create start/end of day in Jakarta timezone context
  const startOfDay = new Date(`${date}T00:00:00+07:00`);
  const endOfDay = new Date(`${date}T23:59:59+07:00`);

  const absoluteNow = new Date(); 
  const effectiveGte = startOfDay > absoluteNow ? startOfDay : absoluteNow;

  if (effectiveGte > endOfDay) {
    return { data: [], total: 0 };
  }

  // Time filter logic
  let timeQuery = {};
  if (options?.timeFilter && options.timeFilter.length > 0) {
    const orConditions = options.timeFilter.map(time => {
      if (time === 'pagi') return { departureTime: { gte: new Date(`${date}T05:00:00+07:00`), lte: new Date(`${date}T10:59:59+07:00`) } };
      if (time === 'siang') return { departureTime: { gte: new Date(`${date}T11:00:00+07:00`), lte: new Date(`${date}T14:59:59+07:00`) } };
      if (time === 'sore') return { departureTime: { gte: new Date(`${date}T15:00:00+07:00`), lte: new Date(`${date}T18:59:59+07:00`) } };
      if (time === 'malam') return { departureTime: { gte: new Date(`${date}T19:00:00+07:00`), lte: new Date(`${date}T23:59:59+07:00`) } };
      return {};
    });
    timeQuery = { OR: orConditions };
  }

  // Sort logic
  let orderBy: any = { departureTime: 'asc' };
  if (options?.sortBy === 'price_asc') orderBy = { price: 'asc' };
  if (options?.sortBy === 'price_desc') orderBy = { price: 'desc' };
  if (options?.sortBy === 'time_desc') orderBy = { departureTime: 'desc' };

  const [schedules, total] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        AND: [
          {
            route: {
              origin: { contains: origin },
              destination: { contains: destination },
              isDeleted: false,
            },
          },
          {
            departureTime: {
              gte: effectiveGte,
              lte: endOfDay,
            },
          },
          timeQuery,
        ],
        isActive: true,
        isDeleted: false,
      },
      include: {
        route: {
          include: {
            stops: { orderBy: { sequence: 'asc' } }
          }
        },
        operatingTrip: {
          include: {
            _count: {
              select: {
                seats: { where: { status: 'AVAILABLE' } }
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.schedule.count({
      where: {
        AND: [
          {
            route: {
              origin: { contains: origin },
              destination: { contains: destination },
              isDeleted: false,
            },
          },
          {
            departureTime: {
              gte: effectiveGte,
              lte: endOfDay,
            },
          },
          timeQuery,
        ],
        isActive: true,
        isDeleted: false,
      }
    })
  ]);

  return {
    data: schedules.map((s: any) => ({
      ...s,
      _count: {
        seats: s.operatingTrip?._count?.seats || 0
      }
    })),
    total
  };
}

// New function: Search schedules by stops (origin and destination stops)
export async function getSchedulesWithStops(
  originStop: string,
  destStop: string,
  date: string,
  options?: {
    timeFilter?: string[];
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  // Create start/end of day in Jakarta timezone context
  const startOfDay = new Date(`${date}T00:00:00+07:00`);
  const endOfDay = new Date(`${date}T23:59:59+07:00`);

  const absoluteNow = new Date();
  const effectiveGte = startOfDay > absoluteNow ? startOfDay : absoluteNow;

  if (effectiveGte > endOfDay) {
    return { data: [], total: 0 };
  }

  // Find all routes that have both origin and destination stops
  // and origin comes before destination in sequence
  const routesWithStops = await prisma.route.findMany({
    where: {
      isDeleted: false,
      stops: {
        some: {
          name: { contains: originStop },
        }
      }
    },
    include: {
      stops: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  // Filter routes where destination stop exists and comes after origin
  const validRoutes = routesWithStops.filter(route => {
    const originIndex = route.stops.findIndex(s => s.name.toLowerCase().includes(originStop.toLowerCase()));
    const destIndex = route.stops.findIndex(s => s.name.toLowerCase().includes(destStop.toLowerCase()));
    return originIndex !== -1 && destIndex !== -1 && destIndex > originIndex;
  });

  if (validRoutes.length === 0) {
    return { data: [], total: 0 };
  }

  const routeIds = validRoutes.map(r => r.id);

  // Time filter logic
  let timeQuery = {};
  if (options?.timeFilter && options.timeFilter.length > 0) {
    const orConditions = options.timeFilter.map(time => {
      if (time === 'pagi') return { departureTime: { gte: new Date(`${date}T05:00:00+07:00`), lte: new Date(`${date}T10:59:59+07:00`) } };
      if (time === 'siang') return { departureTime: { gte: new Date(`${date}T11:00:00+07:00`), lte: new Date(`${date}T14:59:59+07:00`) } };
      if (time === 'sore') return { departureTime: { gte: new Date(`${date}T15:00:00+07:00`), lte: new Date(`${date}T18:59:59+07:00`) } };
      if (time === 'malam') return { departureTime: { gte: new Date(`${date}T19:00:00+07:00`), lte: new Date(`${date}T23:59:59+07:00`) } };
      return {};
    });
    timeQuery = { OR: orConditions };
  }

  // Sort logic - by departureTime default
  let orderBy: any = { departureTime: 'asc' };

  const [schedules, total] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        AND: [
          { routeId: { in: routeIds } },
          {
            departureTime: {
              gte: effectiveGte,
              lte: endOfDay,
            },
          },
          timeQuery,
        ],
        isActive: true,
        isDeleted: false,
      },
      include: {
        route: {
          include: {
            stops: {
              orderBy: { sequence: 'asc' }
            }
          }
        },
        operatingTrip: {
          include: {
            _count: {
              select: {
                seats: { where: { status: 'AVAILABLE' } }
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.schedule.count({
      where: {
        AND: [
          { routeId: { in: routeIds } },
          {
            departureTime: {
              gte: effectiveGte,
              lte: endOfDay,
            },
          },
          timeQuery,
        ],
        isActive: true,
        isDeleted: false,
      }
    })
  ]);

  // Calculate segment price for each schedule
  const schedulesWithSegmentPrice = schedules.map((schedule: any) => {
    const route = schedule.route;
    const originIndex = route.stops.findIndex((s: any) => s.name.toLowerCase().includes(originStop.toLowerCase()));
    const destIndex = route.stops.findIndex((s: any) => s.name.toLowerCase().includes(destStop.toLowerCase()));
    
    // Sum prices from stops AFTER origin up to destination (inclusive)
    // Price at each stop represents cost FROM previous stop TO this stop
    let segmentPrice = 0;
    for (let i = originIndex + 1; i <= destIndex && i < route.stops.length; i++) {
      segmentPrice += route.stops[i].price || 0;
    }
    
    // If segment price is 0, fall back to schedule price divided by number of stops
    if (segmentPrice === 0) {
      const totalStops = route.stops.length;
      const segmentStops = destIndex - originIndex + 1;
      segmentPrice = Math.round((schedule.price / totalStops) * segmentStops);
    }

    return {
      ...schedule,
      segmentPrice,
      originStopId: route.stops[originIndex]?.id,
      destinationStopId: route.stops[destIndex]?.id,
      originStopSequence: route.stops[originIndex]?.sequence,
      destStopSequence: route.stops[destIndex]?.sequence,
      _count: {
        seats: schedule.operatingTrip?._count?.seats || 0
      }
    };
  });

  // Apply price sorting if requested
  if (options?.sortBy === 'price_asc') {
    schedulesWithSegmentPrice.sort((a: any, b: any) => a.segmentPrice - b.segmentPrice);
  } else if (options?.sortBy === 'price_desc') {
    schedulesWithSegmentPrice.sort((a: any, b: any) => b.segmentPrice - a.segmentPrice);
  }

  return {
    data: schedulesWithSegmentPrice,
    total
  };
}

export async function getScheduleById(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      route: true,
      operatingTrip: {
        include: {
          seats: {
            orderBy: { seatNumber: 'asc' }
          }
        }
      }
    }
  });

  if (!schedule) return null;

  // Map operatingTrip seats to the schedule object so UI doesn't break
  return {
    ...schedule,
    seats: schedule.operatingTrip?.seats || []
  };
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
  }) as any;

  if (!promo) return { valid: false, message: "Kode promo tidak ditemukan", discount: 0 };

  // Check Dates
  const now = new Date();
  if (promo.startDate && new Date(promo.startDate) > now) {
    return { valid: false, message: "Promo belum dimulai", discount: 0 };
  }
  if (promo.endDate && new Date(promo.endDate) < now) {
    return { valid: false, message: "Promo sudah kedaluwarsa", discount: 0 };
  }

  // Check Quota
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    return { valid: false, message: "Kuota promo sudah habis", discount: 0 };
  }

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
  originStopId?: string;
  destinationStopId?: string;
  segmentPrice?: number;
}) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
    include: { route: true }
  });

  if (!schedule) throw new Error("Jadwal tidak ditemukan");
  if (!data.contactEmail) throw new Error("Email wajib diisi");

  // Prevent booking of schedules that have already departed
  if (schedule.departureTime < new Date()) {
    throw new Error("Jadwal sudah berangkat dan tidak dapat dipesan lagi.");
  }

  // Use segment price if available, otherwise use schedule price
  const pricePerSeat = data.segmentPrice || schedule.price;
  const basePrice = pricePerSeat * data.seatNumbers.length;
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
        passengerName: data.passengerNames[0],
        passengerPhone: data.contactPhone,
        passengerEmail: data.contactEmail,
        passengers: {
          create: data.passengerNames.map(name => ({ name }))
        }
      },
    });

    // 1b. Create BookingSegment if stop IDs provided
    if (data.originStopId && data.destinationStopId) {
      await tx.bookingSegment.create({
        data: {
          bookingId: booking.id,
          originStopId: data.originStopId,
          destinationStopId: data.destinationStopId,
          basePrice: data.segmentPrice || schedule.price,
        }
      });
    }

    // 2. Update all selected seats status for the physical vehicle trip
    if (schedule.operatingTripId) {
      await Promise.all(data.seatNumbers.map(num => 
        tx.seat.update({
          where: {
            operatingTripId_seatNumber: {
              operatingTripId: schedule.operatingTripId as string,
              seatNumber: num,
            },
          },
          data: {
            status: 'BOOKED',
            bookingId: booking.id,
          },
        })
      ));
    }

    // 3. Increment Promo usedCount if applicable
    if (data.promoCodeId) {
      await tx.promoCode.update({
        where: { id: data.promoCodeId },
        data: { usedCount: { increment: 1 } }
      });
    }

    return booking;
  });
}

async function validatePromoCodeById(id: string, totalAmount: number) {
  const promo = await prisma.promoCode.findUnique({ where: { id, isActive: true } }) as any;
  if (!promo) return { valid: false, discount: 0 };
  
  // Check Dates
  const now = new Date();
  if (promo.startDate && new Date(promo.startDate) > now) return { valid: false, discount: 0 };
  if (promo.endDate && new Date(promo.endDate) < now) return { valid: false, discount: 0 };

  // Check Quota
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return { valid: false, discount: 0 };

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

export async function adminCreateBooking(data: {
  scheduleId: string;
  contactName: string;
  contactEmail?: string;
  contactPhone: string;
  passengerNames: string[];
  seatNumbers: string[];
  paymentMethod: string;
}) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
    include: { route: true }
  });

  if (!schedule) throw new Error("Jadwal tidak ditemukan");

  const totalPrice = schedule.price * data.seatNumbers.length;
  const bookingCode = `ADM-${Math.floor(100000 + Math.random() * 900000)}-${data.seatNumbers[0]}`;

  return prisma.$transaction(async (tx: any) => {
    const booking = await tx.booking.create({
      data: {
        bookingCode,
        scheduleId: data.scheduleId,
        contactName: data.contactName,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone,
        totalPrice,
        discountAmount: 0,
        paymentMethod: data.paymentMethod,
        status: 'CONFIRMED',
        passengerName: data.passengerNames[0],
        passengerPhone: data.contactPhone,
        passengerEmail: data.contactEmail || null,
        passengers: {
          create: data.passengerNames.map(name => ({ name }))
        }
      },
    });

    // 2. Update all selected seats status for the physical vehicle trip
    if (schedule.operatingTripId) {
      await Promise.all(data.seatNumbers.map(num => 
        tx.seat.update({
          where: {
            operatingTripId_seatNumber: {
              operatingTripId: schedule.operatingTripId as string,
              seatNumber: num,
            },
          },
          data: {
            status: 'BOOKED',
            bookingId: booking.id,
          },
        })
      ));
    }

    // Send WhatsApp notification for admin bookings
    sendBookingSuccessMessage({
      ...booking,
      schedule: {
        ...schedule,
        route: schedule.route
      },
      seats: data.seatNumbers.map(num => ({ seatNumber: num }))
    }).catch(err => console.error("Error sending admin WA success:", err));

    return booking;
  });
}

export async function getCheckoutPromos() {
  const now = new Date();
  const promos = await prisma.promoCode.findMany({
    where: {
      isActive: true,
      showOnCheckout: true,
      AND: [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: now } }
          ]
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  return promos.filter((p: any) => !p.usageLimit || p.usedCount < p.usageLimit);
}

