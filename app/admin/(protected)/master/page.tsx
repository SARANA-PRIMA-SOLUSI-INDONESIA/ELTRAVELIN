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
            <div className="bg-surface-low px-8 py-6 flex justify-between items-center border-b border-outline-ghost">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center">
                  <i className="ri-route-line text-navy-deep"></i>
                </div>
                <h2 className="text-xl font-display font-bold text-navy-deep">{route.origin} → {route.destination}</h2>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/master/new-template?routeId=${route.id}`}
                  className="text-xs font-bold text-navy-deep bg-white px-4 py-2 rounded-lg border border-outline-ghost hover:bg-surface-medium transition-all"
                >
                  Tambah Jam
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
