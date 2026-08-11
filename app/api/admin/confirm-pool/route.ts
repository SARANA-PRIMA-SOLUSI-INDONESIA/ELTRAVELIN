import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendETicket, sendAdminNotification } from "@/lib/mail";
import { sendBookingSuccessMessage, sendAdminWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const { bookingCode } = await request.json();

    if (!bookingCode) {
      return NextResponse.json({ error: "bookingCode diperlukan" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        schedule: { include: { route: true } },
        seats: true,
        passengers: true,
        segment: {
          include: {
            originStop: true,
            destinationStop: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: `Booking sudah ${booking.status}` }, { status: 400 });
    }

    if (booking.paymentMethod !== "POOL") {
      return NextResponse.json({ error: "Hanya booking POOL yang dapat dikonfirmasi di sini" }, { status: 400 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        settlementTime: new Date(),
      },
      include: {
        schedule: { include: { route: true } },
        seats: true,
        passengers: true,
        segment: {
          include: {
            originStop: true,
            destinationStop: true,
          },
        },
      },
    });

    sendETicket(updatedBooking).catch((err) => console.error("[ConfirmPool] Error sending E-ticket:", err));
    sendBookingSuccessMessage(updatedBooking).catch((err) => console.error("[ConfirmPool] Error sending WA:", err));
    sendAdminNotification(updatedBooking).catch((err) => console.error("[ConfirmPool] Error sending admin email:", err));
    sendAdminWhatsAppNotification(updatedBooking).catch((err) => console.error("[ConfirmPool] Error sending admin WA:", err));

    return NextResponse.json({
      success: true,
      message: "Pembayaran POOL berhasil dikonfirmasi",
      booking: {
        id: updatedBooking.id,
        bookingCode: updatedBooking.bookingCode,
        status: updatedBooking.status,
        contactName: updatedBooking.contactName,
        contactPhone: updatedBooking.contactPhone,
        contactEmail: updatedBooking.contactEmail,
      },
    });
  } catch (error) {
    console.error("ConfirmPool Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
