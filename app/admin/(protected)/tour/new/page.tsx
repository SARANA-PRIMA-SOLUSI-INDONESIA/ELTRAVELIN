import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TourServiceForm from "@/components/admin/TourServiceForm";

export const dynamic = "force-dynamic";

export default async function NewTourServicePage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, plateNumber: true },
  });

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
          <h1 className="text-3xl font-display font-bold text-navy-deep">Tambah Layanan Baru</h1>
          <p className="text-sm text-foreground/60">Paket tour atau sewa harian dengan harga fleksibel.</p>
        </div>
      </div>

      <TourServiceForm vehicles={vehicles} />
    </div>
  );
}
