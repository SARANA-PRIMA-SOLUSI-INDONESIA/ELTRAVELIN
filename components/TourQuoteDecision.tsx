"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptTourQuote, rejectTourQuote } from "@/app/actions/tour";
import { confirmAction, showError } from "@/lib/swal";
import { formatIDR } from "@/lib/tour";

interface TourQuoteDecisionProps {
  quoteId: string;
  totalPrice: number;
  discountAmount: number;
  discountReason?: string | null;
  validUntil?: string | null;
}

export default function TourQuoteDecision({
  quoteId,
  totalPrice,
  discountAmount,
  discountReason,
  validUntil,
}: TourQuoteDecisionProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"MOOTA" | "POOL" | "MANUAL">("MOOTA");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    const confirmed = await confirmAction({
      title: "Terima Penawaran",
      text: "Lanjutkan ke pembayaran dengan penawaran ini?",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await acceptTourQuote(quoteId, paymentMethod);
      router.push(`/tour/booking/${result.bookingCode}`);
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const confirmed = await confirmAction({
      title: "Tolak Penawaran",
      danger: true,
      text: "Tolak penawaran ini? Anda bisa mengajukan permintaan baru nanti.",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await rejectTourQuote(quoteId);
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-ambient border border-gold-soft flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest">Penawaran untuk Anda</span>
        <span className="text-3xl font-display font-bold text-navy-deep">{formatIDR(totalPrice)}</span>
        {discountAmount > 0 && (
          <span className="text-xs text-green-600 font-bold">
            Anda hemat {formatIDR(discountAmount)}
            {discountReason ? ` — ${discountReason}` : ""}
          </span>
        )}
        {validUntil && (
          <span className="text-[10px] text-foreground/40">
            Berlaku sampai {new Date(validUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Pilih Metode Pembayaran</span>
        {[
          { value: "MOOTA", title: "Transfer Bank", desc: "Verifikasi otomatis (kode unik 3 digit)" },
          { value: "MANUAL", title: "Transfer Manual", desc: "Unggah bukti transfer, diverifikasi admin" },
          { value: "POOL", title: "Bayar di Pool", desc: "Bayar langsung di loket" },
        ].map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              paymentMethod === option.value
                ? "border-gold-warm bg-gold-warm/5"
                : "border-navy-deep/5 hover:border-navy-deep/10"
            }`}
          >
            <input
              type="radio"
              name="tourPaymentMethod"
              value={option.value}
              checked={paymentMethod === option.value}
              onChange={() => setPaymentMethod(option.value as "MOOTA" | "POOL" | "MANUAL")}
              className="w-4 h-4 accent-gold-warm"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-navy-deep">{option.title}</span>
              <span className="text-[10px] text-foreground/50">{option.desc}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={loading}
          className="btn-primary flex-1 py-4 rounded-2xl font-bold text-sm shadow-lg disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Terima & Lanjut Bayar"}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={loading}
          className="px-8 py-4 rounded-2xl font-bold text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
        >
          Tolak
        </button>
      </div>
    </div>
  );
}
