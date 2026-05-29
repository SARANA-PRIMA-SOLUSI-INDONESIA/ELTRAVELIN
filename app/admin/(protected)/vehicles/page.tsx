import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VehicleToggle from "@/components/admin/VehicleToggle";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminVehicles() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Manajemen Armada</h1>
          <p className="text-foreground/60">Kelola armada kendaraan dan kapasitas kursi untuk operasional perjalanan.</p>
        </div>
        <Link href="/admin/vehicles/new" className="btn-primary px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
          <i className="ri-add-line"></i>
          Tambah Armada Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vehicles.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-medium flex items-center justify-center text-navy-deep">
              <i className="ri-bus-line text-2xl"></i>
            </div>
            <p className="text-sm text-foreground/40 font-medium">Belum ada armada terdaftar.</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-transparent hover:border-gold-soft transition-all flex flex-col gap-6 group">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-display font-bold text-navy-deep tracking-wider uppercase">{vehicle.plateNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Plat Nomor</span>
                    {vehicle.isActive ? (
                      <span className="text-[9px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Aktif</span>
                    ) : (
                      <span className="text-[9px] bg-foreground/10 text-foreground/60 px-2 py-0.5 rounded-full font-bold uppercase">Nonaktif</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <VehicleToggle id={vehicle.id} initialStatus={vehicle.isActive} />
                  <Link
                    href={`/admin/vehicles/edit?id=${vehicle.id}`}
                    className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-500 flex items-center justify-center hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
                  >
                    <i className="ri-edit-line text-sm"></i>
                  </Link>
                  <DeleteButton id={vehicle.id} type="vehicle" />
                </div>
              </div>

              <div className="bg-surface-low p-6 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Nama Mobil</span>
                  <span className="font-bold text-navy-deep truncate max-w-[180px]">{vehicle.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Kapasitas Kursi</span>
                  <span className="font-bold text-navy-deep">{vehicle.capacity} Kursi</span>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-ghost flex justify-between items-center text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                <span>Daftar Sejak</span>
                <span>{new Date(vehicle.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
