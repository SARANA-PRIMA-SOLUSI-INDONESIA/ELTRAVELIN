const WIB_TIME_ZONE = "Asia/Jakarta";

function getWibDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: WIB_TIME_ZONE }).format(date);
}

export type BookingForDepartureTime = {
  schedule: {
    departureTime: Date | string;
    stopTimesJson?: string | null;
  };
  segment?: {
    originStop?: {
      id?: string;
      name?: string;
      stopTime?: string | null;
    } | null;
  } | null;
};

/** Jam keberangkatan efektif di titik naik (bukan jam jadwal induk). */
export function getBookingDepartureTime(booking: BookingForDepartureTime): Date {
  const scheduleDeparture = new Date(booking.schedule.departureTime);
  const originStop = booking.segment?.originStop;
  if (!originStop) return scheduleDeparture;

  let stopTime = originStop.stopTime as string | null | undefined;
  if (booking.schedule.stopTimesJson) {
    try {
      const customStopTimes = JSON.parse(booking.schedule.stopTimesJson) as Record<string, string>;
      stopTime =
        (originStop.id && customStopTimes[originStop.id]) ||
        (originStop.name && customStopTimes[originStop.name]) ||
        stopTime;
    } catch {
      // Fall back to the route stop time when the custom configuration is invalid.
    }
  }
  if (!stopTime) return scheduleDeparture;

  const absoluteTime = stopTime.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (absoluteTime) {
    const candidate = new Date(
      `${getWibDateKey(scheduleDeparture)}T${absoluteTime[1].padStart(2, "0")}:${absoluteTime[2]}:00+07:00`
    );
    if (candidate.getTime() < scheduleDeparture.getTime()) {
      candidate.setTime(candidate.getTime() + 24 * 60 * 60 * 1000);
    }
    return candidate;
  }

  const relativeTime = stopTime.toLowerCase().replace("+", "").trim();
  const relativeDate = new Date(scheduleDeparture);
  if (relativeTime.includes("menit")) {
    const minutes = parseInt(relativeTime, 10);
    if (!Number.isNaN(minutes)) relativeDate.setTime(relativeDate.getTime() + minutes * 60 * 1000);
  } else if (relativeTime.includes("jam")) {
    const hours = parseFloat(relativeTime);
    if (!Number.isNaN(hours)) relativeDate.setTime(relativeDate.getTime() + hours * 60 * 60 * 1000);
  }
  return relativeDate;
}
