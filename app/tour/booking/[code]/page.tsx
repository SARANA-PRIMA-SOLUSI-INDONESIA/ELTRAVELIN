import { getTourBookingByCode } from "@/app/actions/tour";
import TourBookingPayment from "@/components/TourBookingPayment";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TOUR_PAYMENT_METHOD_LABELS,
  TOUR_TYPE_LABELS,
  formatIDR,
} from "@/lib/tour";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const metadata = {
  title: "Detail Booking | EL Travel",
};

export default async function TourBookingPage({ params }: PageProps) {
  const { code } = await params;
  const booking = await getTourBookingByCode(decodeURIComponent(code));
  if (!booking) return notFound();

  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
  const isPending = booking.status === "PENDING";
  const isCancelled = booking.status === "CANCELLED";

  const period =
    new Date(booking.startDate).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }) +
    (booking.endDate
      ? ` s/d ${new Date(booking.endDate).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}`
      : "");

  return (
    <div className="flex flex-col gap-10 px-6 md:px-12 lg:px-24 py-12 max-w-4xl mx-auto w-full">
      <div className="flex flex-col items-center gap-4 text-center">
        {isConfirmed ? (
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
            <i className="ri-check-line text-4xl text-white"></i>
          </div>
        ) : isCancelled ? (
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
            <i className="ri-close-line text-4xl text-white"></i>
          </div>
        ) : (
          <div className="w-20 h-20 bg-gold-warm rounded-full flex items-center justify-center shadow-lg shadow-gold-warm/20 animate-pulse">
            <i className="ri-time-line text-4xl text-white"></i>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-black text-navy-deep tracking-tight">
            {isConfirmed ? "Booking Terkonfirmasi!" : isCancelled ? "Booking Dibatalkan" : "Menunggu Pembayaran"}
          </h1>
          <p className="text-sm text-foreground/60 font-body max-w-md mx-auto">
            {isConfirmed
              ? "Pembayaran Anda telah kami terima. Tim kami akan menghubungi Anda menjelang tanggal perjalanan."
              : isCancelled
                ? "Booking ini telah dibatalkan. Silakan ajukan permintaan baru bila masih berminat."
                : "Segera selesaikan pembayaran sesuai instruksi di bawah ini."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-ambient border border-gray-100 overflow-hidden">
        <div className="bg-navy-deep/5 p-6 border-b border-dashed border-gray-200 flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kode Booking</span>
          <span className="text-lg font-display font-bold text-navy-deep">#{booking.bookingCode}</span>
        </div>
        <div className="p-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-8 text-left">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Layanan</span>
              <span className="text-sm font-bold text-navy-deep">{booking.serviceName}</span>
              <span className="text-xs text-foreground/50">{TOUR_TYPE_LABELS[booking.serviceType]}</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pemesan</span>
              <span className="text-sm font-bold text-navy-deep">{booking.customerName}</span>
              <span className="text-xs text-foreground/50">{booking.customerPhone}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-left bg-surface-low p-6 rounded-2xl text-sm">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</span>
                <span className="font-medium text-navy-deep">{period}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peserta</span>
                <span className="font-medium text-navy-deep">{booking.paxCount} orang</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jumlah Unit</span>
                <span className="font-medium text-navy-deep">{booking.unitCount} unit</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Penjemputan</span>
                <span className="font-medium text-navy-deep">{booking.pickupLocation || "-"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metode Bayar</span>
                <span className="font-medium text-navy-deep">
                  {booking.paymentMethod ? TOUR_PAYMENT_METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod : "Belum dipilih"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm border-t border-dashed border-gray-200 pt-6">
            <div className="flex justify-between">
              <span className="text-foreground/60">Subtotal</span>
              <span className="font-medium text-navy-deep">{formatIDR(booking.basePrice)}</span>
            </div>
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon{booking.discountReason ? ` (${booking.discountReason})` : ""}</span>
                <span className="font-bold">- {formatIDR(booking.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-navy-deep">Total</span>
              <span className="text-2xl font-display font-black text-navy-deep">{formatIDR(booking.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {isPending && (
        <TourBookingPayment
          bookingCode={booking.bookingCode}
          paymentMethod={booking.paymentMethod}
          totalPrice={booking.totalPrice}
          hasProof={Boolean(booking.paymentProofUrl)}
        />
      )}

      {isConfirmed && (
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href={`/invoice/${booking.bookingCode}`}
            className="flex items-center justify-center gap-2 bg-navy-deep text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-navy-deep/90 transition-all shadow-lg shadow-navy-deep/20"
          >
            <i className="ri-file-text-line"></i>
            Lihat Invoice / Bukti Pembayaran
          </Link>
          <a
            href="https://wa.me/62811221286"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white border border-outline-ghost text-navy-deep px-8 py-4 rounded-2xl font-bold text-sm hover:border-gold-soft transition-all"
          >
            <i className="ri-whatsapp-line text-lg"></i>
            Hubungi Concierge
          </a>
        </div>
      )}

      <div className="flex justify-center">
        <Link href="/tour" className="text-gold-warm font-bold text-sm uppercase tracking-widest hover:opacity-80 transition-all">
          Kembali ke Katalog Tour & Sewa
        </Link>
      </div>
    </div>
  );
}
