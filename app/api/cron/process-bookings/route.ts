import { prisma } from "@/lib/prisma";
import { sendPaymentReminder } from "@/lib/mail";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Security check: Verify a secret token if provided
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const twentyFiveMinutesAgo = new Date(now.getTime() - 25 * 60 * 1000);

  try {
    // 1. Send Reminders (10 minutes old, no reminder yet)
    const toRemind = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        reminderSentAt: null,
        createdAt: { lte: tenMinutesAgo, gte: twentyFiveMinutesAgo },
      },
      include: {
        schedule: {
          include: { route: true }
        },
        seats: true
      }
    });

    for (const booking of toRemind) {
      // Send reminder asynchronously
      sendPaymentReminder(booking).catch(err => console.error("Error sending reminder:", err));
      
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: now }
      });
      console.log(`Reminder sent for booking ${booking.bookingCode}`);
    }

    // 2. Expire Bookings (25 minutes old)
    const toExpire = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        createdAt: { lte: twentyFiveMinutesAgo },
      },
    });

    for (const booking of toExpire) {
      await prisma.$transaction(async (tx: any) => {
        // Update booking status
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" }
        });

        // Release seats
        await tx.seat.updateMany({
          where: {
            bookingId: booking.id
          },
          data: {
            status: "AVAILABLE",
            bookingId: null
          }
        });
      });
      console.log(`Booking ${booking.bookingCode} expired and cancelled.`);
    }

    return NextResponse.json({
      remindersSent: toRemind.length,
      bookingsExpired: toExpire.length
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
