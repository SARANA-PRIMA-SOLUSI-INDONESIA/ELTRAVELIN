"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertQuoteToBooking } from "@/app/actions/admin-tour";
import { confirmAction, showError, showSuccess } from "@/lib/swal";

interface TourConvertFormProps {
  quoteId: string;
  defaultPaymentMethod?: string | null;
}

export default function TourConvertForm({ quoteId, defaultPaymentMethod }: TourConvertFormProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<string>(defaultPaymentMethod || "MANUAL");
  const [markPaid, setMarkPaid] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    const confirmed = await confirmAction({
      title: "Jadikan Booking",
      text: "Konversi penawaran ini menjadi booking Tour & Sewa?",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await convertQuoteToBooking(quoteId, {
        paymentMethod: paymentMethod as "MOOTA" | "POOL" | "MANUAL",
        markPaid,
      });
      await showSuccess({
        title: "Booking Dibuat",
        text: `Kode booking: ${result.bookingCode}`,
      });
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-surface-low p-6 rounded-2xl">
      <span className="text-xs font-bold text-navy-deep uppercase tracking-widest">Konversi ke Booking</span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Metode Bayar</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
          >
            <option value="MANUAL">Transfer Manual (Verifikasi Admin)</option>
            <option value="MOOTA">Transfer Bank (Otomatis)</option>
            <option value="POOL">Bayar di Pool / Loket</option>
          </select>
        </div>
        <div className="flex items-center justify-between bg-white rounded-xl px-5 py-3">
          <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Tandai Lunas</span>
          <button
            type="button"
            onClick={() => setMarkPaid((v) => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors ${markPaid ? "bg-navy-deep" : "bg-gray-300"}`}
            aria-pressed={markPaid}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${markPaid ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleConvert}
        disabled={loading}
        className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Jadikan Booking"}
      </button>
    </div>
  );
}
