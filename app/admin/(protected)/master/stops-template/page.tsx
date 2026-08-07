"use client";

import { getTemplateWithStops, updateTemplateStopTimes } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

interface RouteStop {
  id: string;
  name: string;
  sequence: number;
  stopTime: string | null;
  price: number;
}

interface Vehicle {
  name: string;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  stops: RouteStop[];
}

interface ScheduleTemplate {
  id: string;
  departureTime: string;
  arrivalTime: string;
  stopTimesJson: string | null;
  route: Route;
  vehicle: Vehicle;
}

function StopsTemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") || "";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
  
  // A dictionary mapping routeStopId -> customStopTime
  const [customStopTimes, setCustomStopTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!templateId) return;

    getTemplateWithStops(templateId)
      .then((data: any) => {
        if (data) {
          setTemplate(data as ScheduleTemplate);
          
          // Parse pre-existing stop times config
          if (data.stopTimesJson) {
            try {
              const parsed = JSON.parse(data.stopTimesJson);
              setCustomStopTimes(parsed);
            } catch (e) {
              console.error("Gagal parse stopTimesJson:", e);
            }
          }
        } else {
          alert("Jadwal master tidak ditemukan.");
          router.push("/admin/master");
        }
        setFetching(false);
      })
      .catch((err) => {
        alert("Gagal memuat data jadwal: " + err.message);
        router.push("/admin/master");
      });
  }, [templateId, router]);

  const backHref = template?.route?.id
    ? `/admin/master#route-${template.route.id}`
    : "/admin/master";

  const handleTimeChange = (stopId: string, value: string) => {
    setCustomStopTimes((prev) => ({
      ...prev,
      [stopId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;

    setLoading(true);
    try {
      // Filter out empty strings to keep the JSON small and clean
      const cleanedStopTimes: Record<string, string> = {};
      Object.entries(customStopTimes).forEach(([stopId, val]) => {
        if (val.trim()) {
          cleanedStopTimes[stopId] = val.trim();
        }
      });

      await updateTemplateStopTimes(templateId, JSON.stringify(cleanedStopTimes));
      router.push(backHref);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      alert("Gagal menyimpan jam singgah kustom: " + msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !template) {
    return (
      <div className="flex items-center justify-center p-24">
        <p className="text-sm text-foreground/40 font-medium">Memuat pengaturan jam singgah...</p>
      </div>
    );
  }

  const stops = template.route.stops || [];

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Atur Jam Singgah Spesifik</h1>
          <p className="text-sm text-foreground/60">
            Kustomisasi jam tiba di tiap perhentian khusus untuk keberangkatan rutin jam <span className="font-bold text-gold-warm">{template.departureTime}</span> ({template.route.origin} → {template.route.destination}).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-display font-bold text-navy-deep mb-4 border-b border-outline-ghost pb-3 flex items-center gap-2">
            <i className="ri-road-map-line text-gold-warm"></i>
            Estimasi Jam Tiba pada Tiap Perhentian
          </h2>

          {stops.length === 0 ? (
            <div className="py-12 text-center text-sm text-foreground/40 font-medium bg-surface-low rounded-2xl">
              Belum ada titik singgah fisik yang dikonfigurasi pada rute ini.
              <div className="mt-3">
                <Link href={`/admin/master/stops?routeId=${template.route.id}`} className="text-xs text-gold-warm hover:underline font-bold">
                  Kelola Titik Fisik Rute →
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative pl-10 border-l-2 border-surface-medium flex flex-col gap-8 ml-4">
              {stops.map((stop, index) => {
                const isOrigin = index === 0;
                const isDestination = index === stops.length - 1;
                const currentVal = customStopTimes[stop.id] || "";

                return (
                  <div key={stop.id} className="relative group">
                    {/* Timeline Node Point */}
                    <div className={`absolute -left-[51px] top-4 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-transform ${
                      isOrigin ? "bg-green-500" : isDestination ? "bg-red-500" : "bg-gold-soft"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${isOrigin || isDestination ? "bg-white" : "bg-gold-warm"}`}></div>
                    </div>

                    <div className="bg-surface-low border border-transparent hover:border-gold-soft hover:shadow-ambient rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                      <div className="flex flex-col gap-1 md:max-w-[50%]">
                        <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">
                          Perhentian Ke-{stop.sequence} {isOrigin && "(Titik Asal)"} {isDestination && "(Titik Akhir)"}
                        </span>
                        <h3 className="text-base font-display font-bold text-navy-deep uppercase">{stop.name}</h3>
                      </div>

                      <div className="flex flex-col gap-1.5 w-full md:w-64">
                        <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">
                          Jam Tiba / Selisih Waktu
                        </label>
                        {isOrigin ? (
                          <input
                            type="text"
                            value={template.departureTime}
                            className="bg-white border border-outline-ghost text-foreground/40 rounded-xl px-4 py-3 text-sm font-bold cursor-not-allowed outline-none"
                            disabled
                          />
                        ) : (
                          <input
                            type="time"
                            value={currentVal}
                            onChange={(e) => handleTimeChange(stop.id, e.target.value)}
                            className="bg-white border border-outline-ghost rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-outline-ghost pt-6 mt-4 flex flex-col gap-3">
          <div className="bg-surface-low p-4 rounded-xl text-xs text-foreground/60 leading-normal flex items-start gap-2">
            <i className="ri-information-line text-lg text-gold-warm flex-shrink-0"></i>
            <div>
              <p className="font-bold text-navy-deep mb-1">💡 Petunjuk Pengisian:</p>
              <ul className="list-disc pl-4 flex flex-col gap-1 mt-1">
                <li>Pilih estimasi jam tiba yang sesuai untuk perhentian ini pada jam keberangkatan ini.</li>
                <li>Kosongkan isian jika titik singgah tersebut tidak digunakan atau belum diatur jam tibanya.</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Link
              href={backHref}
              className="flex-1 bg-surface-low rounded-xl py-4 font-bold text-sm text-navy-deep text-center border border-outline-ghost hover:bg-surface-medium transition-all"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading || stops.length === 0}
              className="flex-1 btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Jam Singgah"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function StopsTemplate() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Memuat Pengaturan Jam Singgah...</div>}>
      <StopsTemplateForm />
    </Suspense>
  );
}
