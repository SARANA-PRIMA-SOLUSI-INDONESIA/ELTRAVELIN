import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TOUR_PAYMENT_METHOD_LABELS,
  TOUR_TYPE_LABELS,
  formatIDR,
} from "@/lib/tour";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu Bayar",
  CONFIRMED: "Terkonfirmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-orange-500/10 text-orange-600",
  CONFIRMED: "bg-green-500/10 text-green-600",
  COMPLETED: "bg-navy-deep text-white",
  CANCELLED: "bg-red-500/10 text-red-600",
};

export default async function TourBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status && params.status !== "ALL" ? params.status : undefined;

  const bookings = await prisma.tourBooking.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Booking Tour & Sewa</h1>
          <p className="text-foreground/60">Kelola booking, verifikasi pembayaran manual, dan input booking walk-in.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/tour"
            className="px-6 py-4 rounded-xl font-bold text-sm bg-white border border-outline-ghost text-navy-deep hover:border-gold-soft transition-all flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Katalog
          </Link>
          <Link
            href="/admin/tour/bookings/new"
            className="btn-primary px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Booking Manual
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <Link
            key={item}
            href={`/admin/tour/bookings?status=${item}`}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              (status || "ALL") === item
                ? "bg-navy-deep text-white shadow-lg"
                : "bg-white border border-outline-ghost text-foreground/60 hover:text-navy-deep"
            }`}
          >
            {item === "ALL" ? "Semua" : STATUS_LABELS[item]}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {bookings.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost">
            <p className="text-sm text-foreground/40 font-medium">Belum ada booking pada filter ini.</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/admin/tour/bookings/${booking.id}`}
              className="bg-white p-7 rounded-[2rem] shadow-sm border border-transparent hover:border-gold-soft transition-all flex flex-col lg:flex-row lg:items-center gap-6"
            >
              <div className="flex flex-col gap-1 min-w-0 lg:w-1/5">
                <span className="text-sm font-bold text-navy-deep">{booking.bookingCode}</span>
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                  {new Date(booking.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              <div className="flex flex-col gap-1 min-w-0 lg:w-1/5">
                <span className="text-sm font-bold text-navy-deep truncate">{booking.customerName}</span>
                <span className="text-xs text-foreground/50 truncate">{booking.customerPhone}</span>
              </div>

              <div className="flex flex-col gap-1 min-w-0 lg:w-1/5">
                <span className="text-sm font-medium text-navy-deep truncate">{booking.serviceName}</span>
                <span className="text-xs text-foreground/50">
                  {TOUR_TYPE_LABELS[booking.serviceType]} • {booking.paxCount} pax • {booking.unitCount} unit
                </span>
              </div>

              <div className="flex flex-col gap-1 min-w-0 lg:w-1/5">
                <span className="text-sm font-bold text-navy-deep">{formatIDR(booking.totalPrice)}</span>
                <span className="text-xs text-foreground/50 truncate">
                  {booking.paymentMethod ? TOUR_PAYMENT_METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod : "Belum dipilih"}
                </span>
              </div>

              <div className="flex items-center gap-3 lg:ml-auto">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${STATUS_STYLES[booking.status] || "bg-foreground/10 text-foreground/50"}`}>
                  {STATUS_LABELS[booking.status] || booking.status}
                </span>
                <i className="ri-arrow-right-line text-foreground/30 hidden lg:block"></i>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
