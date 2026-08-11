import { prisma } from "@/lib/prisma";
import { getDrivers } from "@/app/actions/admin-driver";
import DriverScheduleTable from "@/components/admin/DriverScheduleTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DriverSchedules({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = params.from || today;
  const to = params.to || from;
  const [drivers, schedules] = await Promise.all([
    getDrivers(),
    prisma.schedule.findMany({
      where: { isDeleted: false, departureTime: { gte: new Date(`${from}T00:00:00+07:00`), lte: new Date(`${to}T23:59:59+07:00`) } },
      orderBy: { departureTime: "asc" },
      include: { route: { select: { origin: true, destination: true } }, operatingTrip: { select: { driverId: true } } },
    }),
  ]);
  const rows = schedules.map((schedule) => ({ id: schedule.id, departureTime: schedule.departureTime.toISOString(), arrivalTime: schedule.arrivalTime.toISOString(), route: schedule.route, driverId: schedule.operatingTrip?.driverId || null }));
  return <div className="flex flex-col gap-10"><div className="flex flex-col md:flex-row md:items-end justify-between gap-6"><div><h1 className="text-4xl font-display font-bold text-navy-deep">Jadwal Driver</h1><p className="mt-2 text-foreground/60">Tugaskan driver berdasarkan jadwal aktual yang dibuat dari Jadwal Master.</p></div><div className="flex gap-3"><Link href={`/api/admin/driver-schedules/export?from=${from}&to=${to}`} className="btn-primary rounded-xl px-5 py-3 text-sm font-bold"><i className="ri-file-excel-2-line mr-2" />Export Excel</Link></div></div><form className="flex flex-wrap items-end gap-4 bg-white p-6 rounded-2xl border border-outline-ghost"><label className="text-xs font-bold uppercase tracking-widest text-navy-deep">Dari<input name="from" type="date" defaultValue={from} className="mt-2 block rounded-xl bg-surface-low px-3 py-3 text-sm font-normal tracking-normal" /></label><label className="text-xs font-bold uppercase tracking-widest text-navy-deep">Sampai<input name="to" type="date" defaultValue={to} className="mt-2 block rounded-xl bg-surface-low px-3 py-3 text-sm font-normal tracking-normal" /></label><button className="btn-primary rounded-xl px-5 py-3 text-sm font-bold">Tampilkan</button></form><DriverScheduleTable rows={rows} drivers={drivers.filter((driver) => driver.isActive).map(({ id, name }) => ({ id, name }))} /></div>;
}
