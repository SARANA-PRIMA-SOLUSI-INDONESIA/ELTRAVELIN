import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || from;
  const schedules = await prisma.schedule.findMany({ where: { isDeleted: false, departureTime: { gte: new Date(`${from}T00:00:00+07:00`), lte: new Date(`${to}T23:59:59+07:00`) } }, orderBy: { departureTime: "asc" }, include: { route: true, operatingTrip: { include: { driver: true } }, bookings: { where: { status: { not: "CANCELLED" } }, select: { id: true } } } });
  const rows = schedules.map((schedule) => ({ "Tanggal": schedule.departureTime.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }), "Jam Berangkat": schedule.departureTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }), "Jam Tiba": schedule.arrivalTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }), "Asal": schedule.route.origin, "Tujuan": schedule.route.destination, "Driver": schedule.operatingTrip?.driver?.name || "Belum ditugaskan", "Telepon Driver": schedule.operatingTrip?.driver?.phone || "-", "Jumlah Booking": schedule.bookings.length, "Status": schedule.operatingTrip?.status || "-" }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Jadwal Driver");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="jadwal-driver-${from}-${to}.xlsx"` } });
}
