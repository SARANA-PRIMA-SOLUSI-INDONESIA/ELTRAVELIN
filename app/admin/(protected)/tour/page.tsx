import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "@/components/admin/DeleteButton";
import TourServiceToggle from "@/components/admin/TourServiceToggle";
import {
  TOUR_PRICE_UNIT_LABELS,
  TOUR_TYPE_LABELS,
  formatIDR,
} from "@/lib/tour";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminTourPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = params.tab === "rental" ? "DAILY_RENTAL" : "TOUR_PACKAGE";

  const [services, inquiryCounts, bookingCounts] = await Promise.all([
    prisma.tourService.findMany({
      where: { type: activeTab },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { inquiries: true, bookings: true } },
      },
    }),
    prisma.tourInquiry.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: "NEW" },
    }),
    prisma.tourBooking.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: "PENDING" },
    }),
  ]);

  const newInquiries = inquiryCounts[0]?._count._all || 0;
  const pendingBookings = bookingCounts[0]?._count._all || 0;

  const tabs = [
    { key: "tour", label: "Paket Tour", type: "TOUR_PACKAGE" },
    { key: "rental", label: "Sewa Harian", type: "DAILY_RENTAL" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Tour & Sewa</h1>
          <p className="text-foreground/60">Kelola katalog paket tour dan sewa harian, penawaran, dan booking.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/tour/inquiries"
            className="px-6 py-4 rounded-xl font-bold text-sm bg-white border border-outline-ghost text-navy-deep hover:border-gold-soft transition-all flex items-center gap-2"
          >
            <i className="ri-mail-open-line"></i>
            Permintaan
            {newInquiries > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{newInquiries}</span>
            )}
          </Link>
          <Link
            href="/admin/tour/bookings"
            className="px-6 py-4 rounded-xl font-bold text-sm bg-white border border-outline-ghost text-navy-deep hover:border-gold-soft transition-all flex items-center gap-2"
          >
            <i className="ri-calendar-check-line"></i>
            Booking
            {pendingBookings > 0 && (
              <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingBookings}</span>
            )}
          </Link>
          <Link
            href="/admin/tour/new"
            className="btn-primary px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Tambah Layanan
          </Link>
        </div>
      </div>

      <div className="flex gap-2 bg-surface-low p-2 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/tour?tab=${tab.key}`}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.type
                ? "bg-navy-deep text-white shadow-lg"
                : "text-foreground/60 hover:text-navy-deep"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost">
            <p className="text-sm text-foreground/40 font-medium">Belum ada layanan pada kategori ini.</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="min-w-0 overflow-hidden bg-white rounded-[2.5rem] shadow-sm border border-transparent hover:border-gold-soft transition-all flex flex-col">
              <div className="w-full aspect-video bg-surface-low relative overflow-hidden">
                {service.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="ri-image-line text-3xl text-foreground/20"></i>
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-navy-deep text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {TOUR_TYPE_LABELS[service.type]}
                </span>
                {service.isFeatured && (
                  <span className="absolute top-4 right-4 bg-gold-warm text-navy-deep text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Highlight
                  </span>
                )}
              </div>

              <div className="p-7 flex flex-col gap-5 flex-1">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-display font-bold text-navy-deep">{service.name}</h2>
                  <span className="text-xs text-foreground/50">
                    {service.durationLabel || (service.durationDays ? `${service.durationDays} hari` : "Fleksibel")}
                    {service.destinations ? ` • ${service.destinations}` : ""}
                  </span>
                </div>

                <div className="bg-surface-low p-5 rounded-2xl flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Mulai dari</span>
                    <span className="font-bold text-navy-deep">
                      {formatIDR(service.basePrice)}{" "}
                      <span className="text-[10px] font-medium text-foreground/40">
                        {TOUR_PRICE_UNIT_LABELS[service.priceUnit]}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Permintaan</span>
                    <span className="font-bold text-navy-deep">{service._count.inquiries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Booking</span>
                    <span className="font-bold text-navy-deep">{service._count.bookings}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-ghost mt-auto">
                  <TourServiceToggle
                    id={service.id}
                    initialActive={service.isActive}
                    initialFeatured={service.isFeatured}
                  />
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/tour/edit/${service.id}`}
                      className="w-9 h-9 rounded-lg bg-white border border-outline-ghost text-navy-deep hover:bg-navy-deep hover:text-white transition-all flex items-center justify-center"
                      title="Edit Layanan"
                    >
                      <i className="ri-pencil-line"></i>
                    </Link>
                    <DeleteButton id={service.id} type="tourService" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
