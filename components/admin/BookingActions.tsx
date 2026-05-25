"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { rescheduleBooking, processRefund, changeBookingRoute } from "@/app/actions/booking";

interface BookingActionsProps {
  bookingId: string;
  bookingCode: string;
  status: string;
  scheduleId: string;
  routeId: string;
  totalPrice: number;
  paymentMethod?: string;
}

export default function BookingActions({ 
  bookingId, 
  bookingCode, 
  status, 
  scheduleId,
  routeId,
  totalPrice,
  paymentMethod
}: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showChangeRouteModal, setShowChangeRouteModal] = useState(false);

  // Show simulate button for PENDING + MOOTA bookings
  const isPendingMoota = status === 'PENDING' && paymentMethod === 'MOOTA';
  
  // Show edit actions for CONFIRMED (paid) bookings
  const isConfirmed = status === 'CONFIRMED';
  
  if (!isPendingMoota && !isConfirmed) return null;

  const handleReschedule = async (newScheduleId: string) => {
    if (!confirm("Apakah Anda yakin ingin mengubah jadwal booking ini?")) return;

    setLoading(true);
    try {
      await rescheduleBooking(bookingId, newScheduleId);
      alert("Booking berhasil di-reschedule!");
      setShowRescheduleModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal reschedule booking");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (refundAmount: number, reason: string) => {
    if (!confirm(`Apakah Anda yakin ingin memproses refund sebesar Rp ${refundAmount.toLocaleString('id-ID')}?`)) return;

    setLoading(true);
    try {
      await processRefund(bookingId, refundAmount, reason);
      alert("Refund berhasil diproses!");
      setShowRefundModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal memproses refund");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRoute = async (newRouteId: string, newScheduleId: string) => {
    if (!confirm("Apakah Anda yakin ingin mengubah rute booking ini?")) return;

    setLoading(true);
    try {
      await changeBookingRoute(bookingId, newRouteId, newScheduleId);
      alert("Rute booking berhasil diubah!");
      setShowChangeRouteModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah rute");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMoota = async () => {
    if (!confirm(`Simulasikan pembayaran MOOTA untuk booking ${bookingCode}?\nTotal: Rp ${totalPrice.toLocaleString('id-ID')}`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/simulate-moota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Pembayaran berhasil disimulasikan!\nBooking ${data.booking.bookingCode} sekarang ${data.booking.status}`);
        router.refresh();
      } else {
        alert(`❌ Gagal: ${data.error}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat simulasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Simulate Moota Payment Button - Only for PENDING + MOOTA */}
        {isPendingMoota && (
          <button
            onClick={handleSimulateMoota}
            disabled={loading}
            className="px-3 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-all disabled:opacity-50 text-xs font-bold"
            title="Simulasi Bayar MOOTA"
          >
            <i className="ri-money-dollar-circle-line mr-1"></i>
            Bayar
          </button>
        )}

        {/* Reschedule Button - Only for CONFIRMED */}
        {isConfirmed && (
          <>
            <button
              onClick={() => setShowRescheduleModal(true)}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
              title="Reschedule"
            >
              <i className="ri-calendar-schedule-line text-sm"></i>
            </button>

            <button
              onClick={() => setShowChangeRouteModal(true)}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 hover:bg-amber-100 transition-all disabled:opacity-50"
              title="Pindah Rute"
            >
              <i className="ri-route-line text-sm"></i>
            </button>

            <button
              onClick={() => setShowRefundModal(true)}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
              title="Refund"
            >
              <i className="ri-refund-line text-sm"></i>
            </button>
          </>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <RescheduleModal
          bookingId={bookingId}
          currentScheduleId={scheduleId}
          routeId={routeId}
          onClose={() => setShowRescheduleModal(false)}
          onConfirm={handleReschedule}
          loading={loading}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <RefundModal
          bookingCode={bookingCode}
          totalPrice={totalPrice}
          onClose={() => setShowRefundModal(false)}
          onConfirm={handleRefund}
          loading={loading}
        />
      )}

      {/* Change Route Modal */}
      {showChangeRouteModal && (
        <ChangeRouteModal
          bookingId={bookingId}
          currentRouteId={routeId}
          onClose={() => setShowChangeRouteModal(false)}
          onConfirm={handleChangeRoute}
          loading={loading}
        />
      )}
    </>
  );
}

// Reschedule Modal Component
function RescheduleModal({ 
  bookingId, 
  currentScheduleId, 
  routeId,
  onClose, 
  onConfirm, 
  loading 
}: { 
  bookingId: string;
  currentScheduleId: string;
  routeId: string;
  onClose: () => void;
  onConfirm: (newScheduleId: string) => void;
  loading: boolean;
}) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Fetch available schedules on mount
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { getAvailableSchedulesForReschedule } = await import("@/app/actions/booking");
        const data = await getAvailableSchedulesForReschedule(routeId, currentScheduleId);
        setSchedules(data);
      } catch (err) {
        console.error("Failed to load schedules:", err);
      } finally {
        setLoadingSchedules(false);
      }
    };
    fetchSchedules();
  }, [routeId, currentScheduleId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-navy-deep">Reschedule Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Pilih jadwal baru untuk booking ini. Harga akan disesuaikan dengan jadwal baru.
        </p>

        {loadingSchedules ? (
          <div className="py-8 text-center text-gray-400">
            <i className="ri-loader-4-line animate-spin text-2xl"></i>
            <p className="text-sm mt-2">Memuat jadwal...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <i className="ri-calendar-close-line text-3xl mb-2"></i>
            <p className="text-sm">Tidak ada jadwal tersedia untuk rute ini</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {schedules.map((schedule) => (
              <label
                key={schedule.id}
                className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedScheduleId === schedule.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="schedule"
                  value={schedule.id}
                  checked={selectedScheduleId === schedule.id}
                  onChange={() => setSelectedScheduleId(schedule.id)}
                  className="w-4 h-4 accent-blue-500 mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-deep">
                      {new Date(schedule.departureTime).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      Rp {schedule.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(schedule.departureTime).toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {new Date(schedule.arrivalTime).toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {schedule.operatingTrip?._count?.seats || 0} kursi tersedia
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(selectedScheduleId)}
            disabled={!selectedScheduleId || loading}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Konfirmasi Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Refund Modal Component
function RefundModal({ 
  bookingCode,
  totalPrice,
  onClose, 
  onConfirm, 
  loading 
}: { 
  bookingCode: string;
  totalPrice: number;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => void;
  loading: boolean;
}) {
  const [refundAmount, setRefundAmount] = useState(totalPrice);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-navy-deep">Proses Refund</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <i className="ri-error-warning-line text-red-500 text-xl"></i>
            <div>
              <p className="text-sm font-medium text-red-700">Peringatan</p>
              <p className="text-xs text-red-600">Refund akan membatalkan booking dan mengembalikan dana ke pelanggan.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Kode Booking
            </label>
            <input
              type="text"
              value={bookingCode}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Jumlah Refund
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                max={totalPrice}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Total pembayaran: Rp {totalPrice.toLocaleString('id-ID')}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Alasan Refund
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan refund..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(refundAmount, reason)}
            disabled={!reason.trim() || refundAmount <= 0 || refundAmount > totalPrice || loading}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Proses Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Change Route Modal Component
function ChangeRouteModal({ 
  bookingId,
  currentRouteId,
  onClose, 
  onConfirm, 
  loading 
}: { 
  bookingId: string;
  currentRouteId: string;
  onClose: () => void;
  onConfirm: (routeId: string, scheduleId: string) => void;
  loading: boolean;
}) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Fetch routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const { getAllActiveRoutes } = await import("@/app/actions/booking");
        const data = await getAllActiveRoutes();
        setRoutes(data.filter((r: any) => r.id !== currentRouteId));
      } catch (err) {
        console.error("Failed to load routes:", err);
      } finally {
        setLoadingRoutes(false);
      }
    };
    fetchRoutes();
  }, [currentRouteId]);

  // Fetch schedules when route is selected
  const handleRouteSelect = async (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedScheduleId("");
    
    try {
      const { getAvailableSchedulesForReschedule } = await import("@/app/actions/booking");
      const schedules = await getAvailableSchedulesForReschedule(routeId, "");
      setAvailableSchedules(schedules);
    } catch (err) {
      console.error("Failed to load schedules:", err);
      setAvailableSchedules([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-navy-deep">Pindah Rute</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Pilih rute dan jadwal baru untuk booking ini.
        </p>

        {/* Route Selection */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
            Pilih Rute
          </label>
          {loadingRoutes ? (
            <div className="py-4 text-center text-gray-400">
              <i className="ri-loader-4-line animate-spin"></i>
            </div>
          ) : routes.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Tidak ada rute lain tersedia</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {routes.map((route) => (
                <label
                  key={route.id}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRouteId === route.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="route"
                    value={route.id}
                    checked={selectedRouteId === route.id}
                    onChange={() => handleRouteSelect(route.id)}
                    className="w-4 h-4 accent-amber-500 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-deep">{route.origin}</span>
                      <i className="ri-arrow-right-line text-amber-500 text-xs"></i>
                      <span className="font-bold text-navy-deep">{route.destination}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Selection */}
        {selectedRouteId && (
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
              Pilih Jadwal
            </label>
            {availableSchedules.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Tidak ada jadwal tersedia untuk rute ini</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableSchedules.map((schedule) => (
                  <label
                    key={schedule.id}
                    className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedScheduleId === schedule.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value={schedule.id}
                      checked={selectedScheduleId === schedule.id}
                      onChange={() => setSelectedScheduleId(schedule.id)}
                      className="w-4 h-4 accent-blue-500 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-navy-deep text-sm">
                          {new Date(schedule.departureTime).toLocaleDateString('id-ID', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short'
                          })}
                        </span>
                        <span className="text-xs font-bold text-blue-600">
                          Rp {schedule.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(schedule.departureTime).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(selectedRouteId, selectedScheduleId)}
            disabled={!selectedRouteId || !selectedScheduleId || loading}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Konfirmasi Pindah Rute"}
          </button>
        </div>
      </div>
    </div>
  );
}
