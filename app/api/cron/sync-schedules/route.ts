import { prisma } from "@/lib/prisma";
import { ensureSchedulesForDate, dateKeysFromToday, DRIVER_PLANNING_DAYS } from "@/lib/on-demand-schedules";
import { autoAssignDrivers } from "@/app/actions/admin-driver";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronKeyHeader = request.headers.get("x-cron-key");
  const { searchParams } = new URL(request.url);
  const urlKey = searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) return true; // fallback backward-compat bila CRON_SECRET belum diset

  return (
    authHeader === `Bearer ${cronSecret}` ||
    authHeader === `bearer ${cronSecret}` ||
    cronKeyHeader === cronSecret ||
    urlKey === cronSecret
  );
}

// Cron harian (dipanggil oleh website cron job eksternal):
// 1. Materialisasi jadwal untuk H+1 s/d H+DRIVER_PLANNING_DAYS (besok s/d 14 hari).
// 2. Auto-assign driver untuk rentang yang sama (hanya mengisi slot kosong).
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const keys = dateKeysFromToday(1, DRIVER_PLANNING_DAYS); // besok s/d H+14
  const from = keys[0];
  const to = keys[keys.length - 1];

  let schedulesCreated = 0;
  for (const key of keys) {
    schedulesCreated += await ensureSchedulesForDate(prisma, key);
  }

  let assign;
  try {
    assign = await autoAssignDrivers(from, to);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assign = { assigned: 0, skipped: [], message: `Auto-assign gagal: ${message}` };
  }

  return NextResponse.json({
    success: true,
    time: now.toISOString(),
    window: { from, to },
    schedulesCreated,
    assign,
  });
}
