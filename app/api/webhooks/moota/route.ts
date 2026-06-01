import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendETicket } from "@/lib/mail";
import { sendBookingSuccessMessage } from "@/lib/whatsapp";
import { createHmac, timingSafeEqual } from "node:crypto";

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get("Signature");
    const secret = process.env.MOOTA_WEBHOOK_SECRET;

    if (!secret) {
      console.error("MOOTA_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    if (!signature) {
      console.error("Missing Signature header from Moota");
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const expectedSignature = createHmac("sha256", secret).update(bodyText).digest("hex");

    console.log("[Moota Debug] Header Signature:", signature);
    console.log("[Moota Debug] Expected Signature:", expectedSignature);
    console.log("[Moota Debug] Body length:", bodyText.length);

    if (signature !== expectedSignature) {
      console.error("[Moota Debug] Signature mismatch!");
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const mutations = JSON.parse(bodyText);

    if (!Array.isArray(mutations)) {
      console.error("Invalid Moota webhook payload: Not an array");
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    console.log(`Received ${mutations.length} mutations from Moota`);

    for (const mutation of mutations) {
      if (mutation.type !== "CR") continue;

      const amount = parseFloat(mutation.amount);
      console.log(`Processing mutation: ${amount} - ${mutation.description}`);

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
        console.log(`No pending booking found for amount ${amount}`);
        continue;
      }

      if (booking.status === "CONFIRMED") {
        console.log(`Booking ${booking.bookingCode} already confirmed, skipping`);
        continue;
      }

      console.log(`Matching booking found! Code: ${booking.bookingCode}`);

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

      sendETicket(updatedBooking).catch((err) => console.error("Error sending E-ticket:", err));
      sendBookingSuccessMessage(updatedBooking).catch((err) => console.error("Error sending WA success:", err));

      console.log(`Booking ${booking.bookingCode} has been automatically confirmed and E-Ticket sent.`);
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
