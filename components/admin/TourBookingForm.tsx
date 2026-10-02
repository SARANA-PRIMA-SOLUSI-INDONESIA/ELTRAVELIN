"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateTourBooking } from "@/app/actions/admin-tour";
import { showError, showSuccess } from "@/lib/swal";
import {
  TOUR_PRICE_UNIT_LABELS,
  TOUR_TYPE_LABELS,
  calcTourDiscount,
  calcTourSubtotal,
  formatIDR,
  tourQtyLabel,
  type TourPriceUnitValue,
  type TourServiceTypeValue,
} from "@/lib/tour";

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

type Mode = "CATALOG" | "CUSTOM";

export default function TourBookingForm({ services, canDiscount }: TourBookingFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(services.length > 0 ? "CATALOG" : "CUSTOM");
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<TourServiceTypeValue>("DAILY_RENTAL");
  const [customPriceUnit, setCustomPriceUnit] = useState<TourPriceUnitValue>("PER_DAY");
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
  const [markPaid, setMarkPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedService = mode === "CATALOG" ? services.find((s) => s.id === serviceId) : undefined;
  const priceUnit = (selectedService?.priceUnit || customPriceUnit) as string;

  const { subtotal, discountAmount, totalPrice, days } = useMemo(() => {
    const result = calcTourSubtotal({
      pricePerUnit,
      priceUnit,
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
  }, [pricePerUnit, priceUnit, paxCount, unitCount, startDate, endDate, discountType, discountValue, canDiscount]);

  const inputClass =
    "bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none";
  const labelClass = "text-xs font-bold text-navy-deep uppercase tracking-widest";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "CATALOG" && !serviceId) {
      await showError({ title: "Gagal", text: "Pilih layanan terlebih dahulu." });
      return;
    }
    if (mode === "CUSTOM" && !customName.trim()) {
      await showError({ title: "Gagal", text: "Nama layanan custom wajib diisi." });
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
        serviceId: mode === "CATALOG" ? serviceId : null,
        serviceName: mode === "CUSTOM" ? customName.trim() : null,
        serviceType: mode === "CUSTOM" ? customType : null,
        priceUnit: mode === "CUSTOM" ? customPriceUnit : null,
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
      <div className="flex gap-2 p-1 bg-surface-low rounded-xl">
        <button
          type="button"
          onClick={() => {
            setMode("CATALOG");
            if (services[0]) {
              setServiceId(services[0].id);
              setPricePerUnit(services[0].basePrice);
            }
          }}
          disabled={services.length === 0}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
            mode === "CATALOG" ? "bg-navy-deep text-white" : "text-foreground/50 hover:text-navy-deep"
          }`}
        >
          Dari Catalog
        </button>
        <button
          type="button"
          onClick={() => setMode("CUSTOM")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            mode === "CUSTOM" ? "bg-navy-deep text-white" : "text-foreground/50 hover:text-navy-deep"
          }`}
        >
          Custom (di luar catalog)
        </button>
      </div>

      {mode === "CATALOG" ? (
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Layanan Catalog</label>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2 md:col-span-1">
            <label className={labelClass}>Nama Layanan</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Contoh: Sewa Hiace 3 hari Medan-Lake Toba"
              className={inputClass}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Tipe</label>
            <select
              value={customType}
              onChange={(e) => setCustomType(e.target.value as TourServiceTypeValue)}
              className={inputClass}
            >
              {Object.entries(TOUR_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Satuan Harga</label>
            <select
              value={customPriceUnit}
              onChange={(e) => setCustomPriceUnit(e.target.value as TourPriceUnitValue)}
              className={inputClass}
            >
              {Object.entries(TOUR_PRICE_UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
          <select
            value={paymentMethod}
            onChange={(e) => {
              const next = e.target.value as "MOOTA" | "POOL" | "MANUAL";
              setPaymentMethod(next);
              // MOOTA nunggu webhook; POOL nunggu konfirmasi admin.
              if (next === "MOOTA" || next === "POOL") setMarkPaid(false);
            }}
            className={inputClass}
          >
            <option value="MANUAL">Transfer Manual (Verifikasi Admin)</option>
            <option value="MOOTA">Transfer Bank (Otomatis)</option>
            <option value="POOL">Bayar di Pool / Loket</option>
          </select>
        </div>
        <div className="flex items-center justify-between bg-surface-low rounded-xl px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-navy-deep uppercase tracking-widest">Tandai Lunas</span>
            <span className="text-[10px] text-foreground/50">
              {paymentMethod === "MOOTA"
                ? "Off = tunggu Moota / verifikasi admin"
                : paymentMethod === "POOL"
                  ? "Off = tunggu konfirmasi admin setelah bayar di pool"
                  : "On hanya jika sudah lunas sekarang"}
            </span>
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
