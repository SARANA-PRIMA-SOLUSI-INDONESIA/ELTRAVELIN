import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import TourBookingActions from "@/components/admin/TourBookingActions";
import {
  TOUR_PAYMENT_METHOD_LABELS,
  TOUR_TYPE_LABELS,
  formatIDR,
} from "@/lib/tour";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  CONFIRMED: "Terkonfirmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export default async function TourBookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const booking = await prisma.tourBooking.findUnique({
    where: { id },
    include: { service: true, inquiry: true, quote: true },
  });

  if (!booking) return notFound();

  const dateFmt = (value: Date | null | undefined) =>
    value
      ? value.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" })
      : "-";

  const rows: Array<[string, string]> = [
    ["Layanan", `${booking.serviceName} (${TOUR_TYPE_LABELS[booking.serviceType]})`],
    ["Tanggal Mulai", new Date(booking.startDate).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })],
    ["Tanggal Selesai", booking.endDate ? new Date(booking.endDate).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }) : "-"],
    ["Jumlah Peserta", `${booking.paxCount} orang`],
    ["Jumlah Unit", `${booking.unitCount} unit`],
    ["Penjemputan", booking.pickupLocation || "-"],
    ["Harga Dasar", formatIDR(booking.basePrice)],
    ["Diskon", booking.discountAmount > 0 ? `- ${formatIDR(booking.discountAmount)}${booking.discountReason ? ` (${booking.discountReason})` : ""}` : "-"],
    ["Total", formatIDR(booking.totalPrice)],
    ["Metode Bayar", booking.paymentMethod ? TOUR_PAYMENT_METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod : "-"],
    ["Dibuat", dateFmt(booking.createdAt)],
    ["Dibayar / Dikonfirmasi", dateFmt(booking.settlementTime)],
    ["Diverifikasi Oleh", booking.verifiedBy ? `${booking.verifiedBy} • ${dateFmt(booking.verifiedAt)}` : "-"],
    ["Catatan Internal", booking.notes || "-"],
    ["Catatan Pembayaran", booking.paymentNote || "-"],
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tour/bookings"
            className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all"
          >
            <i className="ri-arrow-left-line"></i>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-display font-bold text-navy-deep">{booking.bookingCode}</h1>
            <p className="text-sm text-foreground/60">{STATUS_LABELS[booking.status] || booking.status}</p>
          </div>
        </div>
        {booking.status === "CONFIRMED" && (
          <Link
            href={`/invoice/${booking.bookingCode}`}
            className="px-6 py-4 rounded-xl font-bold text-sm bg-white border border-outline-ghost text-navy-deep hover:border-gold-soft transition-all flex items-center gap-2"
          >
            <i className="ri-file-text-line"></i>
            Lihat Invoice
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-6">
            <h2 className="text-xl font-display font-bold text-navy-deep">Detail Booking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Nama Pemesan</span>
                <span className="text-sm font-bold text-navy-deep">{booking.customerName}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Kontak</span>
                <span className="text-sm font-bold text-navy-deep">{booking.customerPhone}</span>
                <span className="text-xs text-foreground/50">{booking.customerEmail || "-"}</span>
              </div>
            </div>
            <div className="bg-surface-low p-6 rounded-2xl flex flex-col gap-3 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6">
                  <span className="text-foreground/60 shrink-0">{label}</span>
                  <span className="font-medium text-navy-deep text-right">{value}</span>
                </div>
              ))}
            </div>
            {booking.paymentProofUrl && (
              <a
                href={booking.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-gold-warm hover:opacity-80 transition-all"
              >
                Lihat Bukti Transfer →
              </a>
            )}
          </div>

          {booking.quoteId && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-4">
              <h2 className="text-lg font-display font-bold text-navy-deep">Penawaran Terkait</h2>
              <Link
                href={`/admin/tour/inquiries/${booking.inquiryId}`}
                className="text-sm font-bold text-gold-warm hover:opacity-80 transition-all"
              >
                {booking.quote?.quoteNumber} →
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost">
            <TourBookingActions bookingId={booking.id} status={booking.status} />
          </div>

          {booking.inquiryId && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-2">
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Permintaan Asal</span>
              <Link
                href={`/admin/tour/inquiries/${booking.inquiryId}`}
                className="text-sm font-bold text-navy-deep hover:text-gold-warm transition-all"
              >
                {booking.inquiry?.inquiryCode || booking.inquiryId}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
