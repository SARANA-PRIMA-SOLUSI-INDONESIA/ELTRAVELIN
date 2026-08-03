import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendETicket, sendAdminNotification } from "@/lib/mail";
import { sendBookingSuccessMessage, sendAdminWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const { bookingCode, amount } = await request.json();

    if (!bookingCode && !amount) {
      return NextResponse.json(
        { error: "bookingCode atau amount diperlukan" },
        { status: 400 }
      );
    }

    // Cari booking
    let booking;
    if (bookingCode) {
      booking = await prisma.booking.findUnique({
        where: { bookingCode },
        include: {
          schedule: { include: { route: true } },
          seats: true,
          passengers: true
        }
      });
    } else {
      // Cari berdasarkan amount
      booking = await prisma.booking.findFirst({
        where: {
          totalPrice: amount,
          status: "PENDING",
          paymentMethod: "MOOTA"
        },
        orderBy: { createdAt: "desc" },
        include: {
          schedule: { include: { route: true } },
          seats: true,
          passengers: true
        }
      });
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan atau sudah dibayar" },
        { status: 404 }
      );
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `Booking status ${booking.status}, hanya PENDING yang bisa disimulasikan` },
        { status: 400 }
      );
    }

    // Update booking ke CONFIRMED
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        settlementTime: new Date()
      },
      include: {
        schedule: { include: { route: true } },
        seats: true,
        passengers: true
      }
    });

    // Kirim notifikasi
    sendETicket(updatedBooking).catch(err => console.error("Error sending E-ticket:", err));
    sendBookingSuccessMessage(updatedBooking).catch(err => console.error("Error sending WA:", err));
    sendAdminNotification(updatedBooking).catch(err => console.error("Error sending admin email:", err));
    sendAdminWhatsAppNotification(updatedBooking).catch(err => console.error("Error sending admin WA:", err));

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil disimulasikan",
      booking: {
        id: updatedBooking.id,
        bookingCode: updatedBooking.bookingCode,
        status: updatedBooking.status,
        totalPrice: updatedBooking.totalPrice,
        contactName: updatedBooking.contactName
      }
    });

  } catch (error) {
    console.error("Simulate Moota Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
