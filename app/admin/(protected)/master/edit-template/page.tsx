"use client";

import { getTemplateById, updateTemplate, getVehicles } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

function EditTemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [price, setPrice] = useState(0);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routeName, setRouteName] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTemplateById(id),
      getVehicles()
    ]).then(([template, v]) => {
      if (template) {
        setDepartureTime(template.departureTime);
        setArrivalTime(template.arrivalTime);
        
        // Calculate price automatically by summing stop prices
        const stops = template.route.stops || [];
        const sum = stops.reduce((acc: number, stop: any) => acc + (stop.price || 0), 0);
        setPrice(sum);
        
        setVehicleId(template.vehicleId);
        setRouteName(`${template.route.origin} → ${template.route.destination}`);
      }
      setVehicles(v);
      setFetching(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    try {
      await updateTemplate(id, {
        departureTime,
        arrivalTime,
        price: Number(price),
        vehicleId,
      });
      router.push("/admin/master");
    } catch (error) {
      alert("Gagal mengupdate template: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-24">
        <p className="text-sm text-foreground/40 font-medium">Memuat data template...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/master" className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Edit Template Jadwal</h1>
          <p className="text-sm text-foreground/60">
            Rute: <span className="font-bold text-gold-warm">{routeName}</span>
          </p>
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
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Harga Tiket (Otomatis dari Rute)</label>
            <input
              type="text"
              value={`Rp ${price.toLocaleString('id-ID')}`}
              className="bg-surface-low text-foreground/45 rounded-xl px-4 py-4 text-sm outline-none border-none cursor-not-allowed font-bold"
              disabled
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

        <div className="flex gap-4">
          <Link
            href="/admin/master"
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

export default function EditTemplate() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Loading...</div>}>
      <EditTemplateForm />
    </Suspense>
  );
}