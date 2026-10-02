import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TOUR_INQUIRY_STATUS_LABELS,
  TOUR_TYPE_LABELS,
  formatIDR,
} from "@/lib/tour";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_FILTERS = ["ALL", "NEW", "QUOTED", "ACCEPTED", "REJECTED", "CONVERTED", "EXPIRED"];

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-600",
  QUOTED: "bg-gold-soft text-navy-deep",
  ACCEPTED: "bg-green-500/10 text-green-600",
  REJECTED: "bg-red-500/10 text-red-600",
  CONVERTED: "bg-navy-deep text-white",
  EXPIRED: "bg-foreground/10 text-foreground/50",
};

export default async function TourInquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status && params.status !== "ALL" ? params.status : undefined;

  const inquiries = await prisma.tourInquiry.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      service: { select: { name: true, type: true, priceUnit: true } },
      quotes: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { quotes: true, bookings: true } },
    },
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Permintaan Tour & Sewa</h1>
          <p className="text-foreground/60">Daftar permintaan penawaran dari customer.</p>
        </div>
        <Link
          href="/admin/tour"
          className="px-6 py-4 rounded-xl font-bold text-sm bg-white border border-outline-ghost text-navy-deep hover:border-gold-soft transition-all flex items-center gap-2"
        >
          <i className="ri-arrow-left-line"></i>
          Kembali ke Katalog
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <Link
            key={item}
            href={`/admin/tour/inquiries?status=${item}`}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              (status || "ALL") === item
                ? "bg-navy-deep text-white shadow-lg"
                : "bg-white border border-outline-ghost text-foreground/60 hover:text-navy-deep"
            }`}
          >
            {item === "ALL" ? "Semua" : TOUR_INQUIRY_STATUS_LABELS[item] || item}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {inquiries.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost">
            <p className="text-sm text-foreground/40 font-medium">Belum ada permintaan pada filter ini.</p>
          </div>
        ) : (
          inquiries.map((inquiry) => {
            const latestQuote = inquiry.quotes[0];
            return (
              <Link
                key={inquiry.id}
                href={`/admin/tour/inquiries/${inquiry.id}`}
                className="bg-white p-7 rounded-[2rem] shadow-sm border border-transparent hover:border-gold-soft transition-all flex flex-col lg:flex-row lg:items-center gap-6"
              >
                <div className="flex flex-col gap-1 min-w-0 lg:w-1/4">
                  <span className="text-sm font-bold text-navy-deep">{inquiry.inquiryCode}</span>
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                    {new Date(inquiry.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>

                <div className="flex flex-col gap-1 min-w-0 lg:w-1/4">
                  <span className="text-sm font-bold text-navy-deep truncate">{inquiry.customerName}</span>
                  <span className="text-xs text-foreground/50 truncate">{inquiry.customerPhone}</span>
                </div>

                <div className="flex flex-col gap-1 min-w-0 lg:w-1/4">
                  <span className="text-sm font-medium text-navy-deep truncate">{inquiry.service.name}</span>
                  <span className="text-xs text-foreground/50">
                    {TOUR_TYPE_LABELS[inquiry.service.type]} • {inquiry.paxCount} pax • {inquiry.unitCount} unit
                  </span>
                </div>

                <div className="flex flex-row lg:flex-col items-start lg:items-end gap-3 lg:ml-auto">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${STATUS_STYLES[inquiry.status] || "bg-foreground/10 text-foreground/50"}`}>
                    {TOUR_INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}
                  </span>
                  {latestQuote ? (
                    <span className="text-xs font-bold text-navy-deep">{formatIDR(latestQuote.totalPrice)}</span>
                  ) : (
                    <span className="text-xs text-foreground/40">Belum ada quote</span>
                  )}
                </div>

                <i className="ri-arrow-right-line text-foreground/30 hidden lg:block"></i>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
