// Self-check aturan feasibilitas driver (tanpa DB, tanpa framework).
// Jalankan: npx tsx scripts/check-driver-scheduling.ts
import assert from "node:assert/strict";
import { findAssignmentConflict, type DriverTripWithHours } from "../lib/driver-scheduling";

const at = (iso: string) => new Date(`${iso}+07:00`);
const trip = (over: Partial<DriverTripWithHours> = {}): DriverTripWithHours => ({
  id: "t",
  departureTime: at("2026-09-24T08:00:00"),
  arrivalTime: at("2026-09-24T12:00:00"),
  origin: "Jakarta",
  destination: "Bandung",
  durationMinutes: 240,
  ...over,
});

// 1) Trip tunggal 14 jam tidak lagi memblokir semua driver (fix jam bertugas).
assert.equal(
  findAssignmentConflict([], trip({ arrivalTime: at("2026-09-24T20:00:00"), durationMinutes: 840 })),
  null
);

// 2) Dua trip di hari yang sama tetap dibatasi total 12 jam.
const short = trip({
  id: "a",
  departureTime: at("2026-09-24T06:00:00"),
  arrivalTime: at("2026-09-24T08:00:00"),
  origin: "Bandung",
  destination: "Jakarta",
  durationMinutes: 120,
});
const long = trip({
  id: "b",
  departureTime: at("2026-09-24T09:00:00"),
  arrivalTime: at("2026-09-24T21:30:00"),
  durationMinutes: 750,
});
assert.equal(findAssignmentConflict([short], long)?.rule, "DUTY_HOURS");

// 3) Lokasi basi tetap HARD.
const stale = trip({
  id: "c",
  departureTime: at("2026-09-20T08:00:00"),
  arrivalTime: at("2026-09-20T12:00:00"),
  destination: "Surabaya",
});
const locationConflict = findAssignmentConflict([stale], trip());
assert.equal(locationConflict?.rule, "LOCATION");
assert.equal(locationConflict?.type, "HARD");

// 4) Lokasi cocok + istirahat cukup → aman.
const yesterday = trip({
  id: "d",
  departureTime: at("2026-09-23T08:00:00"),
  arrivalTime: at("2026-09-23T12:00:00"),
});
assert.equal(
  findAssignmentConflict([yesterday], trip({ origin: "Bandung", destination: "Jakarta" })),
  null
);

console.log("driver-scheduling checks OK");
