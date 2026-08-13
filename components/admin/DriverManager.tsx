"use client";

import { createDriver, deleteDriver, updateDriver } from "@/app/actions/admin-driver";
import { useState } from "react";
import { showError, confirmAction, showSuccess } from "@/lib/swal";
import { DAY_NAMES } from "@/lib/driver-scheduling";

type Driver = { id: string; name: string; phone: string | null; licenseNo: string | null; isActive: boolean; restDayOfWeek: number | null; _count: { operatingTrips: number } };

export default function DriverManager({ initialDrivers, total }: { initialDrivers: Driver[]; total: number }) {
  const [drivers, setDrivers] = useState(initialDrivers);
  const [form, setForm] = useState({ name: "", phone: "", licenseNo: "", restDayOfWeek: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const driver = await updateDriver(editingId, {
          name: form.name,
          phone: form.phone || undefined,
          licenseNo: form.licenseNo || undefined,
          isActive: true,
          restDayOfWeek: form.restDayOfWeek === "" ? null : Number(form.restDayOfWeek),
        });
        setDrivers((current) => current.map((item) => item.id === editingId ? { ...item, ...driver } : item));
        setEditingId(null);
        await showSuccess({ title: "Berhasil", text: "Data driver diperbarui." });
      } else {
        const driver = await createDriver({
          ...form,
          restDayOfWeek: form.restDayOfWeek === "" ? null : Number(form.restDayOfWeek),
        });
        setDrivers((current) => [{ ...driver, _count: { operatingTrips: 0 } }, ...current]);
      }
      setForm({ name: "", phone: "", licenseNo: "", restDayOfWeek: "" });
    } catch (error) {
      await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal menyimpan driver" });
    } finally { setLoading(false); }
  };

  const startEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setForm({ name: driver.name, phone: driver.phone ?? "", licenseNo: driver.licenseNo ?? "", restDayOfWeek: driver.restDayOfWeek?.toString() ?? "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", phone: "", licenseNo: "", restDayOfWeek: "" });
  };

  const toggle = async (driver: Driver) => {
    try {
      const updated = await updateDriver(driver.id, {
        name: driver.name,
        phone: driver.phone ?? undefined,
        licenseNo: driver.licenseNo ?? undefined,
        isActive: !driver.isActive,
        restDayOfWeek: driver.restDayOfWeek,
      });
      setDrivers((current) => current.map((item) => item.id === driver.id ? { ...item, ...updated } : item));
    } catch (error) { await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal mengubah status" }); }
  };

  const changeRestDay = async (driver: Driver, restDayOfWeek: number | null) => {
    try {
      const updated = await updateDriver(driver.id, {
        name: driver.name,
        phone: driver.phone ?? undefined,
        licenseNo: driver.licenseNo ?? undefined,
        isActive: driver.isActive,
        restDayOfWeek,
      });
      setDrivers((current) => current.map((item) => item.id === driver.id ? { ...item, ...updated } : item));
    } catch (error) { await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal mengubah hari libur" }); }
  };

  const remove = async (driver: Driver) => {
    if (!(await confirmAction({ title: "Hapus Driver", danger: true, text: `Hapus ${driver.name}? Jadwal lama akan tetap tersimpan tanpa driver.` }))) return;
    try {
      await deleteDriver(driver.id);
      setDrivers((current) => current.filter((item) => item.id !== driver.id));
    } catch (error) { await showError({ title: "Gagal", text: error instanceof Error ? error.message : "Gagal menghapus driver" }); }
  };

  return <div className="flex flex-col gap-8">
    <form onSubmit={submit} className="bg-white p-8 rounded-[2rem] border border-outline-ghost grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
      {([['name', 'Nama Driver', 'Budi Santoso'], ['phone', 'No. Telepon', '08xxxxxxxxxx'], ['licenseNo', 'No. SIM', 'Opsional']] as const).map(([key, label, placeholder]) => <label key={key} className="flex flex-col gap-2 text-xs font-bold text-navy-deep uppercase tracking-widest">
        {label}<input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} required={key === 'name'} className="normal-case tracking-normal bg-surface-low rounded-xl px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-gold-warm" />
      </label>)}
      <label className="flex flex-col gap-2 text-xs font-bold text-navy-deep uppercase tracking-widest">
        Hari Libur
        <select value={form.restDayOfWeek} onChange={(e) => setForm({ ...form, restDayOfWeek: e.target.value })} className="normal-case tracking-normal bg-surface-low rounded-xl px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-gold-warm">
          <option value="">Otomatis (round-robin)</option>
          {DAY_NAMES.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
        </select>
      </label>
      <div className="flex gap-2">
        {editingId && <button type="button" onClick={cancelEdit} className="rounded-xl border border-outline-ghost px-5 py-3 font-bold text-sm text-navy-deep hover:border-gold-warm">Batal</button>}
        <button disabled={loading} className="btn-primary rounded-xl px-5 py-3 font-bold text-sm disabled:opacity-50">{loading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Driver"}</button>
      </div>
    </form>
    <div className="bg-white rounded-[2rem] border border-outline-ghost overflow-hidden">
      <div className="px-6 py-4 bg-surface-low border-b border-outline-ghost text-xs font-bold text-navy-deep/50 uppercase tracking-widest">Menampilkan {drivers.length} dari {total} driver</div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-surface-low border-b border-outline-ghost"><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep">Driver</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep">No. Telepon</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep">No. SIM</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep text-center">Perjalanan</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep text-center">Hari Libur</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep text-center">Status</th><th className="px-6 py-4 text-[11px] uppercase tracking-wider text-navy-deep text-center">Aksi</th></tr></thead>
          <tbody className="divide-y divide-outline-ghost">
            {drivers.length === 0 ? <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-foreground/40">Belum ada driver.</td></tr> : drivers.map((driver) => <tr key={driver.id} className="hover:bg-surface-low/50 transition-colors">
              <td className="px-6 py-5"><span className="font-bold text-navy-deep">{driver.name}</span></td>
              <td className="px-6 py-5 text-foreground/60">{driver.phone || "-"}</td>
              <td className="px-6 py-5 text-foreground/60">{driver.licenseNo || "-"}</td>
              <td className="px-6 py-5 text-center font-bold text-navy-deep">{driver._count.operatingTrips}</td>
              <td className="px-6 py-5">
                <select value={driver.restDayOfWeek ?? ""} onChange={(e) => changeRestDay(driver, e.target.value === "" ? null : Number(e.target.value))} className="rounded-xl bg-surface-low px-3 py-2 text-sm font-bold text-navy-deep outline-none">
                  <option value="">Otomatis</option>
                  {DAY_NAMES.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
                </select>
              </td>
              <td className="px-6 py-5 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${driver.isActive ? "bg-green-50 text-green-600" : "bg-surface-low text-foreground/50"}`}>{driver.isActive ? "Aktif" : "Nonaktif"}</span></td>
              <td className="px-6 py-5"><div className="flex justify-center gap-2"><button onClick={() => toggle(driver)} className="rounded-xl border border-outline-ghost px-3 py-2 text-xs font-bold text-navy-deep hover:border-gold-warm">{driver.isActive ? "Nonaktifkan" : "Aktifkan"}</button><button onClick={() => startEdit(driver)} className="rounded-xl bg-gold-soft/50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-gold-soft"><i className="ri-pencil-line" /> Edit</button><button onClick={() => remove(driver)} aria-label={`Hapus ${driver.name}`} className="rounded-xl bg-red-50 px-3 py-2 text-red-500 hover:bg-red-500 hover:text-white"><i className="ri-delete-bin-line" /></button></div></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}
