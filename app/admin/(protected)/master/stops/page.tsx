"use client";

import { createRouteStop, deleteRouteStop, getRouteWithStops, reorderRouteStops } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

function StopsManagerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get("routeId") || "";

  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  
  // Form fields
  const [name, setName] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [insertSequence, setInsertSequence] = useState<number>(1);

  // Load route and stops
  const loadData = async () => {
    if (!routeId) return;
    try {
      const data = await getRouteWithStops(routeId);
      if (data) {
        setRoute(data);
        setStops(data.stops || []);
        setInsertSequence((data.stops?.length || 0) + 1);
      }
    } catch (error) {
      console.error("Gagal memuat rute:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [routeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeId || !name) return;

    setLoading(true);
    try {
      await createRouteStop(routeId, name, Number(insertSequence), stopTime || undefined);
      setName("");
      setStopTime("");
      await loadData();
    } catch (error) {
      alert("Gagal menambahkan titik singgah: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus titik singgah ini?")) return;

    try {
      await deleteRouteStop(id);
      await loadData();
    } catch (error) {
      alert("Gagal menghapus titik singgah: " + (error as any).message);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newStops = [...stops];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    // Swap stops
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    try {
      await reorderRouteStops(routeId, newStops.map(s => s.id));
      await loadData();
    } catch (error) {
      alert("Gagal mengubah urutan: " + (error as any).message);
    }
  };

  if (!route) {
    return (
      <div className="flex items-center justify-center p-24">
        <p className="text-sm text-foreground/40 font-medium">Memuat data rute...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/master" className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Kelola Titik Singgah</h1>
          <p className="text-sm text-foreground/60">
            Atur jalur dan rute singgah untuk perjalanan: <span className="font-bold text-gold-warm">{route.origin} → {route.destination}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Add Stop Form */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] shadow-sm border border-outline-ghost flex flex-col gap-6">
          <h2 className="text-lg font-display font-bold text-navy-deep">Tambah / Sisipkan Titik</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Nama Titik / Pool</label>
              <input 
                type="text" 
                placeholder="Contoh: Buah Batu / Cileunyi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-surface-low rounded-xl px-4 py-3.5 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Estimasi Jam Singgah (Opsional)</label>
              <input 
                type="time" 
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                className="bg-surface-low rounded-xl px-4 py-3.5 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Urutan Jalur (Sequence)</label>
              <select 
                value={insertSequence}
                onChange={(e) => setInsertSequence(Number(e.target.value))}
                className="bg-surface-low rounded-xl px-4 py-3.5 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm cursor-pointer"
              >
                {Array.from({ length: stops.length + 1 }, (_, i) => i + 1).map((seq) => (
                  <option key={seq} value={seq}>
                    {seq === stops.length + 1 ? `Ke-${seq} (Terakhir)` : `Sisipkan di Ke-${seq}`}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-foreground/40 mt-1 leading-normal">
                Memilih nomor di tengah rute akan menggeser urutan titik setelahnya secara otomatis.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary py-3.5 rounded-xl font-bold text-sm shadow-md mt-2 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan & Terapkan"}
            </button>
          </form>
        </div>

        {/* Right: Interactive Timeline View */}
        <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost">
          <h2 className="text-lg font-display font-bold text-navy-deep mb-8">Peta Jalur Singgah ({stops.length} Titik)</h2>

          {stops.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-low flex items-center justify-center text-foreground/20">
                <i className="ri-map-pin-line text-2xl"></i>
              </div>
              <p className="text-sm text-foreground/40 font-medium">Belum ada titik singgah pada rute ini.</p>
              <p className="text-xs text-foreground/30 max-w-xs leading-normal">Gunakan form di sebelah kiri untuk mendefinisikan perhentian pertama Anda.</p>
            </div>
          ) : (
            <div className="relative pl-10 border-l-2 border-surface-medium flex flex-col gap-6 ml-4">
              {stops.map((stop, index) => (
                <div key={stop.id} className="relative group">
                  {/* Timeline Point Dot */}
                  <div className="absolute -left-[51px] top-4 w-6 h-6 rounded-full bg-gold-soft border-4 border-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-2 h-2 rounded-full bg-gold-warm"></div>
                  </div>

                  {/* Stop Box card */}
                  <div className="bg-surface-low border border-transparent hover:border-gold-soft hover:shadow-ambient rounded-2xl p-5 flex items-center justify-between transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">Titik Ke-{stop.sequence}</span>
                      <h3 className="text-base font-display font-bold text-navy-deep uppercase">{stop.name}</h3>
                      {stop.stopTime && (
                        <span className="text-xs text-foreground/50 font-medium flex items-center gap-1.5 mt-0.5">
                          <i className="ri-time-line text-xs"></i> Estimasi Jam: {stop.stopTime} WIB
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-lg bg-white border border-outline-ghost text-navy-deep hover:bg-navy-deep hover:text-white disabled:opacity-35 transition-all flex items-center justify-center"
                        title="Naikkan Urutan"
                      >
                        <i className="ri-arrow-up-line"></i>
                      </button>
                      <button 
                        onClick={() => handleMove(index, "down")}
                        disabled={index === stops.length - 1}
                        className="w-8 h-8 rounded-lg bg-white border border-outline-ghost text-navy-deep hover:bg-navy-deep hover:text-white disabled:opacity-35 transition-all flex items-center justify-center"
                        title="Turunkan Urutan"
                      >
                        <i className="ri-arrow-down-line"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(stop.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center ml-2"
                        title="Hapus Titik"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StopsManager() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Loading Stops Manager...</div>}>
      <StopsManagerForm />
    </Suspense>
  );
}
