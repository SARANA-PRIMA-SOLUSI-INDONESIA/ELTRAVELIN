"use client";

import { getTemplateById, updateTemplate, getVehicles } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import TimeInput from "@/components/admin/TimeInput";
import { showError } from "@/lib/swal";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function EditTemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [capacity, setCapacity] = useState(15);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routeName, setRouteName] = useState("");
  const [routeId, setRouteId] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getTemplateById(id), getVehicles()]).then(([template, v]) => {
      if (template) {
        setDepartureTime(template.departureTime);
        setArrivalTime(template.arrivalTime);
        setCapacity(template.capacity || 15);
        setVehicleId(template.vehicleId || "");
        setRouteName(template.route.origin + " → " + template.route.destination);
        setRouteId(template.routeId || template.route?.id || "");
        setSelectedDay(template.dayOfWeek ?? null);
      }
      setVehicles(v);
      setFetching(false);
    });
  }, [id]);

  const backHref = routeId ? `/admin/master#route-${routeId}` : "/admin/master";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      await updateTemplate(id, { departureTime, arrivalTime, capacity: Number(capacity), vehicleId: vehicleId || undefined, dayOfWeek: selectedDay ?? undefined });
      router.push(backHref);
    } catch (error) { await showError({ title: "Gagal", text: "Gagal: " + (error as Error).message }); } finally { setLoading(false); }
  };

  if (fetching) return (<div className="flex items-center justify-center p-24"><p className="text-sm text-foreground/40">Memuat...</p></div>);

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all"><i className="ri-arrow-left-line"></i></Link>
        <div><h1 className="text-3xl font-display font-bold text-navy-deep">Edit Template Jadwal</h1><p className="text-sm text-foreground/60">Rute: <span className="font-bold text-gold-warm">{routeName}</span></p></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Hari Berlaku</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelectedDay(null)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedDay === null ? "bg-navy-deep text-white" : "bg-surface-low text-gray-600 hover:bg-gray-200"}`}>Semua Hari</button>
            {DAYS.map((name, idx) => (
              <button type="button" key={idx} onClick={() => setSelectedDay(idx)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedDay === idx ? "bg-navy-deep text-white" : "bg-surface-low text-gray-600 hover:bg-gray-200"}`}>{name}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Jam Keberangkatan</label>
            <TimeInput value={departureTime} onChange={setDepartureTime} required />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Jam Tiba (Estimasi)</label>
            <TimeInput value={arrivalTime} onChange={setArrivalTime} required />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Kapasitas Kursi</label>
            <input type="number" min="1" max="99" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm font-bold" required />
            <p className="text-[10px] text-foreground/40">Jumlah kursi. Default 15.</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Armada (Opsional)</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="bg-surface-low rounded-xl px-4 py-4 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm cursor-pointer">
              <option value="">-- Tanpa Armada --</option>
              {vehicles.map(v => (<option key={v.id} value={v.id}>{v.name} ({v.plateNumber}) - {v.capacity} Kursi</option>))}
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href={backHref} className="flex-1 bg-surface-low rounded-xl py-4 font-bold text-sm text-navy-deep text-center border border-outline-ghost hover:bg-surface-medium transition-all">Batal</Link>
          <button type="submit" disabled={loading} className="flex-1 btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan Perubahan"}</button>
        </div>
      </form>
    </div>
  );
}

export default function EditTemplate() { return (<Suspense fallback={<div className="p-24 text-center">Loading...</div>}><EditTemplateForm /></Suspense>); }
