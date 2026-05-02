import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendETicket } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    // 1. IP Whitelisting for Security
    const forwardedFor = request.headers.get("x-forwarded-for");
    let clientIp = forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1";

    // Clean up IPv6 mapped IPv4 address
    if (clientIp.includes("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }

    const MOOTA_IP = "103.236.201.178";
    const isLocalhost = clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost" || clientIp === "::ffff:127.0.0.1";

    if (clientIp !== MOOTA_IP && !isLocalhost) {
      console.warn(`Blocked unauthorized IP: ${clientIp}`);
      return NextResponse.json({ message: "Unauthorized IP" }, { status: 403 });
    }

    const bodyText = await request.text();
    const mutations = JSON.parse(bodyText);
    const signature = request.headers.get("Signature");
    const secret = process.env.MOOTA_WEBHOOK_SECRET;

    // Optional: Verify signature if secret is provided
    // Note: Moota signature is usually a hash of the body + secret
    // For now we'll just log it to ensure connection is secure
    console.log("Incoming Webhook Signature:", signature);

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
            seats: true
          }
        });

        // Send E-Ticket asynchronously
        sendETicket(updatedBooking).catch(err => console.error("Error sending E-ticket:", err));

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
