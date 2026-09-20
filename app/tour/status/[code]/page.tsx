import { getTourInquiryByCode } from "@/app/actions/tour";
import TourQuoteDecision from "@/components/TourQuoteDecision";
import TourCodeLookup from "@/components/TourCodeLookup";
import Link from "next/link";
import {
  TOUR_INQUIRY_STATUS_LABELS,
  TOUR_QUOTE_STATUS_LABELS,
  TOUR_TYPE_LABELS,
  formatIDR,
} from "@/lib/tour";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const metadata = {
  title: "Status Permintaan | EL Travel",
};

export default async function TourStatusPage({ params }: PageProps) {
  const { code } = await params;
  const inquiry = await getTourInquiryByCode(decodeURIComponent(code));

  if (!inquiry) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-low flex items-center justify-center">
          <i className="ri-file-search-line text-3xl text-foreground/30"></i>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-display font-bold text-navy-deep">Permintaan Tidak Ditemukan</h1>
          <p className="text-sm text-foreground/60 font-body">
            Periksa kembali kode permintaan Anda, atau masukkan kode di bawah ini.
          </p>
        </div>
        <TourCodeLookup />
      </div>
    );
  }

  const openQuote = inquiry.quotes.find((quote) => quote.status === "SENT");
  const acceptedQuote = inquiry.quotes.find((quote) => quote.status === "ACCEPTED");
  const booking = inquiry.bookings[0];

  const dateRange =
    new Date(inquiry.startDate).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }) +
    (inquiry.endDate
      ? ` s/d ${new Date(inquiry.endDate).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}`
      : "");

  return (
    <div className="flex flex-col gap-10 px-6 md:px-12 lg:px-24 py-12 max-w-4xl mx-auto w-full">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Status Permintaan</span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-navy-deep">{inquiry.inquiryCode}</h1>
        <span className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-navy-deep text-white">
          {TOUR_INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}
        </span>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-display font-bold text-navy-deep">{inquiry.service.name}</h2>
          <span className="text-xs text-foreground/50">
            {TOUR_TYPE_LABELS[inquiry.service.type] || inquiry.service.type}
          </span>
        </div>
        <div className="bg-surface-low p-6 rounded-2xl flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-foreground/60">Tanggal</span>
            <span className="font-medium text-navy-deep text-right">{dateRange}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-foreground/60">Jumlah Peserta</span>
            <span className="font-medium text-navy-deep text-right">{inquiry.paxCount} orang</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-foreground/60">Jumlah Unit</span>
            <span className="font-medium text-navy-deep text-right">{inquiry.unitCount} unit</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-foreground/60">Penjemputan</span>
            <span className="font-medium text-navy-deep text-right">{inquiry.pickupLocation || "-"}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-foreground/60">Estimasi Awal</span>
            <span className="font-medium text-navy-deep text-right">{formatIDR(inquiry.basePrice)}</span>
          </div>
        </div>
      </div>

      {openQuote && (
        <TourQuoteDecision
          quoteId={openQuote.id}
          totalPrice={openQuote.totalPrice}
          discountAmount={openQuote.subtotal - openQuote.totalPrice}
          discountReason={openQuote.discountReason}
          validUntil={openQuote.validUntil ? openQuote.validUntil.toISOString() : null}
        />
      )}

      {!openQuote && !acceptedQuote && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col items-center gap-3 text-center">
          <i className="ri-time-line text-3xl text-gold-warm"></i>
          <h2 className="text-lg font-display font-bold text-navy-deep">Menunggu Penawaran</h2>
          <p className="text-sm text-foreground/60 font-body max-w-md">
            Tim kami sedang menyiapkan penawaran terbaik untuk Anda. Penawaran akan dikirim
            melalui WhatsApp dan email yang terdaftar.
          </p>
        </div>
      )}

      {acceptedQuote && !booking && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost text-center">
          <p className="text-sm text-foreground/60">
            Penawaran telah diterima. Booking Anda sedang diproses oleh tim kami.
          </p>
        </div>
      )}

      {booking && (
        <div className="bg-navy-deep text-white p-8 rounded-[2.5rem] flex flex-col gap-4">
          <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest">Booking Anda</span>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-display font-bold">{booking.bookingCode}</span>
              <span className="text-xs text-white/60">
                Total {formatIDR(booking.totalPrice)} • Status {booking.status}
              </span>
            </div>
            <Link
              href={`/tour/booking/${booking.bookingCode}`}
              className="bg-white text-navy-deep px-6 py-4 rounded-2xl font-bold text-sm text-center hover:bg-gold-soft transition-all"
            >
              Lihat Detail & Bayar
            </Link>
          </div>
        </div>
      )}

      {inquiry.quotes.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-gold-warm uppercase tracking-widest">Riwayat Penawaran</h2>
          {inquiry.quotes.map((quote) => (
            <div key={quote.id} className="bg-white p-6 rounded-2xl border border-outline-ghost flex flex-col gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-navy-deep">{quote.quoteNumber}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                  {TOUR_QUOTE_STATUS_LABELS[quote.status] || quote.status}
                </span>
              </div>
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal</span>
                <span>{formatIDR(quote.subtotal)}</span>
              </div>
              {quote.subtotal - quote.totalPrice > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>- {formatIDR(quote.subtotal - quote.totalPrice)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-navy-deep border-t border-outline-ghost pt-2">
                <span>Total</span>
                <span>{formatIDR(quote.totalPrice)}</span>
              </div>
            </div>
          ))}
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
