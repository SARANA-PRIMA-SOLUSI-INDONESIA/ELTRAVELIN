"use client";

import { createTemplate, getVehicles } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import Link from "next/link";

function NewTemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get("routeId") || "";
  
  const [loading, setLoading] = useState(false);
  const [departureTime, setDepartureTime] = useState("08:00");
  const [arrivalTime, setArrivalTime] = useState("11:30");
  const [price, setPrice] = useState(175000);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    getVehicles().then(v => {
      setVehicles(v);
      if (v.length > 0) setVehicleId(v[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeId) return;

    setLoading(true);
    try {
      await createTemplate({
        routeId,
        departureTime,
        arrivalTime,
        price: Number(price),
        vehicleId,
      });
      router.push("/admin/master");
    } catch (error) {
      alert("Gagal membuat template: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/master" className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Tambah Jam Keberangkatan</h1>
          <p className="text-sm text-foreground/60">Tambahkan jam keberangkatan rutin untuk rute ini.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Jam Keberangkatan</label>
            <input 
              type="time" 
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Jam Tiba (Estimasi)</label>
            <input 
              type="time" 
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Harga Tiket (Rp)</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Pilih Armada Mobil</label>
            <select 
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm cursor-pointer"
              required
            >
              <option value="" disabled>-- Pilih Mobil --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.plateNumber}) - {v.capacity} Kursi</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !routeId}
          className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Template"}
        </button>
      </form>
    </div>
  );
}

export default function NewTemplate() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewTemplateForm />
    </Suspense>
  );
}
