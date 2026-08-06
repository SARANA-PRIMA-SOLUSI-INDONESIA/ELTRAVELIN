"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSchedules, adminCreateBooking, getAvailableSeatsForSchedule } from "@/app/actions/booking";

export default function ManualBookingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const [availableSeats, setAvailableSeats] = useState<any[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [passengers, setPassengers] = useState<string[]>([""]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [originStopId, setOriginStopId] = useState("");
  const [destinationStopId, setDestinationStopId] = useState("");

  useEffect(() => {
    fetchSchedules();
  }, [date]);

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const result = await getSchedules("", "", date, { pageSize: 50 });
      setSchedules(result.data || []);
    } catch {
      setError("Gagal memuat jadwal");
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchSeats = async (scheduleId: string) => {
    setLoadingSeats(true);
    try {
      const seats = await getAvailableSeatsForSchedule(scheduleId);
      setAvailableSeats(seats || []);
      setSelectedSeats([]);
    } catch {
      setError("Gagal memuat kursi");
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleSelectSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setSelectedSeats([]);
    setOriginStopId("");
    setDestinationStopId("");
    fetchSeats(schedule.id);
  };

  const stops = useMemo(() => selectedSchedule?.route?.stops || [], [selectedSchedule]);

  const segmentPrice = useMemo(() => {
    if (!originStopId || !destinationStopId || stops.length === 0) return null;
    const originIdx = stops.findIndex((s: any) => s.id === originStopId);
    const destIdx = stops.findIndex((s: any) => s.id === destinationStopId);
    if (originIdx === -1 || destIdx <= originIdx) return null;
    return stops
      .slice(originIdx + 1, destIdx + 1)
      .reduce((sum: number, s: any) => sum + (s.price || 0), 0);
  }, [originStopId, destinationStopId, stops]);

  const effectivePrice = segmentPrice ?? selectedSchedule?.price ?? 0;
  const validPassengers = passengers.filter((p) => p.trim());

  const toggleSeat = (seatNumber: string) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else if (selectedSeats.length < validPassengers.length) {
      setSelectedSeats([...selectedSeats, seatNumber]);
    } else {
      setSelectedSeats([...selectedSeats.slice(0, -1), seatNumber]);
    }
  };

  const addPassenger = () => setPassengers([...passengers, ""]);
  const removePassenger = (i: number) => {
    if (passengers.length > 1) setPassengers(passengers.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!selectedSchedule) return setError("Pilih jadwal terlebih dahulu");
    if (!contactName.trim() || !contactPhone.trim()) return setError("Nama dan telepon pemesan wajib diisi");
    if (validPassengers.length === 0) return setError("Minimal 1 penumpang");
    if (selectedSeats.length !== validPassengers.length) return setError("Jumlah kursi harus sama dengan jumlah penumpang");

    setLoading(true);
    setError("");
    try {
      await adminCreateBooking({
        scheduleId: selectedSchedule.id,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim(),
        passengerNames: validPassengers,
        seatNumbers: selectedSeats,
        paymentMethod,
        originStopId: originStopId || undefined,
        destinationStopId: destinationStopId || undefined,
      });
      alert("Booking manual berhasil dibuat! Status CONFIRMED. Notifikasi sudah dikirim ke pelanggan.");
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal membuat booking");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedSchedule) return setError("Pilih jadwal terlebih dahulu");
    setError("");
    setStep(2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-bold text-navy-deep">Buat Pesanan Manual</h2>
            <p className="text-sm text-gray-500">Booking langsung CONFIRMED</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-sm font-medium mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none font-medium"
              />
            </div>

            {loadingSchedules ? (
              <div className="py-8 text-center text-gray-400">
                <i className="ri-loader-4-line animate-spin text-2xl"></i>
              </div>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Tidak ada jadwal tersedia</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {schedules.map((s) => {
                  const departure = new Date(s.departureTime);
                  const arrival = new Date(s.arrivalTime);
                  const isSelected = selectedSchedule?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSchedule(s)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-navy-deep bg-navy-deep/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-navy-deep text-sm">
                            {s.route?.origin} <i className="ri-arrow-right-line text-xs"></i> {s.route?.destination}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {departure.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            {" - "}
                            {arrival.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {s.route?.stops?.length > 0 && (
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {s.route.stops.map((st: any) => st.name).join(" → ")}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-bold text-gray-400">
                          {s.route?.stops?.length > 1 ? "Pilih titik ↓" : s.price > 0 ? `Rp ${s.price.toLocaleString("id-ID")}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {stops.length > 1 && (
              <div className="mt-4 p-4 bg-surface-low rounded-2xl space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pilih Titik Naik/Turun</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Titik Naik</label>
                    <select
                      value={originStopId}
                      onChange={(e) => { setOriginStopId(e.target.value); setDestinationStopId(""); }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium focus:border-navy-deep outline-none"
                    >
                      <option value="">-- Pilih --</option>
                      {stops.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} {s.price > 0 ? `(+${s.price.toLocaleString("id-ID")})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Titik Turun</label>
                    <select
                      value={destinationStopId}
                      onChange={(e) => setDestinationStopId(e.target.value)}
                      disabled={!originStopId}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium focus:border-navy-deep outline-none disabled:opacity-40"
                    >
                      <option value="">-- Pilih --</option>
                      {stops.filter((s: any, i: number) => {
                        const originIdx = stops.findIndex((st: any) => st.id === originStopId);
                        return i > originIdx;
                      }).map((s: any) => {
                        const originIdx = stops.findIndex((st: any) => st.id === originStopId);
                        const destIdx = stops.findIndex((st: any) => st.id === s.id);
                        const price = stops
                          .slice(originIdx + 1, destIdx + 1)
                          .reduce((sum: number, st: any) => sum + (st.price || 0), 0);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} — Rp {price.toLocaleString("id-ID")}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                {segmentPrice !== null && (
                  <p className="text-xs font-bold text-green-600 text-right">
                    Harga per kursi: Rp {segmentPrice.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all">
                Batal
              </button>
              <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-navy-deep text-white font-medium hover:bg-navy-deep/90 transition-all">
                Lanjut Isi Data
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nama Pemesan</label>
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nama lengkap" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Telepon</label>
                  <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="0812xxxx" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none font-medium" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email (opsional)</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none font-medium" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Penumpang ({passengers.length})</label>
                  <button onClick={addPassenger} className="text-xs text-navy-deep font-medium hover:underline">+ Tambah</button>
                </div>
                <div className="space-y-2">
                  {passengers.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={p} onChange={(e) => { const arr = [...passengers]; arr[i] = e.target.value; setPassengers(arr); }} placeholder={`Penumpang ${i + 1}`} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none" />
                      {passengers.length > 1 && (
                        <button onClick={() => removePassenger(i)} className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Kursi ({selectedSeats.length}/{validPassengers.length})
                </label>
                {loadingSeats ? (
                  <div className="py-4 text-center text-gray-400"><i className="ri-loader-4-line animate-spin"></i></div>
                ) : availableSeats.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Tidak ada kursi tersedia</p>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {availableSeats.map((seat) => {
                      const num = String(seat.seatNumber);
                      const isSelected = selectedSeats.includes(num);
                      const isFull = selectedSeats.length >= validPassengers.length;
                      return (
                        <button
                          key={num}
                          onClick={() => toggleSeat(num)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all ${
                            isSelected ? "bg-navy-deep text-white" : isFull ? "bg-orange-50 border border-orange-200 text-orange-600" : "bg-white border border-gray-200 text-gray-600 hover:border-navy-deep"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Metode Pembayaran</label>
                <div className="flex gap-2">
                  {["CASH", "TRANSFER", "POOL"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        paymentMethod === m ? "bg-navy-deep text-white" : "bg-surface-low text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSchedule && (
                <div className="bg-surface-low p-4 rounded-2xl">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{selectedSchedule.route?.origin} → {selectedSchedule.route?.destination}</span>
                    <span className="font-bold">{new Date(selectedSchedule.departureTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{validPassengers.length} x Rp {effectivePrice.toLocaleString("id-ID")}</span>
                    <span className="font-bold text-navy-deep">Rp {(effectivePrice * validPassengers.length).toLocaleString("id-ID")}</span>
                  </div>
                  {originStopId && destinationStopId && (
                    <p className="text-[10px] text-green-600 mt-1">
                      Harga dari titik rute: {stops.find((s: any) => s.id === originStopId)?.name} → {stops.find((s: any) => s.id === destinationStopId)?.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all">
                Kembali
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl bg-navy-deep text-white font-medium hover:bg-navy-deep/90 transition-all disabled:opacity-50">
                {loading ? "Menyimpan..." : "Buat Booking"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
