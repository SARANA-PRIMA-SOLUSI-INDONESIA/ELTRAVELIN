"use server";

import { prisma } from "@/lib/prisma";
import { sendBookingSuccessMessage, sendAdminWhatsAppNotification, sendBookingPendingReminder } from "@/lib/whatsapp";
import { sendAdminNotification, sendETicket } from "@/lib/mail";

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
            stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } }
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
          isDeleted: false,
          name: { contains: originStop },
          isActive: true
        }
      }
    },
    include: {
      stops: {
        where: { isDeleted: false },
        orderBy: { sequence: 'asc' }
      }
    }
  });

  // Filter routes where both selected stops are active and destination comes after origin.
  const validRoutes = routesWithStops.filter(route => {
    const originIndex = route.stops.findIndex(s => s.name.toLowerCase().includes(originStop.toLowerCase()) && s.isActive !== false);
    const destIndex = route.stops.findIndex(s => s.name.toLowerCase().includes(destStop.toLowerCase()) && s.isActive !== false);
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
              where: { isDeleted: false },
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
    const allStops = route.stops;
    const activeStops = allStops.filter((s: any) => s.isActive !== false);
    const origin = activeStops.find((s: any) => s.name.toLowerCase().includes(originStop.toLowerCase()));
    const dest = activeStops.find((s: any) => s.name.toLowerCase().includes(destStop.toLowerCase()));
    const originIndex = origin ? allStops.findIndex((s: any) => s.id === origin.id) : -1;
    const destIndex = dest ? allStops.findIndex((s: any) => s.id === dest.id) : -1;

    // Sum prices from stops AFTER origin up to destination (inclusive) over ALL
    // non-deleted stops, so hidden stops (isActive=false) still contribute.
    let segmentPrice = 0;
    for (let i = originIndex + 1; i <= destIndex && i < allStops.length; i++) {
      segmentPrice += allStops[i].price || 0;
    }

    return {
      ...schedule,
      segmentPrice,
      originStopId: origin?.id,
      destinationStopId: dest?.id,
      originStopSequence: origin?.sequence,
      destStopSequence: dest?.sequence,
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

export async function validatePromoCode(code: string, totalAmount: number, seatCount = 1) {
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
    discount = promo.discountValue * seatCount;
  } else {
    discount = (totalAmount * promo.discountValue) / 100;
  }

  if (promo.maxDiscount && promo.maxDiscount > 0) {
    discount = Math.min(discount, promo.maxDiscount);
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
  originStopName?: string;
  destinationStopName?: string;
  segmentPrice?: number;
}) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
    include: { route: { include: { stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } } } } }
  });

  if (!schedule) throw new Error("Jadwal tidak ditemukan");
  if (!data.contactEmail) throw new Error("Email wajib diisi");

  if (schedule.departureTime < new Date()) {
    throw new Error("Jadwal sudah berangkat dan tidak dapat dipesan lagi.");
  }

  let pricePerSeat = schedule.price;
  let resolvedOriginStopId: string | undefined;
  let resolvedDestinationStopId: string | undefined;
  if ((data.originStopName && data.destinationStopName) || (data.originStopId && data.destinationStopId)) {
    const allStops = schedule.route.stops;
    const activeStops = allStops.filter((stop: any) => stop.isActive !== false);
    const originIndex = data.originStopName
      ? activeStops.findIndex((stop: any) => stop.name === data.originStopName)
      : activeStops.findIndex((stop: any) => stop.id === data.originStopId);
    const destinationIndex = data.destinationStopName
      ? activeStops.findIndex((stop: any) => stop.name === data.destinationStopName)
      : activeStops.findIndex((stop: any) => stop.id === data.destinationStopId);

    if (originIndex === -1 || destinationIndex <= originIndex) {
      throw new Error("Titik perjalanan tidak valid atau sudah dinonaktifkan.");
    }

    const origin = activeStops[originIndex];
    const destination = activeStops[destinationIndex];
    resolvedOriginStopId = origin.id;
    resolvedDestinationStopId = destination.id;

    // Sum segment price over ALL non-deleted stops so hidden stops still contribute.
    const originIdxAll = allStops.findIndex((stop: any) => stop.id === origin.id);
    const destIdxAll = allStops.findIndex((stop: any) => stop.id === destination.id);
    if (originIdxAll !== -1 && destIdxAll > originIdxAll) {
      pricePerSeat = allStops
        .slice(originIdxAll + 1, destIdxAll + 1)
        .reduce((sum: number, stop: any) => sum + (stop.price || 0), 0);
    }
  }

  const basePrice = pricePerSeat * data.seatNumbers.length;
  let discountAmount = 0;

  if (data.promoCodeId) {
    const promoVal = await validatePromoCodeById(
      data.promoCodeId,
      basePrice,
      data.seatNumbers.length
    );
    if (promoVal.valid) {
      discountAmount = promoVal.discount;
    }
  }

  const uniqueCode = Math.floor(100 + Math.random() * 899);
  const totalPrice = (basePrice - discountAmount) + uniqueCode;
  const bookingCode = `EL-${Math.floor(100000 + Math.random() * 900000)}-${data.seatNumbers[0]}`;

  const booking = await prisma.$transaction(async (tx: any) => {
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

    if (resolvedOriginStopId && resolvedDestinationStopId) {
      await tx.bookingSegment.create({
        data: {
          bookingId: booking.id,
          originStopId: resolvedOriginStopId,
          destinationStopId: resolvedDestinationStopId,
          basePrice: pricePerSeat,
        }
      });
    }

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

    if (data.promoCodeId) {
      await tx.promoCode.update({
        where: { id: data.promoCodeId },
        data: { usedCount: { increment: 1 } }
      });
    }

    return booking;
  });

  // Notifikasi admin — setiap booking baru langsung kirim WA & email ke admin
  const notificationData = {
    ...booking,
    schedule,
    seats: data.seatNumbers.map(n => ({ seatNumber: n })),
    passengers: data.passengerNames.map(n => ({ name: n })),
    segment: {
      originStop: schedule.route.stops.find((s: any) => s.id === resolvedOriginStopId),
      destinationStop: schedule.route.stops.find((s: any) => s.id === resolvedDestinationStopId),
    },
  };
  sendAdminWhatsAppNotification(notificationData).catch(err => console.error("Admin WA notif error:", err));
  sendBookingPendingReminder(notificationData).catch(err => console.error("Customer WA pending notif error:", err));
  sendAdminNotification(notificationData).catch(err => console.error("Admin email notif error:", err));

  return booking;
}

async function validatePromoCodeById(id: string, totalAmount: number, seatCount = 1) {
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
    discount = promo.discountValue * seatCount;
  } else {
    discount = (totalAmount * promo.discountValue) / 100;
  }

  if (promo.maxDiscount && promo.maxDiscount > 0) {
    discount = Math.min(discount, promo.maxDiscount);
  }
  return { valid: true, discount };
}

export async function getBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      schedule: {
        include: { route: true }
      },
      seats: true,
      passengers: true
    }
  });
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

export async function updateBooking(id: string, data: {
  contactName: string;
  contactEmail?: string;
  contactPhone: string;
  passengerNames: string[];
  status: string;
}) {
  // First delete existing passengers
  await prisma.passenger.deleteMany({ where: { bookingId: id } });

  return prisma.booking.update({
    where: { id },
    data: {
      contactName: data.contactName,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone,
      status: data.status as any,
      passengers: {
        create: data.passengerNames.map(name => ({ name }))
      }
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
  originStopId?: string;
  destinationStopId?: string;
}) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
    include: { route: { include: { stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } } } } }
  });

  if (!schedule) throw new Error("Jadwal tidak ditemukan");

  let pricePerSeat = schedule.price;
  if (data.originStopId && data.destinationStopId) {
    const allStops = schedule.route.stops;
    const activeStops = allStops.filter((stop: any) => stop.isActive !== false);
    const originStop = activeStops.find((s: any) => s.id === data.originStopId);
    const destStop = activeStops.find((s: any) => s.id === data.destinationStopId);
    const originIdx = originStop ? allStops.findIndex((s: any) => s.id === originStop.id) : -1;
    const destIdx = destStop ? allStops.findIndex((s: any) => s.id === destStop.id) : -1;
    if (originStop && destStop && originIdx !== -1 && destIdx > originIdx) {
      pricePerSeat = allStops
        .slice(originIdx + 1, destIdx + 1)
        .reduce((sum: number, s: any) => sum + (s.price || 0), 0);
    }
  }

  const totalPrice = pricePerSeat * data.seatNumbers.length;
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

    // Create BookingSegment if stop IDs provided
    if (data.originStopId && data.destinationStopId) {
      await tx.bookingSegment.create({
        data: {
          bookingId: booking.id,
          originStopId: data.originStopId,
          destinationStopId: data.destinationStopId,
          basePrice: pricePerSeat,
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

    // Send WhatsApp notification for admin bookings
    const notificationData = {
      ...booking,
      schedule: {
        ...schedule,
        route: schedule.route
      },
      seats: data.seatNumbers.map(num => ({ seatNumber: num })),
      passengers: data.passengerNames.map(name => ({ name: name })),
      segment: data.originStopId && data.destinationStopId
        ? {
            originStop: schedule.route.stops.find((s: any) => s.id === data.originStopId),
            destinationStop: schedule.route.stops.find((s: any) => s.id === data.destinationStopId),
          }
        : undefined,
    };

    sendETicket(notificationData).catch(err => console.error("Error sending admin E-ticket:", err));
    sendBookingSuccessMessage(notificationData).catch(err => console.error("Error sending admin WA success:", err));
    sendAdminWhatsAppNotification(notificationData).catch(err => console.error("Admin WA notif error:", err));
    sendAdminNotification(notificationData).catch(err => console.error("Error sending admin email:", err));

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

// ========== RESCHEDULE, REFUND & CHANGE ROUTE ACTIONS ==========

export async function rescheduleBooking(bookingId: string, newScheduleId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { schedule: true, seats: true }
  });

  if (!booking) throw new Error("Booking tidak ditemukan");
  if (booking.status !== 'CONFIRMED') throw new Error("Hanya booking yang sudah bayar yang dapat di-reschedule");

  const newSchedule = await prisma.schedule.findUnique({
    where: { id: newScheduleId },
    include: { route: true }
  });

  if (!newSchedule) throw new Error("Jadwal baru tidak ditemukan");
  if (newSchedule.departureTime < new Date()) throw new Error("Jadwal baru sudah berlalu");

  return prisma.$transaction(async (tx: any) => {
    // Release old seats
    if (booking.schedule.operatingTripId) {
      await tx.seat.updateMany({
        where: {
          operatingTripId: booking.schedule.operatingTripId,
          bookingId: booking.id
        },
        data: { status: 'AVAILABLE', bookingId: null }
      });
    }

    // Calculate new price
    const pricePerSeat = newSchedule.price;
    const passengerCount = booking.seats.length || 1;
    const newTotalPrice = pricePerSeat * passengerCount;

    // Update booking with new schedule
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        scheduleId: newScheduleId,
        totalPrice: newTotalPrice,
        discountAmount: 0
      },
      include: {
        schedule: { include: { route: true } },
        seats: true,
        passengers: true
      }
    });

    // Book new seats if operating trip exists
    if (newSchedule.operatingTripId) {
      const availableSeats = await tx.seat.findMany({
        where: {
          operatingTripId: newSchedule.operatingTripId,
          status: 'AVAILABLE'
        },
        take: passengerCount,
        orderBy: { seatNumber: 'asc' }
      });

      if (availableSeats.length < passengerCount) {
        throw new Error("Kursi tidak tersedia untuk jadwal baru");
      }

      for (const seat of availableSeats) {
        await tx.seat.update({
          where: { id: seat.id },
          data: { status: 'BOOKED', bookingId: booking.id }
        });
      }
    }

    return updatedBooking;
  });
}

export async function processRefund(bookingId: string, refundAmount: number, reason: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { schedule: true, seats: true }
  });

  if (!booking) throw new Error("Booking tidak ditemukan");
  if (booking.status !== 'CONFIRMED') throw new Error("Hanya booking yang sudah bayar yang dapat di-refund");

  return prisma.$transaction(async (tx: any) => {
    // Release seats
    if (booking.schedule.operatingTripId) {
      await tx.seat.updateMany({
        where: {
          operatingTripId: booking.schedule.operatingTripId,
          bookingId: booking.id
        },
        data: { status: 'AVAILABLE', bookingId: null }
      });
    }

    // Update booking to CANCELLED with refund info
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        // Store refund info in a simple way - you might want to create a separate Refund model
        paymentProofUrl: `REFUND:${refundAmount}:${reason}:${new Date().toISOString()}`
      },
      include: {
        schedule: { include: { route: true } },
        seats: true,
        passengers: true
      }
    });

    return { success: true, booking: updatedBooking, refundAmount, reason };
  });
}

export async function changeBookingRoute(bookingId: string, newRouteId: string, newScheduleId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { schedule: true, seats: true, segment: true }
  });

  if (!booking) throw new Error("Booking tidak ditemukan");
  if (booking.status !== 'CONFIRMED') throw new Error("Hanya booking yang sudah bayar yang dapat pindah rute");

  const newSchedule = await prisma.schedule.findUnique({
    where: { id: newScheduleId },
    include: { route: { include: { stops: true } } }
  });

  if (!newSchedule) throw new Error("Jadwal baru tidak ditemukan");
  if (newSchedule.routeId !== newRouteId) throw new Error("Jadwal tidak sesuai dengan rute");

  return prisma.$transaction(async (tx: any) => {
    // Release old seats
    if (booking.schedule.operatingTripId) {
      await tx.seat.updateMany({
        where: {
          operatingTripId: booking.schedule.operatingTripId,
          bookingId: booking.id
        },
        data: { status: 'AVAILABLE', bookingId: null }
      });
    }

    // Calculate new price
    const pricePerSeat = newSchedule.price;
    const passengerCount = booking.seats.length || 1;
    const newTotalPrice = pricePerSeat * passengerCount;

    // Delete old segment if exists
    if (booking.segment) {
      await tx.bookingSegment.delete({
        where: { id: booking.segment.id }
      });
    }

    // Update booking with new schedule and route
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        scheduleId: newScheduleId,
        totalPrice: newTotalPrice,
        discountAmount: 0
      },
      include: {
        schedule: { include: { route: true } },
        seats: true,
        passengers: true
      }
    });

    // Book new seats if operating trip exists
    if (newSchedule.operatingTripId) {
      const availableSeats = await tx.seat.findMany({
        where: {
          operatingTripId: newSchedule.operatingTripId,
          status: 'AVAILABLE'
        },
        take: passengerCount,
        orderBy: { seatNumber: 'asc' }
      });

      if (availableSeats.length < passengerCount) {
        throw new Error("Kursi tidak tersedia untuk rute baru");
      }

      for (const seat of availableSeats) {
        await tx.seat.update({
          where: { id: seat.id },
          data: { status: 'BOOKED', bookingId: booking.id }
        });
      }
    }

    return updatedBooking;
  });
}

// Get available schedules for reschedule (same route, future dates)
export async function getAvailableSchedulesForReschedule(routeId: string, excludeScheduleId: string) {
  const now = new Date();

  return prisma.schedule.findMany({
    where: {
      routeId: routeId,
      id: { not: excludeScheduleId },
      departureTime: { gte: now },
      isActive: true,
      isDeleted: false
    },
    include: {
      route: true,
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
    orderBy: { departureTime: 'asc' }
  });
}

// Get all active routes for change route feature
export async function getAllActiveRoutes() {
  return prisma.route.findMany({
    where: { isDeleted: false },
    include: {
      stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } }
    },
    orderBy: [
      { origin: 'asc' },
      { destination: 'asc' }
    ]
  });
}

// ========== COMPREHENSIVE EDIT BOOKING ACTION ==========

export interface EditBookingData {
  bookingId: string;
  action: 'EDIT_DATA' | 'RESCHEDULE' | 'CHANGE_ROUTE' | 'REFUND';
  // Contact info
  contactName?: string;
  contactPhone?: string;
  // Passengers
  passengers?: { id?: string; name: string }[];
  // Seats
  seatNumbers?: string[];
  // Schedule/route change
  newScheduleId?: string;
  newRouteId?: string;
  // Refund
  refundAmount?: number;
  refundReason?: string;
}

export async function editBooking(data: EditBookingData) {
  const { bookingId, action } = data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      schedule: true,
      seats: true,
      passengers: true,
      segment: true
    }
  });

  if (!booking) throw new Error("Booking tidak ditemukan");

  // REFUND action - cancel booking
  if (action === 'REFUND') {
    if (booking.status !== 'CONFIRMED') throw new Error("Hanya booking yang sudah bayar yang dapat di-refund");
    if (!data.refundAmount || data.refundAmount <= 0) throw new Error("Jumlah refund harus lebih dari 0");
    if (!data.refundReason?.trim()) throw new Error("Alasan refund wajib diisi");

    return prisma.$transaction(async (tx: any) => {
      // Release seats
      if (booking.schedule.operatingTripId) {
        await tx.seat.updateMany({
          where: {
            operatingTripId: booking.schedule.operatingTripId,
            bookingId: booking.id
          },
          data: { status: 'AVAILABLE', bookingId: null }
        });
      }

      // Update booking to CANCELLED with refund info
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentProofUrl: `REFUND:${data.refundAmount}:${data.refundReason}:${new Date().toISOString()}`
        },
        include: {
          schedule: { include: { route: true } },
          seats: true,
          passengers: true
        }
      });

      return { success: true, booking: updatedBooking, type: 'REFUND' };
    });
  }

  // CHANGE_ROUTE action
  if (action === 'CHANGE_ROUTE') {
    if (booking.status !== 'CONFIRMED') throw new Error("Hanya booking yang sudah bayar yang dapat pindah rute");
    if (!data.newRouteId || !data.newScheduleId) throw new Error("Rute dan jadwal baru harus dipilih");

    const newSchedule = await prisma.schedule.findUnique({
      where: { id: data.newScheduleId },
      include: { route: true }
    });

    if (!newSchedule) throw new Error("Jadwal baru tidak ditemukan");
    if (newSchedule.routeId !== data.newRouteId) throw new Error("Jadwal tidak sesuai dengan rute");

    return prisma.$transaction(async (tx: any) => {
      // Release old seats
      if (booking.schedule.operatingTripId) {
        await tx.seat.updateMany({
          where: {
            operatingTripId: booking.schedule.operatingTripId,
            bookingId: booking.id
          },
          data: { status: 'AVAILABLE', bookingId: null }
        });
      }

      // Delete old segment if exists
      if (booking.segment) {
        await tx.bookingSegment.delete({
          where: { id: booking.segment.id }
        });
      }

      // Calculate new price
      const passengerCount = data.passengers?.length || booking.passengers.length || 1;
      const newTotalPrice = newSchedule.price * passengerCount;

      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          scheduleId: data.newScheduleId,
          totalPrice: newTotalPrice,
          discountAmount: 0
        },
        include: {
          schedule: { include: { route: true } },
          seats: true,
          passengers: true
        }
      });

      // Book new seats
      if (newSchedule.operatingTripId && data.seatNumbers && data.seatNumbers.length > 0) {
        // Book specific seats
        for (const seatNumber of data.seatNumbers) {
          const seat = await tx.seat.findFirst({
            where: {
              operatingTripId: newSchedule.operatingTripId,
              seatNumber: seatNumber,
              status: 'AVAILABLE'
            }
          });
          if (!seat) throw new Error(`Kursi ${seatNumber} tidak tersedia`);
          await tx.seat.update({
            where: { id: seat.id },
            data: { status: 'BOOKED', bookingId: booking.id }
          });
        }
      } else if (newSchedule.operatingTripId) {
        // Auto-assign seats
        const availableSeats = await tx.seat.findMany({
          where: {
            operatingTripId: newSchedule.operatingTripId,
            status: 'AVAILABLE'
          },
          take: passengerCount,
          orderBy: { seatNumber: 'asc' }
        });

        if (availableSeats.length < passengerCount) {
          throw new Error("Kursi tidak tersedia untuk rute baru");
        }

        for (const seat of availableSeats) {
          await tx.seat.update({
            where: { id: seat.id },
            data: { status: 'BOOKED', bookingId: booking.id }
          });
        }
      }

      return { success: true, booking: updatedBooking, type: 'CHANGE_ROUTE' };
    });
  }

  // RESCHEDULE action (same route, different schedule)
  if (action === 'RESCHEDULE') {
    if (booking.status !== 'CONFIRMED') throw new Error("Hanya booking yang sudah bayar yang dapat di-reschedule");
    if (!data.newScheduleId) throw new Error("Jadwal baru harus dipilih");

    const newSchedule = await prisma.schedule.findUnique({
      where: { id: data.newScheduleId },
      include: { route: true }
    });

    if (!newSchedule) throw new Error("Jadwal baru tidak ditemukan");
    if (newSchedule.routeId !== booking.schedule.routeId) throw new Error("Jadwal baru harus dari rute yang sama");
    if (newSchedule.departureTime < new Date()) throw new Error("Jadwal baru sudah berlalu");

    return prisma.$transaction(async (tx: any) => {
      // Release old seats
      if (booking.schedule.operatingTripId) {
        await tx.seat.updateMany({
          where: {
            operatingTripId: booking.schedule.operatingTripId,
            bookingId: booking.id
          },
          data: { status: 'AVAILABLE', bookingId: null }
        });
      }

      // Calculate new price
      const passengerCount = data.passengers?.length || booking.passengers.length || 1;
      const newTotalPrice = newSchedule.price * passengerCount;

      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          scheduleId: data.newScheduleId,
          totalPrice: newTotalPrice,
          discountAmount: 0
        },
        include: {
          schedule: { include: { route: true } },
          seats: true,
          passengers: true
        }
      });

      // Book new seats
      if (newSchedule.operatingTripId && data.seatNumbers && data.seatNumbers.length > 0) {
        for (const seatNumber of data.seatNumbers) {
          const seat = await tx.seat.findFirst({
            where: {
              operatingTripId: newSchedule.operatingTripId,
              seatNumber: seatNumber,
              status: 'AVAILABLE'
            }
          });
          if (!seat) throw new Error(`Kursi ${seatNumber} tidak tersedia`);
          await tx.seat.update({
            where: { id: seat.id },
            data: { status: 'BOOKED', bookingId: booking.id }
          });
        }
      } else if (newSchedule.operatingTripId) {
        const availableSeats = await tx.seat.findMany({
          where: {
            operatingTripId: newSchedule.operatingTripId,
            status: 'AVAILABLE'
          },
          take: passengerCount,
          orderBy: { seatNumber: 'asc' }
        });

        if (availableSeats.length < passengerCount) {
          throw new Error("Kursi tidak tersedia untuk jadwal baru");
        }

        for (const seat of availableSeats) {
          await tx.seat.update({
            where: { id: seat.id },
            data: { status: 'BOOKED', bookingId: booking.id }
          });
        }
      }

      return { success: true, booking: updatedBooking, type: 'RESCHEDULE' };
    });
  }

  // EDIT_DATA action - just update contact and passenger info
  return prisma.$transaction(async (tx: any) => {
    const updateData: any = {};

    // Update contact info
    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;

    // Update passengers
    if (data.passengers && data.passengers.length > 0) {
      // Delete existing passengers and create new ones
      await tx.passenger.deleteMany({
        where: { bookingId: bookingId }
      });

      for (const passenger of data.passengers) {
        await tx.passenger.create({
          data: {
            name: passenger.name,
            bookingId: bookingId
          }
        });
      }

      // Recalculate total price based on new passenger count
      const pricePerSeat = booking.schedule.price;
      const newTotalPrice = pricePerSeat * data.passengers.length;
      updateData.totalPrice = newTotalPrice;

      // Update seats if seat numbers provided and operating trip exists
      if (data.seatNumbers && data.seatNumbers.length > 0 && booking.schedule.operatingTripId) {
        // Release old seats
        await tx.seat.updateMany({
          where: {
            operatingTripId: booking.schedule.operatingTripId,
            bookingId: booking.id
          },
          data: { status: 'AVAILABLE', bookingId: null }
        });

        // Book new seats
        for (const seatNumber of data.seatNumbers) {
          const seat = await tx.seat.findFirst({
            where: {
              operatingTripId: booking.schedule.operatingTripId,
              seatNumber: seatNumber,
              status: 'AVAILABLE'
            }
          });
          if (!seat) throw new Error(`Kursi ${seatNumber} tidak tersedia`);
          await tx.seat.update({
            where: { id: seat.id },
            data: { status: 'BOOKED', bookingId: booking.id }
          });
        }
      }
    }

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        schedule: { include: { route: true } },
        seats: true,
        passengers: true
      }
    });

    return { success: true, booking: updatedBooking, type: 'EDIT_DATA' };
  });
}

// Get available seats for a schedule
export async function getAvailableSeatsForSchedule(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      operatingTrip: {
        include: {
          seats: {
            where: { status: 'AVAILABLE' },
            orderBy: { seatNumber: 'asc' }
          }
        }
      }
    }
  });

  if (!schedule || !schedule.operatingTrip) {
    return [];
  }

  return schedule.operatingTrip.seats;
}

export async function getScheduleManifest(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      route: {
        include: { stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } } },
      },
      operatingTrip: {
        include: {
          vehicle: true,
          seats: {
            orderBy: { seatNumber: 'asc' },
            include: {
              booking: {
                include: {
                  passengers: true,
                  segment: {
                    include: {
                      originStop: true,
                      destinationStop: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  return schedule;
}

export async function adminDeleteBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { seats: true },
  });

  if (!booking) throw new Error("Booking tidak ditemukan");

  return prisma.$transaction(async (tx) => {
    // Free seats first (Seat.bookingId has no onDelete Cascade)
    await tx.seat.updateMany({
      where: { bookingId: booking.id },
      data: { status: "AVAILABLE", bookingId: null },
    });

    // Hard delete: Passenger & BookingSegment cascade via schema
    await tx.booking.delete({
      where: { id: bookingId },
    });

    return { success: true, bookingCode: booking.bookingCode };
  });
}

