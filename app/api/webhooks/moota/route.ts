import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendETicket } from "@/lib/mail";
import { sendBookingSuccessMessage } from "@/lib/whatsapp";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    let clientIp = forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1";

    if (clientIp.includes("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }

    console.log("[MOOTA WEBHOOK] IP:", clientIp);

    const bodyText = await request.text();
    const signature = request.headers.get("Signature");
    const secret = process.env.MOOTA_WEBHOOK_SECRET;

    if (secret) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(bodyText)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.warn("[MOOTA WEBHOOK] Invalid signature. Received:", signature, "Expected:", expectedSignature);
        return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
      }
    }

    const mutations = JSON.parse(bodyText);

    // Moota sends an array of mutations
    if (!Array.isArray(mutations)) {
      console.error("Invalid Moota webhook payload: Not an array");
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    console.log(`Received ${mutations.length} mutations from Moota`);

    for (const mutation of mutations) {
      // Only process "CR" (Credit/Incoming) mutations
      if (mutation.type !== "CR") continue;

      const amount = parseFloat(mutation.amount);
      console.log(`Processing mutation: ${amount} - ${mutation.description}`);

      // Find a pending booking with the EXACT same total price
      // This works because we added a 3-digit unique code
      const booking = await prisma.booking.findFirst({
        where: {
          totalPrice: amount,
          status: "PENDING",
          paymentMethod: "MOOTA",
        },
        orderBy: {
          createdAt: "desc", // Get the most recent one if duplicates exist (rare with unique code)
        },
      });

      if (booking) {
        console.log(`Matching booking found! Code: ${booking.bookingCode}`);

        // Update booking status to CONFIRMED
        const updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            settlementTime: new Date(),
          },
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

        // Send E-Ticket & WhatsApp notification asynchronously
        sendETicket(updatedBooking).catch(err => console.error("Error sending E-ticket:", err));
        sendBookingSuccessMessage(updatedBooking).catch(err => console.error("Error sending WA success:", err));

        console.log(`Booking ${booking.bookingCode} has been automatically confirmed and E-Ticket sent.`);
      } else {
        console.log(`No pending booking found for amount ${amount}`);
      }
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
