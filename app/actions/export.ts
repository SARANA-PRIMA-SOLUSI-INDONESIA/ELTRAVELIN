"use server";

import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function exportBookingsToExcel() {
  const bookings = await prisma.booking.findMany({
    include: {
      schedule: {
        include: { route: true }
      },
      seats: true,
      passengers: true
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = bookings.map(b => ({
    "Kode Booking": b.bookingCode,
    "Nama Kontak": b.contactName,
    "WhatsApp": b.contactPhone,
    "Email": b.contactEmail,
    "Rute": `${b.schedule.route.origin} -> ${b.schedule.route.destination}`,
    "Keberangkatan": new Date(b.schedule.departureTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    "Kursi": b.seats.map(s => s.seatNumber).join(", "),
    "Total Bayar": b.totalPrice,
    "Status": b.status,
    "Metode Pembayaran": b.paymentMethod,
    "Waktu Pesan": new Date(b.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  
  // Convert buffer to base64 for transfer
  return buffer.toString("base64");
}
