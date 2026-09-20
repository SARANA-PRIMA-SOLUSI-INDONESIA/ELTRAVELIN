"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateTourBooking } from "@/app/actions/admin-tour";
import { showError, showSuccess } from "@/lib/swal";
import { calcTourDiscount, calcTourSubtotal, formatIDR, tourQtyLabel } from "@/lib/tour";

interface ServiceOption {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  priceUnit: string;
  minPax: number;
  maxPax: number | null;
}

interface TourBookingFormProps {
  services: ServiceOption[];
  canDiscount: boolean;
}

export default function TourBookingForm({ services, canDiscount }: TourBookingFormProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [paxCount, setPaxCount] = useState(2);
  const [unitCount, setUnitCount] = useState(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState(services[0]?.basePrice || 0);
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"MOOTA" | "POOL" | "MANUAL">("MANUAL");
  const [markPaid, setMarkPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedService = services.find((s) => s.id === serviceId);

  const { subtotal, discountAmount, totalPrice, days } = useMemo(() => {
    const result = calcTourSubtotal({
      pricePerUnit,
      priceUnit: selectedService?.priceUnit || "PER_PAX",
      paxCount,
      unitCount,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    });
    const discount = canDiscount ? calcTourDiscount(result.subtotal, discountType, discountValue) : 0;
    return {
      subtotal: result.subtotal,
      days: result.days,
      discountAmount: discount,
      totalPrice: result.subtotal - discount,
    };
  }, [pricePerUnit, selectedService, paxCount, unitCount, startDate, endDate, discountType, discountValue, canDiscount]);

  const inputClass =
    "bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none";
  const labelClass = "text-xs font-bold text-navy-deep uppercase tracking-widest";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) {
      await showError({ title: "Gagal", text: "Pilih layanan terlebih dahulu." });
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      await showError({ title: "Gagal", text: "Nama dan nomor WhatsApp wajib diisi." });
      return;
    }
    if (canDiscount && discountAmount > 0 && !discountReason.trim()) {
      await showError({ title: "Gagal", text: "Alasan diskon wajib diisi." });
      return;
    }

    setSaving(true);
    try {
      const result = await adminCreateTourBooking({
        serviceId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        startDate,
        endDate: endDate || null,
        paxCount,
        unitCount,
        pickupLocation: pickupLocation || null,
        pricePerUnit,
        discountType: canDiscount ? discountType : null,
        discountValue: canDiscount ? discountValue : 0,
        discountReason: canDiscount ? discountReason : null,
        paymentMethod,
        markPaid,
        notes: notes || null,
      });
      await showSuccess({ title: "Booking Dibuat", text: `Kode booking: ${result.bookingCode}` });
      router.push("/admin/tour/bookings");
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Layanan</label>
        <select
          value={serviceId}
          onChange={(e) => {
            const next = services.find((s) => s.id === e.target.value);
            setServiceId(e.target.value);
            if (next) setPricePerUnit(next.basePrice);
          }}
          className={inputClass}
          required
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Nama Pemesan</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>No. WhatsApp</label>
          <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxxxx" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Email (Opsional)</label>
          <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Tanggal Mulai</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Tanggal Selesai (Opsional)</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Jumlah Peserta</label>
          <input type="number" min={1} value={paxCount} onChange={(e) => setPaxCount(Number(e.target.value))} className={inputClass} required />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Lokasi Penjemputan</label>
          <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Harga Satuan (Rp)</label>
          <input type="number" min={0} value={pricePerUnit || ""} onChange={(e) => setPricePerUnit(Number(e.target.value))} className={inputClass} required />
        </div>
      </div>

      {canDiscount && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Tipe Diskon</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "FIXED" | "PERCENT")} className={inputClass}>
              <option value="FIXED">Potongan Tetap (Rp)</option>
              <option value="PERCENT">Persentase (%)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nilai Diskon</label>
            <input type="number" min={0} value={discountValue || ""} onChange={(e) => setDiscountValue(Number(e.target.value))} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Alasan Diskon</label>
            <input type="text" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Metode Bayar</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "MOOTA" | "POOL" | "MANUAL")} className={inputClass}>
            <option value="MANUAL">Transfer Manual (Verifikasi Admin)</option>
            <option value="MOOTA">Transfer Bank (Otomatis)</option>
            <option value="POOL">Bayar di Pool / Loket</option>
          </select>
        </div>
        <div className="flex items-center justify-between bg-surface-low rounded-xl px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-navy-deep uppercase tracking-widest">Tandai Lunas</span>
            <span className="text-[10px] text-foreground/50">Booking langsung berstatus CONFIRMED</span>
          </div>
          <button
            type="button"
            onClick={() => setMarkPaid((v) => !v)}
            className={`relative w-14 h-8 rounded-full transition-colors ${markPaid ? "bg-navy-deep" : "bg-gray-300"}`}
            aria-pressed={markPaid}
          >
            <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${markPaid ? "translate-x-6" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Catatan Internal</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
      </div>

      <div className="bg-surface-low p-6 rounded-2xl flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">
            Subtotal ({tourQtyLabel({ priceUnit: selectedService?.priceUnit || "PER_PAX", paxCount, unitCount, days })} ×{" "}
            {formatIDR(pricePerUnit)})
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
          <span className="font-bold text-navy-deep">Total</span>
          <span className="font-bold text-navy-deep text-lg">{formatIDR(totalPrice)}</span>
        </div>
        {!markPaid && paymentMethod === "MOOTA" && (
          <p className="text-[10px] text-foreground/50">Kode unik 3 digit akan ditambahkan otomatis untuk rekonsiliasi transfer.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Booking"}
      </button>
    </form>
  );
}
