import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canManageTourDiscount } from "@/lib/tour";
import TourBookingForm from "@/components/admin/TourBookingForm";

export const dynamic = "force-dynamic";

export default async function NewTourBookingPage() {
  const [services, session] = await Promise.all([
    prisma.tourService.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        basePrice: true,
        priceUnit: true,
        minPax: true,
        maxPax: true,
      },
    }),
    getSession(),
  ]);

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tour/bookings"
          className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all"
        >
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Booking Manual</h1>
          <p className="text-sm text-foreground/60">Input booking walk-in atau hasil deal via WhatsApp.</p>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost">
          <p className="text-sm text-foreground/40 font-medium">
            Belum ada layanan aktif. Tambahkan layanan terlebih dahulu di menu Tour & Sewa.
          </p>
        </div>
      ) : (
        <TourBookingForm services={services} canDiscount={canManageTourDiscount(session?.role)} />
      )}
    </div>
  );
}
