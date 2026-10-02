"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTourBooking,
  updateTourBookingStatus,
  verifyTourPayment,
} from "@/app/actions/admin-tour";
import { confirmAction, showError, showSuccess } from "@/lib/swal";

interface TourBookingActionsProps {
  bookingId: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Menunggu Pembayaran" },
  { value: "CONFIRMED", label: "Terkonfirmasi" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export default function TourBookingActions({ bookingId, status }: TourBookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const confirmed = await confirmAction({
      title: "Verifikasi Pembayaran",
      text: "Tandai pembayaran booking ini sebagai lunas dan terverifikasi?",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await verifyTourPayment(bookingId);
      await showSuccess({ title: "Terverifikasi", text: "Booking berhasil dikonfirmasi." });
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (next: string) => {
    const confirmed = await confirmAction({
      title: "Ubah Status",
      text: `Ubah status booking menjadi "${next}"?`,
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await updateTourBookingStatus(bookingId, next as never);
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: "Hapus Booking",
      danger: true,
      text: "Hapus booking ini secara permanen?",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteTourBooking(bookingId);
      router.push("/admin/tour/bookings");
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {status === "PENDING" && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <i className="ri-shield-check-line"></i>
          Verifikasi Pembayaran
        </button>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Ubah Status</span>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.filter((option) => option.value !== status).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-surface-low text-navy-deep text-xs font-bold hover:bg-surface-medium transition-all disabled:opacity-50"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="py-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50"
      >
        Hapus Booking
      </button>
    </div>
  );
}
