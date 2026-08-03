"use server";

import { sendETicket, sendAdminNotification } from "@/lib/mail";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const DEFAULT_TEST_EMAIL = process.env.ADMIN_EMAIL || "muhamadanasmustopa1112@gmail.com";
const DEFAULT_TEST_PHONE = process.env.ADMIN_PHONE || "081220262366";

function buildTestBooking(email: string) {
  return {
    bookingCode: `EL-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    contactName: "Anas Mustopa (TEST)",
    contactEmail: email,
    contactPhone: DEFAULT_TEST_PHONE,
    totalPrice: 175000,
    discountAmount: 0,
    paymentMethod: "TEST",
    status: "CONFIRMED",
    createdAt: new Date(),
    settlementTime: new Date(),
    seats: [{ seatNumber: "A1" }, { seatNumber: "A2" }],
    passengers: [{ name: "Test Passenger 1" }, { name: "Test Passenger 2" }],
    schedule: {
      departureTime: new Date(Date.now() + 86400000),
      route: {
        origin: "Bandung (Ahmad Yani/Cicadas)",
        destination: "Jakarta (Kuningan)"
      }
    }
  };
}

export async function sendTestETicket(formData: FormData) {
  const email = (formData.get("email") as string) || DEFAULT_TEST_EMAIL;

  try {
    const booking = buildTestBooking(email);
    await sendETicket(booking);
    return { success: true, message: `E-Ticket test berhasil dikirim ke ${email}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendTestAdminNotification(formData: FormData) {
  const email = (formData.get("email") as string) || DEFAULT_TEST_EMAIL;

  try {
    const booking = buildTestBooking(email);
    await sendAdminNotification(booking);
    return { success: true, message: `Notifikasi admin test berhasil dikirim ke ${DEFAULT_TEST_EMAIL}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendTestWA(to: string, message: string) {
  try {
    const result = await sendWhatsAppMessage(to, message);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
