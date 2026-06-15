"use client";

import { getVehicleById, updateVehicle } from "@/app/actions/admin-vehicle";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

interface VehicleData {
  id: string;
  name: string;
  plateNumber: string;
  capacity: number;
  driverName?: string | null;
}

function EditVehicleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [capacity, setCapacity] = useState(15);

  useEffect(() => {
    if (!id) return;
    getVehicleById(id).then((vehicle: VehicleData | null) => {
      if (vehicle) {
        setName(vehicle.name);
        setPlateNumber(vehicle.plateNumber);
        setDriverName(vehicle.driverName || "");
        setCapacity(vehicle.capacity);
      } else {
        alert("Armada tidak ditemukan.");
        router.push("/admin/vehicles");
      }
      setFetching(false);
    }).catch(() => {
      alert("Gagal memuat data armada.");
      router.push("/admin/vehicles");
    });
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || !plateNumber || capacity <= 0) return;

    setLoading(true);
    try {
      await updateVehicle(id, {
        name,
        plateNumber,
        capacity: Number(capacity),
        driverName,
      });
      router.push("/admin/vehicles");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      alert("Gagal memperbarui armada: " + msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-24">
        <p className="text-sm text-foreground/40 font-medium">Memuat data armada...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/vehicles" className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Edit Detail Armada</h1>
          <p className="text-sm text-foreground/60">Perbarui informasi, plat nomor, atau kapasitas kursi armada.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Nama Armada / Model Mobil</label>
            <input 
              type="text" 
              placeholder="Contoh: Toyota Hiace Premio 01"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Nama Driver</label>
            <input 
              type="text" 
              placeholder="Contoh: Ahmad Subarjo"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Plat Nomor / Nomor Polisi</label>
              <input 
                type="text" 
                placeholder="Contoh: D 1234 EL"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none uppercase"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Kapasitas Kursi (Penumpang)</label>
              <input 
                type="number" 
                placeholder="Contoh: 11 atau 15"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/admin/vehicles"
            className="flex-1 bg-surface-low rounded-xl py-4 font-bold text-sm text-navy-deep text-center border border-outline-ghost hover:bg-surface-medium transition-all"
          >
            Batal
          </Link>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditVehicle() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Loading...</div>}>
      <EditVehicleForm />
    </Suspense>
  );
}
