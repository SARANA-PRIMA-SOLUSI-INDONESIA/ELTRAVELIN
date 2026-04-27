"use server";

export async function getSchedules(origin: string, destination: string, date: string) {
  const { prisma } = await import("@/lib/prisma");
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
  const { prisma } = await import("@/lib/prisma");
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

export async function createBooking(data: {
  scheduleId: string;
  passengerName: string;
  passengerEmail?: string;
  passengerPhone: string;
  seatNumber: string;
}) {
  const { prisma } = await import("@/lib/prisma");
  const { snap } = await import("@/lib/midtrans");

  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
    include: { route: true }
  });

  if (!schedule) throw new Error("Jadwal tidak ditemukan");

  const bookingCode = `EL-${Math.floor(100000 + Math.random() * 900000)}-${data.seatNumber}`;

  return prisma.$transaction(async (tx: any) => {
    // 1. Create the booking
    const booking = await tx.booking.create({
      data: {
        bookingCode,
        scheduleId: data.scheduleId,
        passengerName: data.passengerName,
        passengerEmail: data.passengerEmail,
        passengerPhone: data.passengerPhone,
        totalPrice: schedule.price,
        status: 'PENDING',
      },
    });

    // 2. Generate Midtrans Snap Token
    const parameter = {
      transaction_details: {
        order_id: bookingCode,
        gross_amount: schedule.price,
      },
      item_details: [{
        id: schedule.id,
        price: schedule.price,
        quantity: 1,
        name: `Tiket Travel ${schedule.route.origin} - ${schedule.route.destination}`,
      }],
      customer_details: {
        first_name: data.passengerName,
        email: data.passengerEmail || "customer@example.com",
        phone: data.passengerPhone,
      },
    };

    const snapToken = await snap.createTransactionToken(parameter);

    // 3. Update the booking with snapToken
    await tx.booking.update({
      where: { id: booking.id },
      data: { snapToken },
    });

    // 4. Update the seat status
    await tx.seat.update({
      where: {
        scheduleId_seatNumber: {
          scheduleId: data.scheduleId,
          seatNumber: data.seatNumber,
        },
      },
      data: {
        status: 'BOOKED',
        bookingId: booking.id,
      },
    });

    return { ...booking, snapToken };
  });
}

export async function getBookingByCode(code: string) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.booking.findUnique({
    where: { bookingCode: code },
    include: {
      schedule: {
        include: {
          route: true
        }
      },
      seats: true
    }
  });
}
