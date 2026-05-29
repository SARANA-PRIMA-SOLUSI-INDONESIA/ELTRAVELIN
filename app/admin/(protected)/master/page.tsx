import { prisma } from "@/lib/prisma";
import { triggerSyncSchedules, deleteTemplate, updateTemplateStatus, deleteRoute } from "@/app/actions/admin-master";
import SyncButton from "@/components/admin/SyncButton";
import TemplateToggle from "@/components/admin/TemplateToggle";
import DeleteButton from "@/components/admin/DeleteButton";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminMaster() {
  const routes = await prisma.route.findMany({
    where: { isDeleted: false },
    include: {
      stops: {
        orderBy: {
          sequence: 'asc'
        }
      },
      scheduleTemplates: {
        orderBy: {
          departureTime: 'asc'
        }
      }
    }
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Jadwal Master</h1>
          <p className="text-foreground/60">Kelola pola keberangkatan rutin (Template) untuk setiap rute.</p>
        </div>
        <div className="flex gap-4">
          <SyncButton />
          <Link href="/admin/master/new-route" className="btn-primary px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
            <i className="ri-add-line"></i>
            Tambah Rute
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {routes.map((route: any) => (
          <div key={route.id} className="bg-white rounded-[2.5rem] shadow-sm border border-outline-ghost overflow-hidden">
            <div className="bg-surface-low px-8 py-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b border-outline-ghost">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center">
                    <i className="ri-route-line text-navy-deep"></i>
                  </div>
                  <h2 className="text-xl font-display font-bold text-navy-deep">{route.origin} → {route.destination}</h2>
                </div>
                {route.stops && route.stops.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-foreground/40 pl-14 uppercase tracking-wider">
                    {route.stops.map((stop: any, idx: number) => (
                      <span key={stop.id} className="flex items-center gap-2">
                        <span className="hover:text-gold-warm transition-colors">{stop.name}</span>
                        {idx < route.stops.length - 1 && <i className="ri-arrow-right-double-line text-gold-warm"></i>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2.5 pl-14 sm:pl-0">
                 <Link
                   href={`/admin/master/stops?routeId=${route.id}`}
                   className="text-xs font-bold text-navy-deep bg-white px-4 py-2.5 rounded-xl border border-outline-ghost hover:bg-gold-soft hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                 >
                   <i className="ri-map-pin-line text-sm"></i>
                   Kelola Titik
                 </Link>
                 <Link
                   href={`/admin/master/new-template?routeId=${route.id}`}
                   className="text-xs font-bold text-white bg-navy-deep px-4 py-2.5 rounded-xl border border-transparent hover:bg-gold-warm transition-all flex items-center gap-1.5 shadow-sm"
                 >
                   <i className="ri-add-line text-sm"></i>
                   Tambah Jam
                 </Link>
                 <Link
                   href={`/admin/master/edit-route?id=${route.id}`}
                   className="text-xs font-bold text-yellow-500 bg-white px-4 py-2.5 rounded-xl border border-yellow-400 hover:bg-yellow-500 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                 >
                   <i className="ri-edit-line text-sm"></i>
                   Edit Rute
                 </Link>
                 <DeleteButton id={route.id} type="route" />
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {route.scheduleTemplates.length === 0 ? (
                  <div className="col-span-full py-12 text-center flex flex-col items-center gap-4">
                    <p className="text-sm text-foreground/40 font-medium">Belum ada template jadwal untuk rute ini.</p>
                  </div>
                ) : (
                  route.scheduleTemplates.map((t: any) => (
                    <div key={t.id} className="bg-surface-low p-6 rounded-2xl flex flex-col gap-4 border border-transparent hover:border-gold-soft transition-all group">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-2xl font-display font-bold text-navy-deep">{t.departureTime}</span>
                          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Keberangkatan Rutin</span>
                        </div>
                        <div className="flex gap-2">
                          <TemplateToggle id={t.id} initialStatus={t.isActive} />
                          <Link
                            href={`/admin/master/edit-template?id=${t.id}`}
                            className="text-xs font-bold text-yellow-500 bg-white px-3 py-2 rounded-lg border border-yellow-400 hover:bg-yellow-500 hover:text-white transition-all"
                          >
                            <i className="ri-edit-line text-sm"></i>
                          </Link>
                          <DeleteButton id={t.id} type="template" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground/40">Harga</span>
                          <span className="font-bold text-navy-deep">Rp {t.price.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground/40">Armada</span>
                          <span className="font-bold text-navy-deep">{t.vehicleType} ({t.capacity} Kursi)</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-4 border-t border-outline-ghost flex">
                        <Link
                          href={`/admin/master/stops-template?templateId=${t.id}`}
                          className="flex-grow text-center text-xs font-bold text-navy-deep bg-white py-2.5 rounded-xl border border-outline-ghost hover:bg-gold-soft hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <i className="ri-map-pin-time-line text-sm"></i>
                          Atur Jam Singgah
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
