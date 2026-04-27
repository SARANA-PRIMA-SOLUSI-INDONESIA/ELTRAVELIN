"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/app/actions/booking";
import Script from "next/script";

declare global {
  interface Window {
    snap: any;
  }
}

interface CheckoutFormProps {
  scheduleId: string;
  seatNumber: string;
}

export default function CheckoutForm({ scheduleId, seatNumber }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerEmail: "",
    passengerPhone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const booking = await createBooking({
        scheduleId,
        seatNumber,
        ...formData,
      });

      if (booking.snapToken && window.snap) {
        window.snap.pay(booking.snapToken, {
          onSuccess: function (result: any) {
            console.log('Payment success:', result);
            router.push(`/confirmation?code=${booking.bookingCode}`);
          },
          onPending: function (result: any) {
            console.log('Payment pending:', result);
            router.push(`/confirmation?code=${booking.bookingCode}`);
          },
          onError: function (result: any) {
            console.error('Payment error:', result);
            alert("Terjadi kesalahan pada pembayaran.");
          },
          onClose: function () {
            console.log('Snap popup closed without finishing payment');
            router.push(`/confirmation?code=${booking.bookingCode}`);
          }
        });
      } else {
        router.push(`/confirmation?code=${booking.bookingCode}`);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan pemesanan. Kursi mungkin sudah terisi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="beforeInteractive"
      />
      
      <div className="glass rounded-[3rem] p-12 shadow-ambient">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Nama Lengkap</label>
            <input 
              required
              type="text" 
              placeholder="Contoh: Budi Santoso"
              className="bg-surface-low rounded-2xl px-6 py-4 text-sm text-foreground/80 border-none focus:ring-2 focus:ring-gold-warm transition-all"
              value={formData.passengerName}
              onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">No. WhatsApp</label>
            <input 
              required
              type="tel" 
              placeholder="Contoh: 08123456789"
              className="bg-surface-low rounded-2xl px-6 py-4 text-sm text-foreground/80 border-none focus:ring-2 focus:ring-gold-warm transition-all"
              value={formData.passengerPhone}
              onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Email (Opsional)</label>
            <input 
              type="email" 
              placeholder="budi@email.com"
              className="bg-surface-low rounded-2xl px-6 py-4 text-sm text-foreground/80 border-none focus:ring-2 focus:ring-gold-warm transition-all"
              value={formData.passengerEmail}
              onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
            />
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="btn-primary w-full py-4 rounded-2xl font-bold text-sm shadow-md mt-4 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Konfirmasi & Bayar Sekarang"}
          </button>
        </form>
      </div>
    </>
  );
}

