"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { editBooking, getAvailableSchedulesForReschedule, getAllActiveRoutes, getAvailableSeatsForSchedule, adminDeleteBooking, EditBookingData } from "@/app/actions/booking";
import Link from "next/link";
import { confirmAction, showSuccess, showError, showInfo } from "@/lib/swal";

interface Passenger {
  id?: string;
  name: string;
}

interface BookingActionsProps {
  bookingId: string;
  bookingCode: string;
  status: string;
  scheduleId: string;
  routeId: string;
  totalPrice: number;
  paymentMethod?: string;
  contactName: string;
  contactPhone: string;
  passengers: Passenger[];
  seatNumbers: string[];
  origin: string;
  destination: string;
}

export default function BookingActions({ 
  bookingId, 
  bookingCode, 
  status, 
  scheduleId,
  routeId,
  totalPrice,
  paymentMethod,
  contactName,
  contactPhone,
  passengers,
  seatNumbers,
  origin,
  destination
}: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Show simulate button for PENDING + MOOTA bookings
  const isPendingMoota = status === 'PENDING' && paymentMethod === 'MOOTA';

  // Show confirm button for PENDING + POOL bookings
  const isPendingPool = status === 'PENDING' && paymentMethod === 'POOL';

  // Show edit actions for CONFIRMED (paid) bookings
  const isConfirmed = status === 'CONFIRMED';
  const canDelete = true;
  const canInvoice = isConfirmed;

  if (!isPendingMoota && !isPendingPool && !isConfirmed && !canDelete) return null;

  const handleSave = async (data: EditBookingData) => {
    if (!(await confirmAction({ title: "Simpan Perubahan", text: "Apakah Anda yakin ingin menyimpan perubahan ini?" }))) return;

    setLoading(true);
    try {
      const result = await editBooking(data);
      await showSuccess({ title: "Berhasil", text: `Booking berhasil diupdate! (${result.type})` });
      setShowEditModal(false);
      router.refresh();
    } catch (err: any) {
      await showError({ title: "Gagal", text: err.message || "Gagal mengupdate booking" });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMoota = async () => {
    if (!(await confirmAction({ title: "Simulasi Pembayaran", text: `Simulasikan pembayaran MOOTA untuk booking ${bookingCode}? Total: Rp ${totalPrice.toLocaleString('id-ID')}` }))) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/simulate-moota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode })
      });

      const data = await res.json();

      if (res.ok) {
        await showSuccess({ title: "Berhasil", text: `Pembayaran berhasil disimulasikan! Booking ${data.booking.bookingCode} sekarang ${data.booking.status}` });
        router.refresh();
      } else {
        await showError({ title: "Gagal", text: `Gagal: ${data.error}` });
      }
    } catch {
      await showError({ title: "Terjadi Kesalahan", text: "Terjadi kesalahan saat simulasi" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPool = async () => {
    if (!(await confirmAction({ title: "Konfirmasi Pembayaran", text: `Konfirmasi pembayaran POOL untuk booking ${bookingCode}? Pelanggan: ${contactName} Total: Rp ${totalPrice.toLocaleString('id-ID')} Booking akan berubah menjadi CONFIRMED dan notifikasi dikirim ke pelanggan.` }))) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/confirm-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode })
      });

      const data = await res.json();

      if (res.ok) {
        await showSuccess({ title: "Berhasil", text: `Pembayaran POOL berhasil dikonfirmasi! Booking ${data.booking.bookingCode} sekarang CONFIRMED. Email & WhatsApp sudah dikirim ke pelanggan.` });
        router.refresh();
      } else {
        await showError({ title: "Gagal", text: `Gagal: ${data.error}` });
      }
    } catch {
      await showError({ title: "Terjadi Kesalahan", text: "Terjadi kesalahan saat konfirmasi" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(await confirmAction({ title: "Hapus Booking", danger: true, text: `Hapus permanen booking ${bookingCode}? Pelanggan: ${contactName} Data akan dihapus dari database dan kursi dibebaskan. Tindakan ini tidak bisa dibatalkan.` }))) return;

    setLoading(true);
    try {
      await adminDeleteBooking(bookingId);
      await showSuccess({ title: "Berhasil", text: `Booking ${bookingCode} berhasil dihapus.` });
      router.refresh();
    } catch (err: any) {
      await showError({ title: "Gagal", text: err.message || "Gagal menghapus booking" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1 flex-wrap">
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

        {/* Confirm Pool Payment Button - Only for PENDING + POOL */}
        {isPendingPool && (
          <button
            onClick={handleConfirmPool}
            disabled={loading}
            className="px-3 h-8 rounded-lg bg-gold-warm flex items-center justify-center text-white hover:bg-gold-warm/90 transition-all disabled:opacity-50 text-xs font-bold"
            title="Konfirmasi Bayar POOL"
          >
            <i className="ri-check-double-line mr-1"></i>
            Konfirmasi
          </button>
        )}

        {/* Edit Button - Only for CONFIRMED */}
        {isConfirmed && (
          <button
            onClick={() => setShowEditModal(true)}
            disabled={loading}
            className="px-3 h-8 rounded-lg bg-navy-deep flex items-center justify-center text-white hover:bg-navy-deep/90 transition-all disabled:opacity-50 text-xs font-bold"
            title="Edit Booking"
          >
            <i className="ri-edit-line mr-1"></i>
            Edit
          </button>
        )}

        {/* Invoice Button - Only for CONFIRMED */}
        {canInvoice && (
          <Link
            href={`/invoice/${bookingCode}`}
            target="_blank"
            className="px-3 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-all text-xs font-bold"
            title="Lihat Invoice"
          >
            <i className="ri-file-list-3-line mr-1"></i>
            Invoice
          </Link>
        )}

        {/* Delete Button - permanent remove from DB */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all disabled:opacity-50 text-xs font-bold"
            title="Hapus Permanen"
          >
            <i className="ri-delete-bin-line mr-1"></i>
            Hapus
          </button>
        )}
      </div>

      {/* Unified Edit Modal */}
      {showEditModal && (
        <EditBookingModal
          bookingId={bookingId}
          bookingCode={bookingCode}
          status={status}
          scheduleId={scheduleId}
          routeId={routeId}
          totalPrice={totalPrice}
          contactName={contactName}
          contactPhone={contactPhone}
          passengers={passengers}
          seatNumbers={seatNumbers}
          origin={origin}
          destination={destination}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
          loading={loading}
        />
      )}
    </>
  );
}

// Unified Edit Booking Modal Component
function EditBookingModal({
  bookingId,
  bookingCode,
  status,
  scheduleId,
  routeId,
  totalPrice,
  contactName: initialContactName,
  contactPhone: initialContactPhone,
  passengers: initialPassengers,
  seatNumbers: initialSeatNumbers,
  origin,
  destination,
  onClose,
  onSave,
  loading
}: {
  bookingId: string;
  bookingCode: string;
  status: string;
  scheduleId: string;
  routeId: string;
  totalPrice: number;
  contactName: string;
  contactPhone: string;
  passengers: Passenger[];
  seatNumbers: string[];
  origin: string;
  destination: string;
  onClose: () => void;
  onSave: (data: EditBookingData) => void;
  loading: boolean;
}) {
  // Form state
  const [activeTab, setActiveTab] = useState<'data' | 'reschedule' | 'changeRoute' | 'refund'>('data');
  const [contactName, setContactName] = useState(initialContactName);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [passengers, setPassengers] = useState<Passenger[]>(initialPassengers.length > 0 ? initialPassengers : [{ name: '' }]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>(initialSeatNumbers.map(String));

  // Reschedule state
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Change route state
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Refund state
  const [refundAmount, setRefundAmount] = useState(totalPrice);
  const [refundReason, setRefundReason] = useState("");

  // Available seats for current/new schedule
  const [availableSeats, setAvailableSeats] = useState<any[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Load schedules for reschedule tab
  useEffect(() => {
    if (activeTab === 'reschedule') {
      setLoadingSchedules(true);
      getAvailableSchedulesForReschedule(routeId, scheduleId)
        .then(setSchedules)
        .catch(console.error)
        .finally(() => setLoadingSchedules(false));
    }
  }, [activeTab, routeId, scheduleId]);

  // Load routes for change route tab
  useEffect(() => {
    if (activeTab === 'changeRoute') {
      setLoadingRoutes(true);
      getAllActiveRoutes()
        .then(data => setRoutes(data.filter((r: any) => r.id !== routeId)))
        .catch(console.error)
        .finally(() => setLoadingRoutes(false));
    }
  }, [activeTab, routeId]);

  // Load available seats when schedule changes or in data tab
  useEffect(() => {
    const targetScheduleId = activeTab === 'reschedule' ? selectedScheduleId :
                              activeTab === 'changeRoute' ? selectedScheduleId :
                              scheduleId;
    if (targetScheduleId) {
      setLoadingSeats(true);
      getAvailableSeatsForSchedule(targetScheduleId)
        .then(seats => {
          // Include currently selected seats if they belong to this schedule
          const currentSeatNums = initialSeatNumbers.map(String);
          console.log('Loading seats. Current:', currentSeatNums, 'Available from server:', seats.map((s: any) => s.seatNumber));
          const currentSeats = currentSeatNums.map(num => ({ seatNumber: num, status: 'BOOKED' }));
          const merged = [...currentSeats, ...seats.filter((s: any) => !currentSeatNums.includes(String(s.seatNumber)))];
          console.log('Merged seats:', merged.map((s: any) => ({ num: s.seatNumber, status: s.status })));
          setAvailableSeats(merged);
        })
        .catch(console.error)
        .finally(() => setLoadingSeats(false));
    }
  }, [activeTab, selectedScheduleId, scheduleId]);

  // Handle route selection in change route tab
  const handleRouteSelect = async (rId: string) => {
    setSelectedRouteId(rId);
    setSelectedScheduleId("");
    const schedules = await getAvailableSchedulesForReschedule(rId, "");
    setAvailableSchedules(schedules);
  };

  // Add/remove passengers
  const addPassenger = () => setPassengers([...passengers, { name: '' }]);
  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };
  const updatePassenger = (index: number, name: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], name };
    setPassengers(updated);
  };

  // Toggle seat selection - allows deselect, and swap if full
  const toggleSeat = (seatNumber: string) => {
    console.log('Toggle seat:', seatNumber, 'Current selected:', selectedSeatNumbers, 'Passengers:', passengers.length);
    
    if (selectedSeatNumbers.includes(seatNumber)) {
      // Deselect
      const newSelection = selectedSeatNumbers.filter(s => s !== seatNumber);
      console.log('Deselecting, new selection:', newSelection);
      setSelectedSeatNumbers(newSelection);
    } else if (selectedSeatNumbers.length < passengers.length) {
      // Select new seat
      const newSelection = [...selectedSeatNumbers, seatNumber];
      console.log('Selecting, new selection:', newSelection);
      setSelectedSeatNumbers(newSelection);
    } else {
      // Swap: remove last selected, add new one
      const newSelection = [...selectedSeatNumbers.slice(0, -1), seatNumber];
      console.log('Swapping seat, new selection:', newSelection);
      setSelectedSeatNumbers(newSelection);
    }
  };

  // Handle save based on active tab
  const handleSubmit = async () => {
    const data: EditBookingData = {
      bookingId,
      action: activeTab === 'data' ? 'EDIT_DATA' :
              activeTab === 'reschedule' ? 'RESCHEDULE' :
              activeTab === 'changeRoute' ? 'CHANGE_ROUTE' : 'REFUND'
    };

    if (activeTab === 'data') {
      data.contactName = contactName;
      data.contactPhone = contactPhone;
      data.passengers = passengers.filter(p => p.name.trim());
      if (selectedSeatNumbers.length > 0) data.seatNumbers = selectedSeatNumbers;
    } else if (activeTab === 'reschedule') {
      if (!selectedScheduleId) { await showInfo({ text: 'Pilih jadwal baru' }); return; }
      data.newScheduleId = selectedScheduleId;
      data.passengers = passengers.filter(p => p.name.trim());
      if (selectedSeatNumbers.length > 0) data.seatNumbers = selectedSeatNumbers;
    } else if (activeTab === 'changeRoute') {
      if (!selectedRouteId || !selectedScheduleId) { await showInfo({ text: 'Pilih rute dan jadwal baru' }); return; }
      data.newRouteId = selectedRouteId;
      data.newScheduleId = selectedScheduleId;
      data.passengers = passengers.filter(p => p.name.trim());
      if (selectedSeatNumbers.length > 0) data.seatNumbers = selectedSeatNumbers;
    } else if (activeTab === 'refund') {
      if (!refundReason.trim()) { await showInfo({ text: 'Alasan refund wajib diisi' }); return; }
      if (refundAmount <= 0 || refundAmount > totalPrice) { await showInfo({ text: 'Jumlah refund tidak valid' }); return; }
      data.refundAmount = refundAmount;
      data.refundReason = refundReason;
    }

    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-bold text-navy-deep">Edit Booking</h2>
            <p className="text-sm text-gray-500">{bookingCode} - {origin} <i className="ri-arrow-right-line"></i> {destination}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-low p-1 rounded-xl">
          {[
            { id: 'data', label: 'Data Pemesan', icon: 'ri-user-line' },
            { id: 'reschedule', label: 'Reschedule', icon: 'ri-calendar-schedule-line' },
            { id: 'changeRoute', label: 'Ganti Rute', icon: 'ri-route-line' },
            { id: 'refund', label: 'Refund', icon: 'ri-refund-line' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.id
                  ? 'bg-white text-navy-deep shadow-sm'
                  : 'text-gray-500 hover:text-navy-deep'
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* DATA TAB */}
          {activeTab === 'data' && (
            <>
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Nama Pemesan
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Telepon
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Penumpang ({passengers.length})
                  </label>
                  <button
                    onClick={addPassenger}
                    className="text-xs text-navy-deep font-medium hover:underline"
                  >
                    + Tambah Penumpang
                  </button>
                </div>
                <div className="space-y-2">
                  {passengers.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePassenger(i, e.target.value)}
                        placeholder={`Nama Penumpang ${i + 1}`}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-navy-deep focus:ring-2 focus:ring-navy-deep/20 outline-none"
                      />
                      {passengers.length > 1 && (
                        <button
                          onClick={() => removePassenger(i)}
                          className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seats */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Pilih Kursi ({selectedSeatNumbers.length}/{passengers.length})
                </label>
                {loadingSeats ? (
                  <div className="py-4 text-center text-gray-400">
                    <i className="ri-loader-4-line animate-spin"></i>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-2">
                    {availableSeats.map((seat, idx) => {
                      const seatNum = String(seat.seatNumber);
                      const isSelected = selectedSeatNumbers.includes(seatNum);
                      const isBooked = seat.status === 'BOOKED' && !isSelected;
                      const isFull = selectedSeatNumbers.length >= passengers.length;
                      const canClick = !isBooked; // Can click to select/deselect/swap
                      if (idx < 3) console.log(`Seat ${seatNum}: status=${seat.status}, isSelected=${isSelected}, isBooked=${isBooked}, isFull=${isFull}`);
                      return (
                        <button
                          key={seatNum}
                          onClick={() => {
                            console.log(`Click seat ${seatNum}, isBooked=${isBooked}`);
                            if (!isBooked) toggleSeat(seatNum);
                          }}
                          disabled={isBooked}
                          className={`py-2 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-navy-deep text-white'
                              : isBooked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isFull
                                  ? 'bg-orange-50 border border-orange-200 text-orange-600 hover:border-orange-400'
                                  : 'bg-white border border-gray-200 text-gray-600 hover:border-navy-deep'
                          }`}
                        >
                          {seatNum}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* RESCHEDULE TAB */}
          {activeTab === 'reschedule' && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Pilih jadwal baru untuk rute yang sama ({origin} <i className="ri-arrow-right-line"></i> {destination}).
              </p>
              {loadingSchedules ? (
                <div className="py-8 text-center text-gray-400">
                  <i className="ri-loader-4-line animate-spin text-2xl"></i>
                </div>
              ) : schedules.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Tidak ada jadwal tersedia</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {schedules.map((schedule) => (
                    <label
                      key={schedule.id}
                      className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedScheduleId === schedule.id
                          ? 'border-navy-deep bg-navy-deep/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="schedule"
                        value={schedule.id}
                        checked={selectedScheduleId === schedule.id}
                        onChange={() => setSelectedScheduleId(schedule.id)}
                        className="w-4 h-4 accent-navy-deep mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy-deep">
                            {new Date(schedule.departureTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-sm font-bold text-navy-deep">
                            Rp {schedule.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(schedule.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(schedule.arrivalTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Seats for new schedule */}
              {selectedScheduleId && (
                <div className="mt-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Pilih Kursi Baru ({selectedSeatNumbers.length}/{passengers.length})
                  </label>
                  {loadingSeats ? (
                    <div className="py-4 text-center text-gray-400">
                      <i className="ri-loader-4-line animate-spin"></i>
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 gap-2">
                      {availableSeats.map((seat) => {
                        const seatNum = String(seat.seatNumber);
                        const isSelected = selectedSeatNumbers.includes(seatNum);
                        const isFull = selectedSeatNumbers.length >= passengers.length;
                        return (
                          <button
                            key={seatNum}
                            onClick={() => toggleSeat(seatNum)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-navy-deep text-white'
                                : isFull
                                  ? 'bg-orange-50 border border-orange-200 text-orange-600 hover:border-orange-400'
                                  : 'bg-white border border-gray-200 text-gray-600 hover:border-navy-deep'
                            }`}
                          >
                            {seatNum}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* CHANGE ROUTE TAB */}
          {activeTab === 'changeRoute' && (
            <>
              {/* Route Selection */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Pilih Rute Baru
                </label>
                {loadingRoutes ? (
                  <div className="py-4 text-center text-gray-400">
                    <i className="ri-loader-4-line animate-spin"></i>
                  </div>
                ) : routes.length === 0 ? (
                  <p className="text-sm text-gray-400">Tidak ada rute lain tersedia</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {routes.map((route) => (
                      <label
                        key={route.id}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRouteId === route.id
                            ? 'border-navy-deep bg-navy-deep/5'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="route"
                          value={route.id}
                          checked={selectedRouteId === route.id}
                          onChange={() => handleRouteSelect(route.id)}
                          className="w-4 h-4 accent-navy-deep mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy-deep">{route.origin}</span>
                            <i className="ri-arrow-right-line text-gold-warm text-xs"></i>
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
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Pilih Jadwal
                  </label>
                  {availableSchedules.length === 0 ? (
                    <p className="text-sm text-gray-400">Tidak ada jadwal tersedia</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableSchedules.map((schedule) => (
                        <label
                          key={schedule.id}
                          className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedScheduleId === schedule.id
                              ? 'border-navy-deep bg-navy-deep/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="newSchedule"
                            value={schedule.id}
                            checked={selectedScheduleId === schedule.id}
                            onChange={() => setSelectedScheduleId(schedule.id)}
                            className="w-4 h-4 accent-navy-deep mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-navy-deep text-sm">
                                {new Date(schedule.departureTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                              <span className="text-xs font-bold text-navy-deep">
                                Rp {schedule.price.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(schedule.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Seats for new route */}
              {selectedScheduleId && (
                <div className="mt-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Pilih Kursi Baru ({selectedSeatNumbers.length}/{passengers.length})
                  </label>
                  {loadingSeats ? (
                    <div className="py-4 text-center text-gray-400">
                      <i className="ri-loader-4-line animate-spin"></i>
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 gap-2">
                      {availableSeats.map((seat) => {
                        const seatNum = String(seat.seatNumber);
                        const isSelected = selectedSeatNumbers.includes(seatNum);
                        const isFull = selectedSeatNumbers.length >= passengers.length;
                        return (
                          <button
                            key={seatNum}
                            onClick={() => toggleSeat(seatNum)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-navy-deep text-white'
                                : isFull
                                  ? 'bg-orange-50 border border-orange-200 text-orange-600 hover:border-orange-400'
                                  : 'bg-white border border-gray-200 text-gray-600 hover:border-navy-deep'
                            }`}
                          >
                            {seatNum}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* REFUND TAB */}
          {activeTab === 'refund' && (
            <>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
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
                    Jumlah Refund
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      max={totalPrice}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none font-medium"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Maksimal: Rp {totalPrice.toLocaleString('id-ID')}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Alasan Refund
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Masukkan alasan refund..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 ${
              activeTab === 'refund'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-navy-deep hover:bg-navy-deep/90'
            }`}
          >
            {loading ? 'Memproses...' : activeTab === 'refund' ? 'Proses Refund' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}
