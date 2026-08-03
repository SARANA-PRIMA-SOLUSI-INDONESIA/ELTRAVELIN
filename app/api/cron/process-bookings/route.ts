import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronKeyHeader = request.headers.get('x-cron-key');
  const { searchParams } = new URL(request.url);
  const urlKey = searchParams.get('key');
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isLocal = request.url.includes('localhost') || request.url.includes('127.0.0.1');

  console.log(`[CRON] Request from: ${request.url}, isLocal: ${isLocal}, hasSecret: ${!!cronSecret}`);

  const isAuthorized =
    isLocal ||
    !cronSecret ||
    authHeader === `Bearer ${cronSecret}` ||
    authHeader === `bearer ${cronSecret}` ||
    cronKeyHeader === cronSecret ||
    urlKey === cronSecret;

  if (!isAuthorized) {
    console.log("[CRON] Unauthorized Access Attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  console.log(`[CRON] Starting check at ${now.toISOString()}`);

  // Check env vars
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasDirectUrl = !!process.env.DIRECT_URL;
  const hasWaKey = !!process.env.STARSENDER_API_KEY;
  console.log(`[CRON] Env check - DB_URL: ${hasDbUrl}, DIRECT_URL: ${hasDirectUrl}, WA_KEY: ${hasWaKey}`);

  try {
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        schedule: {
          include: { route: true }
        }
      }
    });

    console.log(`[CRON] Found ${pendingBookings.length} pending bookings`);

    let remindersSent = 0;
    let bookingsExpired = 0;
    const details = [];

    for (const booking of pendingBookings) {
      const diffMs = now.getTime() - booking.createdAt.getTime();
      const minutesElapsed = Math.floor(diffMs / (60 * 1000));
      const method = booking.paymentMethod;

      console.log(`[CRON] Booking ${booking.bookingCode}: ${minutesElapsed}m elapsed (Method: ${method})`);

      let shouldRemind = false;
      let nextLevel = 0;
      let message = "";
      let shouldCancel = false;

      if (method === 'MOOTA') {
        if (minutesElapsed >= 35) {
          shouldCancel = true;
          message = `Mohon maaf, pesanan Anda dengan kode ${booking.bookingCode} telah hangus karena melewati batas waktu pembayaran 35 menit. Silakan buat pesanan baru. Terima kasih.`;
        } else if (minutesElapsed >= 25 && booking.lastReminderLevel < 2) {
          shouldRemind = true;
          nextLevel = 2;
          message = `Reminder: Masa booking Anda (${booking.bookingCode}) berlaku hingga 10 menit ke depan. Segera lakukan pembayaran agar kursi Anda tidak terhapus otomatis.`;
        } else if (minutesElapsed >= 15 && booking.lastReminderLevel < 1) {
          shouldRemind = true;
          nextLevel = 1;
          message = `Halo ${booking.contactName}, pembayaran untuk booking ${booking.bookingCode} harus segera dilakukan. Masa booking berlaku hingga 15 menit ke depan.`;
        }
      } else if (method === 'POOL') {
        // POOL: 20m (R1), 50m (R2), 60m (Cancel)
        if (minutesElapsed >= 60) {
          shouldCancel = true;
          message = `Booking Closed: Pesanan Anda (${booking.bookingCode}) telah otomatis hangus karena belum dibayar dalam 60 menit. Silakan lakukan pemesanan kembali.`;
        } else if (minutesElapsed >= 50 && booking.lastReminderLevel < 2) {
          shouldRemind = true;
          nextLevel = 2;
          message = `Reminder: Booking Anda (${booking.bookingCode}) akan segera berakhir dalam 10 menit. Segera selesaikan pembayaran di Pool.`;
        } else if (minutesElapsed >= 20 && booking.lastReminderLevel < 1) {
          shouldRemind = true;
          nextLevel = 1;
          message = `Halo ${booking.contactName}, diingatkan kembali untuk pembayaran booking ${booking.bookingCode} di Pool dalam 40 menit ke depan.`;
        }
      } else if (method === 'UNSET' || !method) {
        // UNSET/Abandoned: Cancel after 15 minutes
        if (minutesElapsed >= 15) {
          shouldCancel = true;
          message = `Mohon maaf, pesanan Anda dengan kode ${booking.bookingCode} telah dibatalkan secara otomatis karena belum menyelesaikan pemilihan metode pembayaran. Silakan lakukan pemesanan kembali.`;
        }
      }

      if (shouldCancel) {
        await prisma.$transaction(async (tx: any) => {
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED" }
          });
          await tx.seat.updateMany({
            where: { bookingId: booking.id },
            data: { status: "AVAILABLE", bookingId: null }
          });
        });
        let waRes = { success: false, message: "Not sent" };
        try {
          waRes = await sendWhatsAppMessage(booking.contactPhone, message);
          console.log(`[CRON] Cancelled booking ${booking.bookingCode} and sent WA:`, waRes);
        } catch (waError: any) {
          console.error(`[CRON] Failed to send WA for ${booking.bookingCode}:`, waError.message);
          waRes = { success: false, message: waError.message };
        }
        bookingsExpired++;
        details.push({ code: booking.bookingCode, action: 'CANCEL', wa: waRes });
      } else if (shouldRemind) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            lastReminderLevel: nextLevel,
            reminderSentAt: now
          }
        });
        let waRes = { success: false, message: "Not sent" };
        try {
          waRes = await sendWhatsAppMessage(booking.contactPhone, message);
          console.log(`[CRON] Reminded (L${nextLevel}) booking ${booking.bookingCode} and sent WA:`, waRes);
        } catch (waError: any) {
          console.error(`[CRON] Failed to send WA reminder for ${booking.bookingCode}:`, waError.message);
          waRes = { success: false, message: waError.message };
        }
        remindersSent++;
        details.push({ code: booking.bookingCode, action: `REMIND_L${nextLevel}`, wa: waRes });
      }
    }

    return NextResponse.json({
      success: true,
      time: now.toISOString(),
      remindersSent,
      bookingsExpired,
      details
    });
  } catch (error: any) {
    console.error("[CRON] Error:", error);
    console.error("[CRON] Stack:", error.stack);
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        hasCronSecret: !!process.env.CRON_SECRET
      }
    }, { status: 500 });
  }
}
