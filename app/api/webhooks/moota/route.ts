import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendETicket, sendAdminNotification } from "@/lib/mail";
import { sendBookingSuccessMessage, sendAdminWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();

    console.log("[Moota] Webhook received, body length:", bodyText.length);

    const mutations = JSON.parse(bodyText);

    if (!Array.isArray(mutations)) {
      console.error("[Moota] Invalid payload: Not an array");
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    console.log(`[Moota] Received ${mutations.length} mutations`);

    for (const mutation of mutations) {
      console.log(`[Moota] Mutation: type=${mutation.type}, amount=${mutation.amount}, desc=${mutation.description}, account=${mutation.account_number}`);

      if (mutation.type !== "CR") {
        console.log(`[Moota] Skipping non-CR mutation`);
        continue;
      }

      const amount = parseFloat(mutation.amount);
      console.log(`[Moota] Looking for PENDING+MOOTA booking with totalPrice=${amount}`);

      const booking = await prisma.booking.findFirst({
        where: {
          totalPrice: amount,
          status: "PENDING",
          paymentMethod: "MOOTA",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!booking) {
        console.log(`[Moota] No pending booking found for amount ${amount}`);

        const allPending = await prisma.booking.findMany({
          where: { status: "PENDING", paymentMethod: "MOOTA" },
          select: { bookingCode: true, totalPrice: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
        console.log(`[Moota] Current PENDING+MOOTA bookings:`, JSON.stringify(allPending));
        continue;
      }

      if (booking.status === "CONFIRMED") {
        console.log(`[Moota] Booking ${booking.bookingCode} already confirmed, skipping`);
        continue;
      }

      console.log(`[Moota] MATCH! Booking ${booking.bookingCode}, updating to CONFIRMED`);

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          settlementTime: new Date(),
        },
        include: {
          schedule: {
            include: {
              route: true,
            },
          },
          seats: true,
          passengers: true,
        },
      });

      sendETicket(updatedBooking).catch((err) => console.error("[Moota] Error sending E-ticket:", err));
      sendBookingSuccessMessage(updatedBooking).catch((err) => console.error("[Moota] Error sending WA:", err));
      sendAdminNotification(updatedBooking).catch((err) => console.error("[Moota] Error sending admin email:", err));
      sendAdminWhatsAppNotification(updatedBooking).catch((err) => console.error("[Moota] Error sending admin WA:", err));

      console.log(`[Moota] Booking ${booking.bookingCode} confirmed, E-Ticket sent`);
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error) {
    console.error("[Moota] Webhook Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
