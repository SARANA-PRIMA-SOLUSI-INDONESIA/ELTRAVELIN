"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTourInquiry } from "@/app/actions/tour";
import { showError } from "@/lib/swal";
import {
  calcTourSubtotal,
  formatIDR,
  TOUR_PRICE_UNIT_LABELS,
  tourQtyLabel,
} from "@/lib/tour";

interface TourInquiryFormProps {
  serviceId: string;
  basePrice: number;
  priceUnit: string;
  minPax: number;
  maxPax?: number | null;
  durationDays?: number | null;
  requiresEndDate?: boolean;
}

function addDays(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00+07:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export default function TourInquiryForm({
  serviceId,
  basePrice,
  priceUnit,
  minPax,
  maxPax,
  durationDays,
  requiresEndDate,
}: TourInquiryFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(
    durationDays && durationDays > 1 ? addDays(today, durationDays - 1) : ""
  );
  const [paxCount, setPaxCount] = useState(minPax || 1);
  const [unitCount, setUnitCount] = useState(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { subtotal, days } = calcTourSubtotal({
    pricePerUnit: basePrice,
    priceUnit,
    paxCount,
    unitCount,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
  });

  const inputClass =
    "bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none";
  const labelClass = "text-[10px] font-bold text-navy-deep uppercase tracking-widest";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      await showError({ title: "Gagal", text: "Nama dan nomor WhatsApp wajib diisi." });
      return;
    }
    if (requiresEndDate && !endDate) {
      await showError({ title: "Gagal", text: "Tanggal selesai wajib diisi untuk sewa harian." });
      return;
    }

    setSaving(true);
    try {
      const result = await createTourInquiry({
        serviceId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        startDate,
        endDate: endDate || null,
        paxCount,
        unitCount,
        pickupLocation: pickupLocation || null,
        notes: notes || null,
      });
      router.push(`/tour/status/${result.inquiryCode}`);
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-ambient border border-outline-ghost flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-display font-bold text-navy-deep">Ajukan Penawaran</h2>
        <p className="text-xs text-foreground/50 font-body">
          Isi detail perjalanan Anda. Tim kami akan mengirim penawaran harga terbaik, termasuk diskon untuk rombongan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Nama Pemesan</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>No. WhatsApp</label>
          <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxxxx" className={inputClass} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Email (Opsional)</label>
        <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Tanggal Mulai</label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (durationDays && durationDays > 1) {
                setEndDate(addDays(e.target.value, durationDays - 1));
              }
            }}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Tanggal Selesai {requiresEndDate ? "" : "(Opsional)"}
          </label>
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Jumlah Peserta</label>
          <input
            type="number"
            min={minPax || 1}
            max={maxPax ? maxPax * unitCount : undefined}
            value={paxCount}
            onChange={(e) => setPaxCount(Number(e.target.value))}
            className={inputClass}
            required
          />
          {maxPax ? (
            <span className="text-[10px] text-foreground/40">
              Maksimal {maxPax} orang per unit
              {unitCount > 1 ? ` (${maxPax * unitCount} orang untuk ${unitCount} unit)` : ""}.
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Jumlah Unit / Armada</label>
          <input
            type="number"
            min={1}
            value={unitCount}
            onChange={(e) => setUnitCount(Math.max(1, Number(e.target.value) || 1))}
            className={inputClass}
            required
          />
          <span className="text-[10px] text-foreground/40">Berapa armada yang dibutuhkan? (default 1)</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Lokasi Penjemputan (Opsional)</label>
        <input
          type="text"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          placeholder="Contoh: Bandung kota"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Catatan (Opsional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Contoh: butuh 2 mobil, ada anak kecil, request destinasi tambahan"
          className={inputClass}
        />
      </div>

      <div className="bg-surface-low p-6 rounded-2xl flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">
            Estimasi ({tourQtyLabel({ priceUnit, paxCount, unitCount, days })} × {formatIDR(basePrice)}{" "}
            {TOUR_PRICE_UNIT_LABELS[priceUnit]})
          </span>
          <span className="font-bold text-navy-deep">{formatIDR(subtotal)}</span>
        </div>
        <p className="text-[10px] text-foreground/40">
          Estimasi belum termasuk diskon/negosiasi. Penawaran final akan dikirim admin.
        </p>
      </div>

      <button type="submit" disabled={saving} className="btn-primary py-5 rounded-2xl font-bold text-sm shadow-lg disabled:opacity-50">
        {saving ? "Mengirim..." : "Kirim Permintaan Penawaran"}
      </button>
    </form>
  );
}
