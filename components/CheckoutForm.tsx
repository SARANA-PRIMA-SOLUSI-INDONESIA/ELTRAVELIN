"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validatePromoCode } from "@/app/actions/booking";
import { showError } from "@/lib/swal";

interface CheckoutFormProps {
  scheduleId: string;
  seatNumbers: string[];
  basePrice: number;
  vehicleType: string;
  departureTime: Date;
  availablePromos?: any[];
  originStopId?: string;
  destinationStopId?: string;
  originStopName?: string;
  destinationStopName?: string;
  segmentPrice?: number;
}

export default function CheckoutForm({ scheduleId, seatNumbers, basePrice, vehicleType, departureTime, availablePromos = [], originStopId, destinationStopId, originStopName, destinationStopName, segmentPrice }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; discount: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null);

  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<'MOOTA' | 'POOL'>('MOOTA');
  const [showPayment, setShowPayment] = useState(false);
  const [passengerNames, setPassengerNames] = useState<string[]>(
    new Array(seatNumbers.length).fill("")
  );

  const handlePassengerNameChange = (index: number, value: string) => {
    const newNames = [...passengerNames];
    newNames[index] = value;
    setPassengerNames(newNames);
  };

  const handleApplyPromo = async (codeOverride?: any) => {
    const codeToApply = typeof codeOverride === 'string' ? codeOverride : promoInput;
    if (!codeToApply) return;
    
    setPromoLoading(true);
    setPromoError("");
    try {
      const result = await validatePromoCode(
        codeToApply,
        basePrice * seatNumbers.length,
        seatNumbers.length
      );
      if (result.valid) {
        setAppliedPromo({ id: result.promoId!, discount: result.discount!, code: codeToApply.toUpperCase() });
        setPromoInput(codeToApply.toUpperCase());
        setPromoError("");
      } else {
        setPromoError(result.message || "Kode tidak valid");
        setAppliedPromo(null);
      }
    } catch (error) {
      setPromoError("Gagal memvalidasi kode");
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePromoClick = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPromo(code);
      setTimeout(() => setCopiedPromo(null), 2000);
      await handleApplyPromo(code);
    } catch (err) {
      console.error("Gagal menyalin kode ke clipboard: ", err);
      // Auto-apply promo even if clipboard is unavailable
      await handleApplyPromo(code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookingDraft = {
        scheduleId,
        contactName: contactData.name,
        contactEmail: contactData.email,
        contactPhone: contactData.phone,
        passengerNames,
        seatNumbers,
        promoCodeId: appliedPromo?.id,
        originStopId,
        destinationStopId,
        originStopName,
        destinationStopName,
        segmentPrice,
      };

      sessionStorage.setItem("eltravelin_booking_draft", JSON.stringify(bookingDraft));
      router.push("/payment");
    } catch (error) {
      console.error(error);
      await showError({ title: "Gagal", text: "Gagal melakukan pemesanan. Kursi mungkin sudah terisi." });
    } finally {
      setLoading(false);
    }
  };

  const totalBasePrice = basePrice * seatNumbers.length;
  const totalDiscount = appliedPromo?.discount || 0;
  const finalPrice = totalBasePrice - totalDiscount;

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Left: Form */}
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-10">
        {/* Contact Info */}
        <div className="glass rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-ambient border border-white/20">
          <h3 className="text-lg font-display font-bold text-navy-deep mb-8 flex items-center gap-3">
            <i className="ri-user-info-line text-gold-warm"></i> Informasi Pemesan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Nama Lengkap</label>
              <input 
                required
                type="text" 
                placeholder="Nama Anda"
                className="bg-surface-low rounded-2xl px-6 py-4 text-sm text-foreground/80 border border-navy-deep/5 focus:ring-2 focus:ring-gold-warm transition-all outline-none"
                value={contactData.name}
                onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">No. WhatsApp</label>
              <input 
                required
                type="tel" 
                placeholder="08123456789"
                className="bg-surface-low rounded-2xl px-6 py-4 text-sm text-foreground/80 border border-navy-deep/5 focus:ring-2 focus:ring-gold-warm transition-all outline-none"
                value={contactData.phone}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Email</label>
              <input 
                required
                type="email" 
                placeholder="email@anda.com"
                className="bg-surface-low rounded-2xl px-6 py-4 text-sm text-foreground/80 border border-navy-deep/5 focus:ring-2 focus:ring-gold-warm transition-all outline-none"
                value={contactData.email}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Passenger Info */}
        <div className="glass rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-ambient border border-white/20">
          <h3 className="text-lg font-display font-bold text-navy-deep mb-8 flex items-center gap-3">
            <i className="ri-group-line text-gold-warm"></i> Data Penumpang
          </h3>
          <div className="flex flex-col gap-8">
            {seatNumbers.map((seat, idx) => (
              <div key={seat} className="flex flex-col gap-4 p-6 bg-white/40 rounded-2xl border border-white/60">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-navy-deep/30 uppercase tracking-[0.2em]">Penumpang {idx + 1}</span>
                  <span className="px-3 py-1 bg-gold-warm/10 text-gold-warm rounded-lg text-[10px] font-bold uppercase">Kursi {seat}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Nama Sesuai KTP</label>
                  <input 
                    required
                    type="text" 
                    placeholder={`Nama Penumpang Kursi ${seat}`}
                    className="bg-white rounded-xl px-6 py-4 text-sm text-foreground/80 border border-navy-deep/5 focus:ring-2 focus:ring-gold-warm transition-all outline-none"
                    value={passengerNames[idx]}
                    onChange={(e) => handlePassengerNameChange(idx, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Promos (Tickets) */}
        {availablePromos.length > 0 && (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-navy-deep uppercase tracking-widest px-2">Promo Spesial Untuk Anda</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {availablePromos.map((promo: any) => {
                const isSelected = appliedPromo?.code === promo.code;
                const isCopied = copiedPromo === promo.code;
                
                return (
                  <button
                    key={promo.id}
                    type="button"
                    onClick={() => handlePromoClick(promo.code)}
                    className={`relative text-left flex flex-col justify-between overflow-hidden bg-white rounded-[1.5rem] p-6 cursor-pointer transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border ${
                      isSelected 
                        ? "border-gold-warm bg-gradient-to-br from-gold-soft/10 to-gold-warm/5" 
                        : "border-navy-deep/5"
                    }`}
                  >
                    {/* Left & Right Ticket Notches */}
                    <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#F8F9FA] border-r border-outline-ghost transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#F8F9FA] border-l border-outline-ghost transform -translate-y-1/2"></div>

                    {/* Dotted separator across the notches */}
                    <div className="absolute top-1/2 left-3 right-3 border-t border-dashed border-foreground/10 transform -translate-y-1/2 z-0"></div>

                    <div className="flex justify-between items-start gap-4 pb-4 z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-navy-deep/45 uppercase tracking-widest">HEMAT</span>
                        <span className="text-xl font-display font-extrabold text-navy-deep">
                          {promo.discountType === 'FIXED' 
                            ? `Rp ${promo.discountValue.toLocaleString('id-ID')}` 
                            : `${promo.discountValue}%`}
                        </span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                        isSelected 
                          ? "bg-gold-warm text-white" 
                          : "bg-navy-deep/5 text-navy-deep"
                      }`}>
                        {promo.code}
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center text-[10px] text-foreground/50 z-10 w-full mt-2">
                      <span>Min. Transaksi Rp {promo.minOrder.toLocaleString('id-ID')}</span>
                      <span className={`font-bold flex items-center gap-1 uppercase tracking-wider ${isSelected ? 'text-gold-warm' : 'text-navy-deep'}`}>
                        {isCopied ? (
                          <>
                            <i className="ri-checkbox-circle-fill text-green-500 text-xs"></i>
                            Tersalin!
                          </>
                        ) : isSelected ? (
                          <>
                            <i className="ri-checkbox-circle-line text-xs text-gold-warm"></i>
                            Terpasang
                          </>
                        ) : (
                          <>
                            <i className="ri-file-copy-line text-xs"></i>
                            Gunakan
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Promo Code */}
        <div className="glass rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 shadow-ambient border border-white/20">
          <h3 className="text-sm font-display font-bold text-navy-deep mb-4 uppercase tracking-widest">Punya Kode Promo?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Masukkan Kode"
              className="flex-grow bg-white rounded-xl px-6 py-4 text-sm text-foreground/80 border border-navy-deep/5 focus:ring-2 focus:ring-gold-warm transition-all outline-none uppercase font-bold tracking-widest"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
            />
            <button 
              type="button"
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoInput}
              className="bg-navy-deep text-white px-8 py-4 sm:py-0 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-navy-deep/90 disabled:opacity-50 transition-all min-w-[120px]"
            >
              {promoLoading ? "..." : "Pakai"}
            </button>
          </div>
          {promoError && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-widest">{promoError}</p>}
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="btn-primary w-full py-6 rounded-[2rem] font-bold text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Memproses..." : `Konfirmasi Pesanan - Rp ${finalPrice.toLocaleString('id-ID')}`}
        </button>
      </form>

      {/* Right: Summary */}
      <div className="w-full lg:w-96 flex flex-col gap-8 bg-white p-8 rounded-[2rem] shadow-ambient h-fit border border-gray-100">
        <h2 className="text-xl font-display font-bold text-navy-deep">Ringkasan Perjalanan</h2>

        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground/40 font-medium font-body uppercase tracking-widest text-[10px]">Waktu Keberangkatan</span>
            <span className="text-navy-deep font-bold font-display italic">
              {new Date(departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground/40 font-medium font-body uppercase tracking-widest text-[10px]">Tipe Armada</span>
            <span className="text-navy-deep font-bold font-display">{vehicleType}</span>
          </div>
          
          <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/40 font-medium font-body uppercase tracking-widest text-[10px]">Harga Tiket ({seatNumbers.length}x)</span>
              <span className="text-navy-deep font-bold">Rp {totalBasePrice.toLocaleString('id-ID')}</span>
            </div>
            
            {appliedPromo && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 font-medium font-body uppercase tracking-widest text-[10px]">Potongan Promo</span>
                <span className="text-green-600 font-bold">- Rp {totalDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-50">
              <span className="text-foreground/40 font-medium font-body uppercase tracking-widest text-[10px]">Total Pembayaran</span>
              <span className="text-2xl font-display font-bold text-navy-deep">
                Rp {finalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

