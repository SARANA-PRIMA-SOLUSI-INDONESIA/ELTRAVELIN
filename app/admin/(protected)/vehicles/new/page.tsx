"use client";

import { createVehicle } from "@/app/actions/admin-vehicle";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewVehicle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [capacity, setCapacity] = useState(15); // Default to a standard Hiace capacity of 15

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plateNumber || capacity <= 0) return;

    setLoading(true);
    try {
      await createVehicle({
        name,
        plateNumber,
        capacity: Number(capacity),
        driverName,
      });
      router.push("/admin/vehicles");
    } catch (error) {
      alert("Gagal menambahkan armada: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/vehicles" className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Tambah Armada Baru</h1>
          <p className="text-sm text-foreground/60">Daftarkan armada kendaraan baru untuk beroperasi.</p>
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

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Armada"}
        </button>
      </form>
    </div>
  );
}
