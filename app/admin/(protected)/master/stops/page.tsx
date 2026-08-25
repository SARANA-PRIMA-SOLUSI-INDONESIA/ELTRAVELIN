"use client";

import { createRouteStop, deleteRouteStop, getRouteWithStops, reorderRouteStops, updateRouteStopStatus, updateRouteStopFlags } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { confirmAction, showError } from "@/lib/swal";

function StopsManagerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get("routeId") || "";

  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [insertSequence, setInsertSequence] = useState<number>(1);
  const [canBoarding, setCanBoarding] = useState<boolean>(true);
  const [canAlighting, setCanAlighting] = useState<boolean>(true);

  const activeStops = stops.filter((stop) => stop.isActive !== false);

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
      await createRouteStop(routeId, name, Number(insertSequence), undefined, price, { canBoarding, canAlighting });
      setName("");
      setPrice(0);
      setCanBoarding(true);
      setCanAlighting(true);
      await loadData();
    } catch (error) {
      await showError({ title: "Gagal", text: "Gagal menambahkan titik singgah: " + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmAction({ title: "Hapus Titik", danger: true, text: "Apakah Anda yakin ingin menghapus titik singgah ini?" }))) return;

    try {
      const result = await deleteRouteStop(id);
      if (!result.success) {
        await showError({ title: "Gagal", text: result.error });
        return;
      }
      await loadData();
    } catch (error) {
      await showError({ title: "Gagal", text: "Gagal menghapus titik singgah: " + (error as Error).message });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateRouteStopStatus(id, !currentStatus);
      await loadData();
    } catch (error) {
      await showError({ title: "Gagal", text: "Gagal memperbarui status titik singgah: " + (error as Error).message });
    }
  };

  const handleToggleFlag = async (id: string, flag: "canBoarding" | "canAlighting", currentValue: boolean) => {
    try {
      await updateRouteStopFlags(id, { [flag]: !currentValue });
      await loadData();
    } catch (error) {
      await showError({ title: "Gagal", text: "Gagal memperbarui status titik singgah: " + (error as Error).message });
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
      await showError({ title: "Gagal", text: "Gagal mengubah urutan: " + (error as Error).message });
    }
  };

  if (!route) {
    return (
      <div className="flex items-center justify-center p-24">
        <p className="text-sm text-foreground/40 font-medium">Memuat data rute...</p>
      </div>
    );
  }

  const backHref = routeId ? `/admin/master#route-${routeId}` : "/admin/master";

  return (
    <div className="flex flex-col gap-10 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
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
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Harga dari Titik Sebelumnya (Rp)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="bg-surface-low rounded-xl px-4 py-3.5 text-sm outline-none border-none focus:ring-2 focus:ring-gold-warm"
              />
              <p className="text-[10px] text-foreground/40 mt-1 leading-normal">
                Harga untuk perjalanan dari titik sebelumnya ke titik ini. Titik pertama = 0.
              </p>
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

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Peran Titik</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCanBoarding((v) => !v)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all ${
                    canBoarding
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-surface-low border-outline-ghost text-foreground/40"
                  }`}
                >
                  <i className={`${canBoarding ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"} text-sm`}></i>
                  Titik Naik
                </button>
                <button
                  type="button"
                  onClick={() => setCanAlighting((v) => !v)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all ${
                    canAlighting
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-surface-low border-outline-ghost text-foreground/40"
                  }`}
                >
                  <i className={`${canAlighting ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"} text-sm`}></i>
                  Titik Turun
                </button>
              </div>
              <p className="text-[10px] text-foreground/40 mt-1 leading-normal">
                Aktifkan sesuai apakah titik ini boleh dijadikan titik naik / titik turun penumpang.
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
              {stops.map((stop, index) => {
                const isActive = stop.isActive !== false;

                return (
                  <div key={stop.id} className="relative group">
                    {/* Timeline Point Dot */}
                    <div className="absolute -left-[51px] top-4 w-6 h-6 rounded-full bg-gold-soft border-4 border-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-gold-warm' : 'bg-gray-400'}`}></div>
                    </div>

                    {/* Stop Box card */}
                    <div className={`bg-surface-low border border-transparent hover:border-gold-soft hover:shadow-ambient rounded-2xl p-5 flex items-center justify-between transition-all ${!isActive ? 'opacity-60 grayscale-[40%] bg-surface-low/80 border-dashed border-outline-ghost' : ''}`}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">Titik Ke-{stop.sequence}</span>
                          {stop.canBoarding && (
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Naik</span>
                          )}
                          {stop.canAlighting && (
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Turun</span>
                          )}
                          {!isActive && (
                            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Tersembunyi</span>
                          )}
                          {isActive && !stop.canBoarding && !stop.canAlighting && (
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Transit Saja</span>
                          )}
                        </div>
                        <h3 className="text-base font-display font-bold text-navy-deep uppercase">{stop.name}</h3>
                        <span className="text-xs text-green-600 font-medium">
                          Rp {(stop.price || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleFlag(stop.id, "canBoarding", stop.canBoarding)}
                          className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center ${
                            stop.canBoarding
                              ? "bg-green-50 border-green-100 text-green-600 hover:bg-green-600 hover:text-white"
                              : "bg-gray-100 border-gray-200 text-gray-400 hover:bg-green-500 hover:text-white"
                          }`}
                          title={stop.canBoarding ? "Nonaktifkan Titik Naik" : "Aktifkan Titik Naik"}
                        >
                          <i className="ri-user-add-line text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleToggleFlag(stop.id, "canAlighting", stop.canAlighting)}
                          className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center ${
                            stop.canAlighting
                              ? "bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white"
                              : "bg-gray-100 border-gray-200 text-gray-400 hover:bg-blue-500 hover:text-white"
                          }`}
                          title={stop.canAlighting ? "Nonaktifkan Titik Turun" : "Aktifkan Titik Turun"}
                        >
                          <i className="ri-user-unfollow-line text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(stop.id, stop.isActive)}
                          className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center ${
                            isActive
                              ? "bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white"
                              : "bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-500 hover:text-white"
                          }`}
                          title={isActive ? "Sembunyikan Titik" : "Tampilkan Titik"}
                        >
                          <i className={isActive ? "ri-eye-line text-sm" : "ri-eye-off-line text-sm"}></i>
                        </button>
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="w-8 h-8 rounded-lg bg-white border border-outline-ghost text-navy-deep hover:bg-navy-deep hover:text-white disabled:opacity-35 transition-all flex items-center justify-center ml-1"
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
                );
              })}
            </div>
          )}

          {/* Price Preview Table */}
          {activeStops.length >= 2 && (
            <div className="mt-10 pt-8 border-t border-surface-medium">
              <h3 className="text-sm font-display font-bold text-navy-deep mb-4 flex items-center gap-2">
                <i className="ri-money-dollar-circle-line text-gold-warm"></i>
                Preview Harga per Segment (Kumulatif)
              </h3>
              <div className="bg-surface-low rounded-2xl p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-medium">
                      <th className="text-left py-2 px-3 text-xs font-bold text-foreground/50 uppercase">Dari</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-foreground/50 uppercase">Ke</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-foreground/50 uppercase">Harga</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-foreground/50 uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStops.map((fromStop, fromIdx) => {
                      // Calculate cumulative prices to all subsequent stops.
                      // Price at each stop = cost FROM previous stop TO this stop, so
                      // segment price from A to B = sum of prices of ALL non-deleted stops
                      // between A and B (inclusive of B) — including hidden stops (isActive=false).
                      return activeStops.slice(fromIdx + 1).map((toStop) => {
                        const originIdx = stops.findIndex((s) => s.id === fromStop.id);
                        const destIdx = stops.findIndex((s) => s.id === toStop.id);
                        let segmentPrice = 0;
                        for (let i = originIdx + 1; i <= destIdx && i < stops.length; i++) {
                          segmentPrice += stops[i].price || 0;
                        }
                        const viaCount = destIdx - originIdx - 1;

                        return (
                          <tr key={`${fromStop.id}-${toStop.id}`} className="border-b border-surface-medium/50 last:border-0">
                            <td className="py-2 px-3 font-medium text-navy-deep">{fromStop.name}</td>
                            <td className="py-2 px-3 font-medium text-navy-deep">{toStop.name}</td>
                            <td className="py-2 px-3 text-right font-bold text-green-600">
                              Rp {segmentPrice.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-xs text-foreground/40">
                              {viaCount === 0 ? `Harga di titik tujuan` : `+${viaCount} titik di tengah`}
                            </td>
                          </tr>
                        );
                      });
                    }).flat()}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-foreground/40 mt-2">
                * Harga dihitung dengan menjumlahkan &quot;Harga dari Titik Sebelumnya&quot; untuk setiap titik yang dilalui.
              </p>
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
