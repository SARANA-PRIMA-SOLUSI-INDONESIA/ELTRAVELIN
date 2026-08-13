"use client";

import { assignDriverForRouteDeparture, autoAssignDrivers } from "@/app/actions/admin-driver";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showError, showSuccess, confirmAction } from "@/lib/swal";

type Row = {
  id: string;
  departureTime: string;
  arrivalTime: string;
  route: { origin: string; destination: string };
  driverId: string | null;
  blockedDriverIds: string[];
  softBlockedDriverIds: string[];
};

type DriverOption = { id: string; name: string; restDayOfWeek: number | null };

export default function DriverScheduleTable({ rows, drivers, from, to }: { rows: Row[]; drivers: DriverOption[]; from: string; to: string }) {
  const [items, setItems] = useState(rows);
  const [loading, setLoading] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setItems(rows);
  }, [rows]);

  const save = async (scheduleId: string, driverId: string) => {
    if (!driverId) {
      setLoading(scheduleId);
      try {
        await assignDriverForRouteDeparture(scheduleId, null);
        setItems((current) => current.map((item) => item.id === scheduleId ? { ...item, driverId: null } : item));
      } catch (error) {
        await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal melepas driver" });
      } finally { setLoading(null); }
      return;
    }

    const item = items.find((i) => i.id === scheduleId);
    const isSoft = item?.softBlockedDriverIds.includes(driverId);
    let proceed = true;
    if (isSoft) {
      proceed = await confirmAction({
        title: "Overide Aturan",
        text: "Driver ini melanggar aturan (libur / istirahat kurang). Tetap tugaskan?",
        danger: true,
      });
    }
    if (!proceed) return;

    setLoading(scheduleId);
    try {
      await assignDriverForRouteDeparture(scheduleId, driverId, isSoft);
      setItems((current) => current.map((item) => item.id === scheduleId ? { ...item, driverId } : item));
    } catch (error) {
      await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal menugaskan driver" });
    } finally { setLoading(null); }
  };

  const handleAutoAssign = async () => {
    if (!(await confirmAction({ title: "Auto Assign", text: "Tugaskan driver secara otomatis untuk rentang tanggal ini? Trip yang sudah ditugaskan manual tidak akan diganggu." }))) return;
    setAssigning(true);
    try {
      const result = await autoAssignDrivers(from, to);
      await showSuccess({ title: "Selesai", text: result.message });
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal auto assign driver" });
    } finally { setAssigning(false); }
  };

  return <div className="overflow-x-auto bg-white rounded-[2rem] border border-outline-ghost">
    <div className="flex justify-between items-center px-6 py-4 bg-surface-low border-b border-outline-ghost">
      <span className="text-xs font-bold text-navy-deep/50 uppercase tracking-widest">{items.length} jadwal</span>
      <button
        onClick={handleAutoAssign}
        disabled={assigning}
        className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50"
      >
        <i className={`ri-magic-line mr-1.5 ${assigning ? "animate-spin" : ""}`} />
        {assigning ? "Menugaskan..." : "Auto Assign"}
      </button>
    </div>
    <table className="w-full text-left text-sm">
      <thead className="bg-surface-low text-[10px] uppercase tracking-widest text-foreground/50">
        <tr>
          <th className="px-6 py-4">Waktu Keberangkatan</th>
          <th className="px-6 py-4">Rute</th>
          <th className="px-6 py-4">Driver Bertugas</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-t border-outline-ghost align-top">
            <td className="px-6 py-5 font-bold text-navy-deep whitespace-nowrap">
              {new Date(item.departureTime).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
              <span className="block mt-1 text-xs font-normal text-foreground/40">Tiba {new Date(item.arrivalTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}</span>
            </td>
            <td className="px-6 py-5 font-bold text-navy-deep">{item.route.origin} → {item.route.destination}</td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.driverId ? "bg-green-500" : "bg-amber-400"}`} />
                <select
                  disabled={loading === item.id}
                  value={item.driverId || ""}
                  onChange={(e) => save(item.id, e.target.value)}
                  className={`min-w-52 rounded-xl px-3 py-3 text-sm font-bold outline-none border ${
                    item.driverId
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  <option value="">Belum ditugaskan</option>
                  {drivers.map((driver) => {
                    const hard = item.blockedDriverIds.includes(driver.id);
                    const soft = item.softBlockedDriverIds.includes(driver.id);
                    const current = item.driverId === driver.id;
                    const label = `${driver.name}${soft ? " (libur/istirahat)" : ""}`;
                    if (hard && !current) {
                      return <option key={driver.id} value={driver.id} disabled>{label}</option>;
                    }
                    return <option key={driver.id} value={driver.id}>{label}</option>;
                  })}
                </select>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {items.length === 0 && <p className="p-12 text-center text-sm text-foreground/50">Tidak ada jadwal pada rentang tanggal ini.</p>}
  </div>;
}
