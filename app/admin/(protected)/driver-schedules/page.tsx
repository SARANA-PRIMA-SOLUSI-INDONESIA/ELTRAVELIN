import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getDrivers } from "@/app/actions/admin-driver";
import { findAssignmentConflict, type DriverTripWithHours } from "@/lib/driver-scheduling";
import { dateKeysFromToday, DRIVER_PLANNING_DAYS, wibStartOfDay, wibEndOfDay } from "@/lib/on-demand-schedules";
import DriverScheduleTable from "@/components/admin/DriverScheduleTable";
import Pagination from "@/components/Pagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MINUTE = 60_000;
const DAY = 86_400_000;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;

interface Row {
  id: string;
  departureTime: string;
  arrivalTime: string;
  route: { origin: string; destination: string };
  driverId: string | null;
  blockedDriverIds: string[];
  softBlockedDriverIds: string[];
}

export default async function DriverSchedules({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; page?: string; pageSize?: string; q?: string }> }) {
  const params = await searchParams;
  // Default: besok s/d H+DRIVER_PLANNING_DAYS (14 hari), sesuai window perencanaan armada.
  const keys = dateKeysFromToday(1, DRIVER_PLANNING_DAYS);
  const defaultFrom = keys[0];
  const defaultTo = keys[keys.length - 1];
  const from = params.from || defaultFrom;
  const to = params.to || defaultTo;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number.parseInt(params.pageSize || "", 10))
    ? Number.parseInt(params.pageSize || "", 10)
    : DEFAULT_PAGE_SIZE;
  const q = (params.q || "").trim();

  const whereSchedules: Prisma.ScheduleWhereInput = {
    isDeleted: false,
    departureTime: { gte: wibStartOfDay(from), lte: wibEndOfDay(to) },
    template: { isActive: true },
  };

  if (q) {
    whereSchedules.operatingTrip = { is: { driver: { name: { contains: q } } } };
  }

  const [drivers, schedules, total, priorRows] = await Promise.all([
    getDrivers(),
    prisma.schedule.findMany({
      where: whereSchedules,
      orderBy: { departureTime: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { route: { select: { origin: true, destination: true } }, operatingTrip: { select: { driverId: true } } },
    }),
    prisma.schedule.count({ where: whereSchedules }),
    // Riwayat driver 7 hari sebelum rentang (untuk lokasi & istirahat).
    prisma.schedule.findMany({
      where: { isDeleted: false, departureTime: { lt: wibStartOfDay(from), gte: new Date(wibStartOfDay(from).getTime() - 7 * DAY) } },
      orderBy: { departureTime: "asc" },
      include: { route: { select: { origin: true, destination: true } }, operatingTrip: { select: { driverId: true } } },
    }),
  ]);

  const driverHistory: Record<string, DriverTripWithHours[]> = {};
  for (const row of priorRows) {
    const driverId = row.operatingTrip?.driverId;
    if (!driverId) continue;
    (driverHistory[driverId] ??= []).push({
      id: row.id,
      departureTime: row.departureTime,
      arrivalTime: row.arrivalTime,
      origin: row.route.origin,
      destination: row.route.destination,
      durationMinutes: (row.arrivalTime.getTime() - row.departureTime.getTime()) / MINUTE,
    });
  }

  const activeDrivers = drivers.filter((d) => d.isActive);

  const rows: Row[] = schedules.map((schedule) => {
    const trip: DriverTripWithHours = {
      id: schedule.id,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      origin: schedule.route.origin,
      destination: schedule.route.destination,
      durationMinutes: (schedule.arrivalTime.getTime() - schedule.departureTime.getTime()) / MINUTE,
    };
    const blockedDriverIds: string[] = [];
    const softBlockedDriverIds: string[] = [];
    for (const driver of activeDrivers) {
      const conflict = findAssignmentConflict(driverHistory[driver.id] ?? [], trip, { restDayOfWeek: driver.restDayOfWeek });
      if (!conflict) continue;
      if (conflict.type === "HARD") blockedDriverIds.push(driver.id);
      else softBlockedDriverIds.push(driver.id);
    }
    return {
      id: schedule.id,
      departureTime: schedule.departureTime.toISOString(),
      arrivalTime: schedule.arrivalTime.toISOString(),
      route: schedule.route,
      driverId: schedule.operatingTrip?.driverId || null,
      blockedDriverIds,
      softBlockedDriverIds,
    };
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-navy-deep">Jadwal Driver</h1>
          <p className="mt-2 text-foreground/60">Tugaskan driver berdasarkan jadwal aktual yang dibuat dari Jadwal Master.</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/api/admin/driver-schedules/export?from=${from}&to=${to}`} className="btn-primary rounded-xl px-5 py-3 text-sm font-bold">
            <i className="ri-file-excel-2-line mr-2" />Export Excel
          </Link>
        </div>
      </div>
      <form className="flex flex-wrap items-end gap-4 bg-white p-6 rounded-2xl border border-outline-ghost">
        <input type="hidden" name="page" value="1" />
        <label className="text-xs font-bold uppercase tracking-widest text-navy-deep">
          Dari
          <input name="from" type="date" defaultValue={from} className="mt-2 block rounded-xl bg-surface-low px-3 py-3 text-sm font-normal tracking-normal" />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest text-navy-deep">
          Sampai
          <input name="to" type="date" defaultValue={to} className="mt-2 block rounded-xl bg-surface-low px-3 py-3 text-sm font-normal tracking-normal" />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest text-navy-deep">
          Cari Driver
          <input name="q" type="text" placeholder="Nama driver..." defaultValue={q} className="mt-2 block w-56 rounded-xl bg-surface-low px-3 py-3 text-sm font-normal tracking-normal" />
        </label>
        <button className="btn-primary rounded-xl px-5 py-3 text-sm font-bold">Tampilkan</button>
      </form>
      <DriverScheduleTable
        rows={rows}
        drivers={activeDrivers.map(({ id, name, restDayOfWeek }) => ({ id, name, restDayOfWeek }))}
        from={from}
        to={to}
      />
      <Pagination total={total} pageSize={pageSize} currentPage={page} pageSizeOptions={PAGE_SIZE_OPTIONS} />
    </div>
  );
}
