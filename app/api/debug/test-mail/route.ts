import { sendETicket } from "@/lib/mail";
import { NextResponse } from "next/server";

export async function GET() {
  const testBooking = {
    contactEmail: "muhamadanasmustopa1112@gmail.com",
    contactName: "Anas Mustopa",
    bookingCode: "EL-TEST-123",
    totalPrice: 175000,
    seats: [{ seatNumber: "1A" }, { seatNumber: "1B" }],
    schedule: {
      departureTime: new Date(),
      route: {
        origin: "Bandung (Ahmad Yani/Cicadas)",
        destination: "Jakarta (Kuningan)"
      }
    }
  };

  console.log("Attempting to send test email to:", testBooking.contactEmail);

  try {
    await sendETicket(testBooking);
    return NextResponse.json({ 
      message: "Test E-Ticket sent successfully to muhamadanasmustopa1112@gmail.com!",
      note: "Check your spam folder if it doesn't appear in the inbox."
    });
  } catch (error: any) {
    console.error("Test Mail Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
