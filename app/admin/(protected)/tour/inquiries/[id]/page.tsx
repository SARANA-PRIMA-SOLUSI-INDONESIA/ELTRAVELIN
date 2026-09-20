import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canManageTourDiscount, TOUR_INQUIRY_STATUS_LABELS, TOUR_PRICE_UNIT_LABELS, TOUR_QUOTE_STATUS_LABELS, TOUR_TYPE_LABELS, formatIDR } from "@/lib/tour";
import TourQuoteForm from "@/components/admin/TourQuoteForm";
import TourQuoteActions from "@/components/admin/TourQuoteActions";
import TourConvertForm from "@/components/admin/TourConvertForm";
import TourInquiryRejectButton from "@/components/admin/TourInquiryRejectButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TourInquiryDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [inquiry, session] = await Promise.all([
    prisma.tourInquiry.findUnique({
      where: { id },
      include: {
        service: true,
        quotes: { orderBy: { createdAt: "desc" }, include: { bookings: true } },
        bookings: { orderBy: { createdAt: "desc" } },
      },
    }),
    getSession(),
  ]);

  if (!inquiry) return notFound();

  const canDiscount = canManageTourDiscount(session?.role);
  const openQuote = inquiry.quotes.find((q) => q.status === "DRAFT" || q.status === "SENT");
  const hasActiveBooking = inquiry.bookings.some((b) => b.status !== "CANCELLED");
  const isClosed = inquiry.status === "CONVERTED" || inquiry.status === "REJECTED" || inquiry.status === "EXPIRED";

  const rows: Array<[string, string]> = [
    ["Layanan", `${inquiry.service.name} (${TOUR_TYPE_LABELS[inquiry.service.type]})`],
    ["Tanggal", new Date(inquiry.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) + (inquiry.endDate ? ` s/d ${new Date(inquiry.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}` : "")],
    ["Jumlah Peserta", `${inquiry.paxCount} orang`],
    ["Jumlah Unit", `${inquiry.unitCount} unit`],
    ["Penjemputan", inquiry.pickupLocation || "-"],
    ["Estimasi Awal", formatIDR(inquiry.basePrice)],
    ["Catatan Customer", inquiry.notes || "-"],
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tour/inquiries"
            className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all"
          >
            <i className="ri-arrow-left-line"></i>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-display font-bold text-navy-deep">{inquiry.inquiryCode}</h1>
            <p className="text-sm text-foreground/60">
              {TOUR_INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status} •{" "}
              {new Date(inquiry.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" })}
            </p>
          </div>
        </div>
        {!isClosed && !hasActiveBooking && (
          <TourInquiryRejectButton inquiryId={inquiry.id} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-6">
            <h2 className="text-xl font-display font-bold text-navy-deep">Detail Permintaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Nama Pemesan</span>
                <span className="text-sm font-bold text-navy-deep">{inquiry.customerName}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Kontak</span>
                <span className="text-sm font-bold text-navy-deep">{inquiry.customerPhone}</span>
                <span className="text-xs text-foreground/50">{inquiry.customerEmail || "-"}</span>
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
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-6">
            <h2 className="text-xl font-display font-bold text-navy-deep">Riwayat Penawaran</h2>
            {inquiry.quotes.length === 0 ? (
              <p className="text-sm text-foreground/40">Belum ada penawaran.</p>
            ) : (
              inquiry.quotes.map((quote) => (
                <div key={quote.id} className="bg-surface-low p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-navy-deep">{quote.quoteNumber}</span>
                      <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                        {TOUR_QUOTE_STATUS_LABELS[quote.status] || quote.status} •{" "}
                        {new Date(quote.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                      </span>
                    </div>
                    <TourQuoteActions quoteId={quote.id} status={quote.status} hasBooking={quote.bookings.length > 0} />
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Harga Satuan ({TOUR_PRICE_UNIT_LABELS[inquiry.service.priceUnit]})</span>
                      <span className="font-medium text-navy-deep">{formatIDR(quote.pricePerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Jumlah Unit</span>
                      <span className="font-medium text-navy-deep">{quote.unitCount} unit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Subtotal</span>
                      <span className="font-medium text-navy-deep">{formatIDR(quote.subtotal)}</span>
                    </div>
                    {quote.subtotal - quote.totalPrice > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon{quote.discountReason ? ` (${quote.discountReason})` : ""}</span>
                        <span className="font-bold">- {formatIDR(quote.subtotal - quote.totalPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-outline-ghost pt-2 mt-1">
                      <span className="font-bold text-navy-deep">Total</span>
                      <span className="font-bold text-navy-deep text-lg">{formatIDR(quote.totalPrice)}</span>
                    </div>
                    {quote.validUntil && (
                      <span className="text-[10px] text-foreground/40">
                        Berlaku sampai {new Date(quote.validUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  {quote.bookings.length > 0 && (
                    <Link
                      href={`/admin/tour/bookings/${quote.bookings[0].id}`}
                      className="text-xs font-bold text-gold-warm hover:opacity-80 transition-all"
                    >
                      Lihat Booking {quote.bookings[0].bookingCode} →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          {!isClosed && !openQuote && (
            <TourQuoteForm
              inquiryId={inquiry.id}
              basePrice={inquiry.service.basePrice}
              paxCount={inquiry.paxCount}
              unitCount={inquiry.unitCount}
              startDate={inquiry.startDate.toISOString()}
              endDate={inquiry.endDate ? inquiry.endDate.toISOString() : null}
              priceUnit={inquiry.service.priceUnit}
              canDiscount={canDiscount}
            />
          )}

          {openQuote && !hasActiveBooking && (
            <TourConvertForm quoteId={openQuote.id} />
          )}

          {hasActiveBooking && inquiry.bookings[0] && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-4">
              <h2 className="text-lg font-display font-bold text-navy-deep">Booking Terkait</h2>
              <Link
                href={`/admin/tour/bookings/${inquiry.bookings[0].id}`}
                className="btn-primary py-4 rounded-xl font-bold text-sm text-center"
              >
                {inquiry.bookings[0].bookingCode}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
