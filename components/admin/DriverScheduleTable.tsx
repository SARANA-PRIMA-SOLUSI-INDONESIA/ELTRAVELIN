"use client";

import { assignDriverForRouteDeparture } from "@/app/actions/admin-driver";
import { useState } from "react";
import { showError } from "@/lib/swal";

type Row = { id: string; departureTime: string; arrivalTime: string; route: { origin: string; destination: string }; driverId: string | null };

export default function DriverScheduleTable({ rows, drivers }: { rows: Row[]; drivers: { id: string; name: string }[] }) {
  const [items, setItems] = useState(rows);
  const [loading, setLoading] = useState<string | null>(null);
  const save = async (scheduleId: string, driverId: string) => {
    setLoading(scheduleId);
    try { await assignDriverForRouteDeparture(scheduleId, driverId || null); setItems((current) => current.map((item) => item.id === scheduleId ? { ...item, driverId: driverId || null } : item)); }
    catch (error) { await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal menugaskan driver" }); }
    finally { setLoading(null); }
  };
  return <div className="overflow-x-auto bg-white rounded-[2rem] border border-outline-ghost"><table className="w-full text-left text-sm"><thead className="bg-surface-low text-[10px] uppercase tracking-widest text-foreground/50"><tr><th className="px-6 py-4">Waktu Keberangkatan</th><th className="px-6 py-4">Rute</th><th className="px-6 py-4">Driver Bertugas</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-outline-ghost align-top"><td className="px-6 py-5 font-bold text-navy-deep whitespace-nowrap">{new Date(item.departureTime).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}<span className="block mt-1 text-xs font-normal text-foreground/40">Tiba {new Date(item.arrivalTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}</span></td><td className="px-6 py-5 font-bold text-navy-deep">{item.route.origin} → {item.route.destination}</td><td className="px-6 py-5"><select disabled={loading === item.id} value={item.driverId || ""} onChange={(e) => save(item.id, e.target.value)} className="min-w-52 rounded-xl bg-surface-low px-3 py-3 text-sm font-bold text-navy-deep outline-none"><option value="">Belum ditugaskan</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></td></tr>)}</tbody></table>{items.length === 0 && <p className="p-12 text-center text-sm text-foreground/50">Tidak ada jadwal pada rentang tanggal ini.</p>}</div>;
}
