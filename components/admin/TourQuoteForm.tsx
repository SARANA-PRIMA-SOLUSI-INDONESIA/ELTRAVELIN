"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTourQuote } from "@/app/actions/admin-tour";
import { showError, showSuccess } from "@/lib/swal";
import {
  calcTourDiscount,
  calcTourSubtotal,
  formatIDR,
  TOUR_PRICE_UNIT_LABELS,
  tourQtyLabel,
} from "@/lib/tour";

interface TourQuoteFormProps {
  inquiryId: string;
  basePrice: number;
  paxCount: number;
  unitCount: number;
  startDate: string;
  endDate?: string | null;
  priceUnit: string;
  canDiscount: boolean;
}

export default function TourQuoteForm({
  inquiryId,
  basePrice,
  paxCount,
  unitCount: initialUnitCount,
  startDate,
  endDate,
  priceUnit,
  canDiscount,
}: TourQuoteFormProps) {
  const router = useRouter();
  const [pricePerUnit, setPricePerUnit] = useState(basePrice);
  const [unitCount, setUnitCount] = useState(Math.max(1, initialUnitCount || 1));
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [saving, setSaving] = useState(false);

  const { subtotal, discountAmount, totalPrice, days } = useMemo(() => {
    const result = calcTourSubtotal({
      pricePerUnit,
      priceUnit,
      paxCount,
      unitCount,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    });
    const discount = canDiscount
      ? calcTourDiscount(result.subtotal, discountType, discountValue)
      : 0;
    return {
      subtotal: result.subtotal,
      days: result.days,
      discountAmount: discount,
      totalPrice: result.subtotal - discount,
    };
  }, [pricePerUnit, priceUnit, paxCount, unitCount, startDate, endDate, discountType, discountValue, canDiscount]);

  const inputClass =
    "bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none";
  const labelClass = "text-xs font-bold text-navy-deep uppercase tracking-widest";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pricePerUnit <= 0) {
      await showError({ title: "Gagal", text: "Harga penawaran wajib diisi." });
      return;
    }
    if (canDiscount && discountAmount > 0 && !discountReason.trim()) {
      await showError({ title: "Gagal", text: "Alasan diskon wajib diisi." });
      return;
    }

    setSaving(true);
    try {
      await createTourQuote({
        inquiryId,
        pricePerUnit,
        unitCount,
        discountType: canDiscount ? discountType : null,
        discountValue: canDiscount ? discountValue : 0,
        discountReason: canDiscount ? discountReason : null,
        validUntil: validUntil || null,
        notes: notes || null,
        sendNow,
      });
      await showSuccess({
        title: "Berhasil",
        text: sendNow ? "Penawaran dibuat dan dikirim ke customer." : "Penawaran disimpan sebagai draft.",
      });
      setPricePerUnit(basePrice);
      setDiscountValue(0);
      setDiscountReason("");
      setValidUntil("");
      setNotes("");
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-display font-bold text-navy-deep">Buat Penawaran</h2>
        <p className="text-xs text-foreground/50">
          Harga dihitung {TOUR_PRICE_UNIT_LABELS[priceUnit]} • {paxCount} pax • {unitCount} unit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Harga Satuan (Rp)</label>
          <input
            type="number"
            min={0}
            value={pricePerUnit || ""}
            onChange={(e) => setPricePerUnit(Number(e.target.value))}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Jumlah Unit</label>
          <input
            type="number"
            min={1}
            value={unitCount}
            onChange={(e) => setUnitCount(Math.max(1, Number(e.target.value) || 1))}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Berlaku Sampai</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {canDiscount ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Tipe Diskon</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "FIXED" | "PERCENT")}
                className={inputClass}
              >
                <option value="FIXED">Potongan Tetap (Rp)</option>
                <option value="PERCENT">Persentase (%)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Nilai Diskon</label>
              <input
                type="number"
                min={0}
                value={discountValue || ""}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Alasan Diskon</label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Contoh: nego rombongan"
                className={inputClass}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface-low rounded-xl px-5 py-4 text-xs text-foreground/50">
          Role Anda tidak dapat memberi diskon pada penawaran.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Catatan untuk Customer</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Contoh: harga sudah termasuk tol dan parkir"
        />
      </div>

      <div className="bg-surface-low p-6 rounded-2xl flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">
            Subtotal ({tourQtyLabel({ priceUnit, paxCount, unitCount, days })} × {formatIDR(pricePerUnit)})
          </span>
          <span className="font-bold text-navy-deep">{formatIDR(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Diskon</span>
            <span className="font-bold">- {formatIDR(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-outline-ghost pt-2 mt-1">
          <span className="font-bold text-navy-deep">Total Penawaran</span>
          <span className="font-bold text-navy-deep text-lg">{formatIDR(totalPrice)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface-low rounded-xl px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-navy-deep uppercase tracking-widest">Kirim Sekarang</span>
          <span className="text-[10px] text-foreground/50">Kirim via WhatsApp & email ke customer</span>
        </div>
        <button
          type="button"
          onClick={() => setSendNow((v) => !v)}
          className={`relative w-14 h-8 rounded-full transition-colors ${sendNow ? "bg-navy-deep" : "bg-gray-300"}`}
          aria-pressed={sendNow}
        >
          <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${sendNow ? "translate-x-6" : ""}`} />
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : sendNow ? "Simpan & Kirim Penawaran" : "Simpan Draft"}
      </button>
    </form>
  );
}
