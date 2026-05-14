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
    "Tgl Pesan": new Date(b.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    "Kode Booking": b.bookingCode,
    "Pemesan": b.contactName,
    "Telepon": b.contactPhone,
    "Email": b.contactEmail || '-',
    "Penumpang": b.passengers?.map((p: any) => p.name).join(', ') || '-',
    "Kursi": b.seats?.length > 0 ? b.seats.map((s: any) => s.seatNumber).sort((a: any, b: any) => a - b).join(', ') : '-',
    "Jam Berangkat": new Date(b.schedule.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
    "Tgl Berangkat": new Date(b.schedule.departureTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    "Asal": b.schedule.route.origin,
    "Tujuan": b.schedule.route.destination,
    "Total Bayar": b.totalPrice,
    "Status": b.status,
    "Metode": b.paymentMethod || 'UNSET',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  
  // Convert buffer to base64 for transfer
  return buffer.toString("base64");
}
