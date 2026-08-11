"use client";

import { createDriver, deleteDriver, updateDriver } from "@/app/actions/admin-driver";
import { useState } from "react";
import { showError, confirmAction } from "@/lib/swal";

type Driver = { id: string; name: string; phone: string | null; licenseNo: string | null; isActive: boolean; _count: { operatingTrips: number } };

export default function DriverManager({ initialDrivers, total }: { initialDrivers: Driver[]; total: number }) {
  const [drivers, setDrivers] = useState(initialDrivers);
  const [form, setForm] = useState({ name: "", phone: "", licenseNo: "" });
  const [loading, setLoading] = useState(false);

  const addDriver = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const driver = await createDriver(form);
      setDrivers((current) => [{ ...driver, _count: { operatingTrips: 0 } }, ...current]);
      setForm({ name: "", phone: "", licenseNo: "" });
    } catch (error) {
      await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal menyimpan driver" });
    } finally { setLoading(false); }
  };

  const toggle = async (driver: Driver) => {
    try {
      const updated = await updateDriver(driver.id, {
        name: driver.name,
        phone: driver.phone ?? undefined,
        licenseNo: driver.licenseNo ?? undefined,
        isActive: !driver.isActive,
      });
      setDrivers((current) => current.map((item) => item.id === driver.id ? { ...item, ...updated } : item));
    } catch (error) { await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal mengubah status" }); }
  };

  const remove = async (driver: Driver) => {
    if (!(await confirmAction({ title: "Hapus Driver", danger: true, text: `Hapus ${driver.name}? Jadwal lama akan tetap tersimpan tanpa driver.` }))) return;
    try {
      await deleteDriver(driver.id);
      setDrivers((current) => current.filter((item) => item.id !== driver.id));
    } catch (error) { await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal menghapus driver" }); }
  };

  return <div className="flex flex-col gap-8">
    <form onSubmit={addDriver} className="bg-white p-8 rounded-[2rem] border border-outline-ghost grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      {([['name', 'Nama Driver', 'Budi Santoso'], ['phone', 'No. Telepon', '08xxxxxxxxxx'], ['licenseNo', 'No. SIM', 'Opsional']] as const).map(([key, label, placeholder]) => <label key={key} className="flex flex-col gap-2 text-xs font-bold text-navy-deep uppercase tracking-widest">
        {label}<input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} required={key === 'name'} className="normal-case tracking-normal bg-surface-low rounded-xl px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-gold-warm" />
      </label>)}
      <button disabled={loading} className="btn-primary rounded-xl px-5 py-3 font-bold text-sm disabled:opacity-50">{loading ? "Menyimpan..." : "Tambah Driver"}</button>
    </form>
    <div className="bg-white rounded-[2rem] border border-outline-ghost overflow-hidden">
      <div className="px-6 py-4 bg-surface-low border-b border-outline-ghost text-xs font-bold text-navy-deep/50 uppercase tracking-widest">Menampilkan {drivers.length} dari {total} driver</div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-surface-low border-b border-outline-ghost"><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep">Driver</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep">No. Telepon</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep">No. SIM</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep text-center">Perjalanan</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep text-center">Status</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep text-center">Aksi</th></tr></thead>
          <tbody className="divide-y divide-outline-ghost">
            {drivers.length === 0 ? <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-foreground/40">Belum ada driver.</td></tr> : drivers.map((driver) => <tr key={driver.id} className="hover:bg-surface-low/50 transition-colors"><td className="px-6 py-5"><span className="font-bold text-navy-deep">{driver.name}</span></td><td className="px-6 py-5 text-foreground/60">{driver.phone || "-"}</td><td className="px-6 py-5 text-foreground/60">{driver.licenseNo || "-"}</td><td className="px-6 py-5 text-center font-bold text-navy-deep">{driver._count.operatingTrips}</td><td className="px-6 py-5 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${driver.isActive ? "bg-green-50 text-green-600" : "bg-surface-low text-foreground/50"}`}>{driver.isActive ? "Aktif" : "Nonaktif"}</span></td><td className="px-6 py-5"><div className="flex justify-center gap-2"><button onClick={() => toggle(driver)} className="rounded-xl border border-outline-ghost px-3 py-2 text-xs font-bold text-navy-deep hover:border-gold-warm">{driver.isActive ? "Nonaktifkan" : "Aktifkan"}</button><button onClick={() => remove(driver)} aria-label={`Hapus ${driver.name}`} className="rounded-xl bg-red-50 px-3 py-2 text-red-500 hover:bg-red-500 hover:text-white"><i className="ri-delete-bin-line" /></button></div></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}
