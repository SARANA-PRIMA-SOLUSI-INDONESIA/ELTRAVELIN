"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBookingByCode, updatePaymentMethod } from "@/app/actions/booking";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";
import { showError } from "@/lib/swal";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'MOOTA' | 'POOL'>('MOOTA');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (code) {
      getBookingByCode(code).then((res) => {
        setBooking(res);
        setLoading(false);
      });
    }
  }, [code]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await updatePaymentMethod(code!, paymentMethod);
      router.push(`/confirmation?code=${code}`);
    } catch (error) {
      console.error(error);
      await showError({ title: "Gagal", text: "Gagal memproses pembayaran." });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-display font-bold text-navy-deep">Memuat Data Booking...</div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center font-display font-bold text-red-500">Booking tidak ditemukan</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      <BookingWizard step={3} />

      <div className="max-w-4xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Selection */}
          <div className="flex-grow flex flex-col gap-8">
            <div className="glass rounded-[2.5rem] p-8 md:p-12 shadow-ambient border border-white/20">
              <h1 className="text-2xl font-display font-black text-navy-deep mb-2">Pilih Pembayaran</h1>
              <p className="text-gray-400 text-sm mb-8 font-medium">Silakan pilih metode pembayaran yang Anda inginkan</p>

              <div className="flex flex-col gap-4">
                {/* Moota Option */}
                <label className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === 'MOOTA' ? 'border-gold-warm bg-gold-warm/5' : 'border-navy-deep/5 hover:border-navy-deep/10 bg-white/40'}`}>
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="MOOTA"
                      checked={paymentMethod === 'MOOTA'}
                      onChange={() => setPaymentMethod('MOOTA')}
                      className="w-5 h-5 accent-gold-warm"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-navy-deep text-sm">Transfer Bank (Otomatis)</span>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Verifikasi instan via Moota</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-2 py-1 bg-white rounded border border-gray-100 text-[8px] font-bold text-gray-400 uppercase tracking-widest">BCA</div>
                    <div className="px-2 py-1 bg-white rounded border border-gray-100 text-[8px] font-bold text-gray-400 uppercase tracking-widest italic">Mandiri</div>
                  </div>
                </label>

                {/* Pay at Pool Option */}
                <label className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === 'POOL' ? 'border-red-200 bg-red-50/30' : 'border-navy-deep/5 hover:border-navy-deep/10 bg-white/40'}`}>
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="POOL"
                      checked={paymentMethod === 'POOL'}
                      onChange={() => setPaymentMethod('POOL')}
                      className="w-5 h-5 accent-red-500"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-navy-deep text-sm">Bayar di Pool</span>
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">⚠️ Pembayaran Manual di Loket</span>
                    </div>
                  </div>
                </label>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="btn-primary w-full py-6 rounded-[2rem] font-bold text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-10 disabled:opacity-50"
              >
                {processing ? "Memproses..." : "Lanjutkan Pembayaran"}
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-ambient border border-gray-100">
              <h3 className="text-lg font-display font-bold text-navy-deep mb-6">Ringkasan Pesanan</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">Kode Booking</span>
                  <span className="text-navy-deep font-bold">#{booking.bookingCode}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-50">
                  <span className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">Total Bayar</span>
                  <span className="text-xl font-display font-bold text-navy-deep">Rp {booking.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-display font-bold text-navy-deep">Memuat...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
