import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import TourServiceForm from "@/components/admin/TourServiceForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTourServicePage({ params }: PageProps) {
  const { id } = await params;

  const [service, vehicles] = await Promise.all([
    prisma.tourService.findUnique({ where: { id } }),
    prisma.vehicle.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, plateNumber: true },
    }),
  ]);

  if (!service) return notFound();

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tour"
          className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all"
        >
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Edit Layanan</h1>
          <p className="text-sm text-foreground/60">/{service.slug}</p>
        </div>
      </div>

      <TourServiceForm
        vehicles={vehicles}
        initial={{
          id: service.id,
          type: service.type,
          name: service.name,
          shortDesc: service.shortDesc || "",
          description: service.description || "",
          destinations: service.destinations || "",
          durationLabel: service.durationLabel || "",
          durationDays: service.durationDays,
          durationNights: service.durationNights,
          itinerary: service.itinerary || "",
          facilities: service.facilities || "",
          includes: service.includes || "",
          excludes: service.excludes || "",
          basePrice: service.basePrice,
          priceUnit: service.priceUnit,
          minPax: service.minPax,
          maxPax: service.maxPax,
          vehicleId: service.vehicleId,
          imageUrl: service.imageUrl || "",
          gallery: service.gallery || "",
          isActive: service.isActive,
          isFeatured: service.isFeatured,
          sortOrder: service.sortOrder,
        }}
      />
    </div>
  );
}
