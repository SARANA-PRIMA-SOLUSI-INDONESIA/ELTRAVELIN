"use client";

import { createTemplate, getVehicles, getRouteWithStops } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import TimeInput from "@/components/admin/TimeInput";
import { showError } from "@/lib/swal";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function NewTemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get("routeId") || "";
  const [loading, setLoading] = useState(false);
  const [departureTime, setDepartureTime] = useState("08:00");
  const [arrivalTime, setArrivalTime] = useState("11:30");
  const [price, setPrice] = useState(0);
  const [capacity, setCapacity] = useState(15);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => { getVehicles().then(v => setVehicles(v)); }, []);

  useEffect(() => {
    if (!routeId) return;
    getRouteWithStops(routeId).then((routeData: any) => {
      if (routeData && routeData.stops) {
        const sum = routeData.stops
          .filter((stop: any) => stop.isActive !== false)
          .reduce((acc: number, stop: any) => acc + (stop.price || 0), 0);
        setPrice(sum);
      }
    });
  }, [routeId]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeId) return;
    setLoading(true);
    try {
      if (selectedDays.length === 0) {
        await createTemplate({ routeId, departureTime, arrivalTime, price: Number(price), capacity: Number(capacity), vehicleId: vehicleId || undefined });
      } else {
        for (const day of selectedDays) {
          await createTemplate({ routeId, departureTime, arrivalTime, price: Number(price), capacity: Number(capacity), vehicleId: vehicleId || undefined, dayOfWeek: day });
        }
      }
      router.push(routeId ? `/admin/master#route-${routeId}` : "/admin/master");
    } catch (error) { await showError({ title: "Gagal", text: "Gagal: " + (error as Error).message }); } finally { setLoading(false); }
  };

  const backHref = routeId ? `/admin/master#route-${routeId}` : "/admin/master";

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all"><i className="ri-arrow-left-line"></i></Link>
        <div><h1 className="text-3xl font-display font-bold text-navy-deep">Tambah Jam Keberangkatan</h1><p className="text-sm text-foreground/60">Tambahkan jam keberangkatan rutin untuk rute ini.</p></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Hari Berlaku</label>
          <p className="text-[11px] text-foreground/50">Kosongkan untuk berlaku setiap hari, atau pilih hari tertentu.</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((name, idx) => (
              <button type="button" key={idx} onClick={() => toggleDay(idx)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedDays.includes(idx) ? "bg-navy-deep text-white" : "bg-surface-low text-gray-600 hover:bg-gray-200"}`}>{name}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2"><label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Jam Keberangkatan</label><TimeInput value={departureTime} onChange={setDepartureTime} required /></div>
          <div className="flex flex-col gap-2"><label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Jam Tiba (Estimasi)</label><TimeInput value={arrivalTime} onChange={setArrivalTime} required /></div>
          <div className="flex flex-col gap-2"><label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Harga Tiket</label><input type="number" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm font-bold" required /><p className="text-[10px] text-foreground/40">Auto dari titik rute, bisa diubah.</p></div>
          <div className="flex flex-col gap-2"><label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Kapasitas Kursi</label><input type="number" min="1" max="99" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm font-bold" required /><p className="text-[10px] text-foreground/40">Default 15.</p></div>
          <div className="flex flex-col gap-2"><label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Armada (Opsional)</label><select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm cursor-pointer"><option value="">-- Tanpa Armada --</option>{vehicles.map(v => (<option key={v.id} value={v.id}>{v.name} ({v.plateNumber})</option>))}</select></div>
        </div>
        <button type="submit" disabled={loading || !routeId} className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan Template"}</button>
      </form>
    </div>
  );
}

export default function NewTemplate() { return (<Suspense fallback={<div>Loading...</div>}><NewTemplateForm /></Suspense>); }
