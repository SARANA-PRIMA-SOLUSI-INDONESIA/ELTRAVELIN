import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PriceEdit from "@/components/admin/PriceEdit";
import ScheduleActions from "@/components/admin/ScheduleActions";

export default async function AdminSchedules() {
  const routes = await prisma.route.findMany({
    include: {
      schedules: {
        where: { isDeleted: false },
        orderBy: {
          departureTime: 'asc'
        },
        take: 10, // Just show a few for now
        include: {
          _count: {
            select: { seats: { where: { status: 'BOOKED' } } }
          }
        }
      }
    }
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Manajemen Jadwal</h1>
          <p className="text-foreground/60">Kelola keberangkatan dan harga tiket untuk semua rute.</p>
        </div>
        <button className="btn-primary px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
          <i className="ri-add-line"></i>
          Tambah Jadwal
        </button>
      </div>

      <div className="flex flex-col gap-12">
        {routes.map((route) => (
          <div key={route.id} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <h2 className="text-xl font-display font-bold text-navy-deep">{route.origin} → {route.destination}</h2>
               <div className="h-[2px] flex-1 bg-surface-medium"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {route.schedules.length === 0 ? (
                <div className="col-span-full py-10 text-center bg-white rounded-3xl border-2 border-dashed border-outline-ghost">
                  <p className="text-sm text-foreground/40 font-medium">Belum ada jadwal untuk rute ini.</p>
                </div>
              ) : (
                route.schedules.map((s) => (
                  <div key={s.id} className="bg-white p-8 rounded-[2rem] shadow-sm flex flex-col gap-6 border border-transparent hover:border-gold-soft transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-2xl font-display font-bold text-navy-deep">
                          {s.departureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Jam Berangkat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/admin/schedules/${s.id}/seats`}
                          className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all"
                          title="Okupansi Kursi"
                        >
                          <i className="ri-layout-grid-line"></i>
                        </Link>
                        <ScheduleActions scheduleId={s.id} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground/60">Status Kursi</span>
                        <span className="font-bold text-navy-deep">{s._count.seats} / {s.capacity} Terisi</span>
                      </div>
                      <div className="w-full h-2 bg-surface-low rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-navy-deep transition-all" 
                          style={{ width: `${(s._count.seats / s.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-outline-ghost flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Harga Tiket</span>
                        <PriceEdit scheduleId={s.id} initialPrice={s.price} />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${s.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {s.isActive ? 'Aktif' : 'Nonaktif'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
