import { prisma } from "@/lib/prisma";
import RouteCard from "@/components/RouteCard";

export const dynamic = 'force-dynamic';

export default async function Routes() {
  const dbRoutes = await prisma.route.findMany({
    where: {
      isDeleted: false,
      scheduleTemplates: { some: { isActive: true } },
    },
    include: {
      stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } },
      schedules: {
        where: {
          isActive: true,
          isDeleted: false
        },
        orderBy: {
          price: 'asc'
        },
        take: 1
      }
    }
  });

  // Map database routes to the format expected by RouteCard
  const routes = dbRoutes.map((r: any) => ({
    from: r.origin,
    to: r.destination,
    price: r.schedules[0]?.price.toLocaleString('id-ID') || "65.000",
    image: r.destination.toLowerCase().includes('kualanamu') 
      ? "/kualanamu.png" 
      : r.origin.toLowerCase().includes('siantar') 
        ? "/siantar.png" 
        : "/medan.png"
  }));

  return (
    <div className="flex flex-col gap-24 pb-32">
      <section className="px-6 md:px-12 lg:px-24 pt-16">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest leading-none">Catalog Perjalanan</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-navy-deep">Jelajahi <span className="italic font-light">Eksklusivitas</span> Rute Kami</h1>
            <p className="text-lg text-foreground/60 font-body">
              Kami menghubungkan kota-kota utama di Sumatera Utara dengan standar kenyamanan tertinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {routes.map((route: any, i: number) => (
              <RouteCard key={i} {...route} />
            ))}
          </div>
        </div>
      </section>

      <section className="tonal-section py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-display font-bold text-navy-deep">Ingin Rute Khusus?</h2>
            <p className="text-foreground/60 max-w-md font-body">Layanan sewa armada kami tersedia untuk perjalanan bisnis, acara keluarga, atau wisata khusus Anda.</p>
          </div>
          <button className="btn-primary px-8 py-4 rounded-full font-bold text-sm shadow-md uppercase tracking-widest">
            Hubungi Concierge
          </button>
        </div>
      </section>
    </div>
  );
}
