"use client";

import { useState } from "react";
import SeatMap from "./SeatMap";
import { adminCreateBooking } from "@/app/actions/booking";
import { useRouter } from "next/navigation";

export default function SeatOccupancyManager({ schedule, seats }: { schedule: any, seats: any[] }) {
  const router = useRouter();
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const handleSeatClick = (seat: any) => {
    if (seat.status === 'AVAILABLE') {
      setSelectedSeat(seat);
      setIsBooking(true);
    } else if (seat.status === 'BOOKED') {
      // Show details
      alert(`Kursi ${seat.seatNumber} dipesan oleh: ${seat.booking?.contactName || 'N/A'}\nPhone: ${seat.booking?.contactPhone || 'N/A'}`);
    }
  };

  const handleConfirmBooking = async () => {
    if (!name || !phone) {
      alert("Nama dan HP wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await adminCreateBooking({
        scheduleId: schedule.id,
        contactName: name,
        contactPhone: phone,
        passengerNames: [name],
        seatNumbers: [selectedSeat.seatNumber],
        paymentMethod: paymentMethod
      });
      
      alert("Booking berhasil!");
      setIsBooking(false);
      setSelectedSeat(null);
      setName("");
      setPhone("");
      router.refresh();
    } catch (error) {
      alert("Gagal booking: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeatMap seats={seats} onSeatClick={handleSeatClick} />

      {/* Simple Booking Modal */}
      {isBooking && (
        <div className="fixed inset-0 bg-navy-deep/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-display font-bold text-navy-deep">Pesan di Pool</h3>
              <p className="text-sm text-foreground/60">Input data penumpang untuk Kursi <span className="font-bold text-gold-warm">{selectedSeat?.seatNumber}</span></p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Nama Penumpang</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">No. WhatsApp</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812..."
                  className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Metode Pembayaran</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="TRANSFER">Transfer Pool</option>
                  <option value="DEBIT">Debit/QRIS Pool</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsBooking(false)}
                className="flex-1 py-4 rounded-xl font-bold text-sm text-foreground/40 hover:bg-surface-low transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
              >
                {loading ? "Proses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
