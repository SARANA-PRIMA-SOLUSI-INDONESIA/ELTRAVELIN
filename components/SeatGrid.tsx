"use client";

import { useState } from "react";
import Link from "next/link";

interface Seat {
  id: string;
  seatNumber: string;
  status: string;
}

interface SeatGridProps {
  initialSeats: Seat[];
  scheduleId: string;
  price: number;
}

export default function SeatGrid({ initialSeats, scheduleId, price }: SeatGridProps) {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelectedSeat(seat.seatNumber === selectedSeat ? null : seat.seatNumber);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-16">
      {/* Seat Layout - Asymmetrical Layout */}
      <div className="flex-grow flex flex-col gap-8 tonal-section p-12 rounded-[3rem] items-center">
        <div className="w-full flex justify-between items-center px-8 border-b border-navy-deep/5 pb-8 mb-4">
          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Dashboard</span>
          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Supir</span>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {initialSeats.map((s: any) => (
            <div 
              key={s.id} 
              onClick={() => handleSeatClick(s)}
              className={`w-14 h-16 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer
                ${s.status !== 'AVAILABLE' ? 'bg-surface-high text-foreground/20 cursor-not-allowed' : ''}
                ${s.status === 'AVAILABLE' && selectedSeat !== s.seatNumber ? 'bg-white text-navy-deep shadow-ambient border border-outline-ghost hover:border-gold-warm' : ''}
                ${selectedSeat === s.seatNumber ? 'btn-primary shadow-lg border-2 border-gold-warm' : ''}
              `}
            >
              {s.seatNumber}
            </div>
          ))}
        </div>
        
        <div className="flex gap-8 mt-12 text-[10px] font-bold uppercase tracking-widest text-foreground/60">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-white border border-outline-ghost"></div> Tersedia
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-surface-high"></div> Terisi
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-navy-deep"></div> Dipilih
          </div>
        </div>
      </div>

      {/* Booking Summary - Ambient Shadow */}
      <div className="w-full lg:w-96 flex flex-col gap-8 bg-white p-10 rounded-[2.5rem] shadow-ambient h-fit border border-outline-ghost">
        <h2 className="text-xl font-display font-bold text-navy-deep">Detail Pesanan</h2>
        
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground/40 font-medium">Layanan</span>
            <span className="text-navy-deep font-bold italic">Executive</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground/40 font-medium">Kursi Dipilih</span>
            <span className="text-navy-deep font-bold">{selectedSeat || "-"}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-6 border-t border-navy-deep/5">
            <span className="text-foreground/40 font-medium">Total Harga</span>
            <span className="text-2xl font-display font-bold text-navy-deep">
              Rp {selectedSeat ? price.toLocaleString('id-ID') : "0"}
            </span>
          </div>
        </div>

        {selectedSeat ? (
          <Link 
            href={`/checkout?scheduleId=${scheduleId}&seat=${selectedSeat}`} 
            className="btn-primary w-full py-4 rounded-xl text-center font-bold text-sm shadow-md mt-4"
          >
            Lanjutkan ke Pemesanan
          </Link>
        ) : (
          <button 
            disabled
            className="bg-surface-high text-foreground/20 w-full py-4 rounded-xl text-center font-bold text-sm mt-4 cursor-not-allowed"
          >
            Pilih Kursi Dahulu
          </button>
        )}
        
        <div className="text-[10px] text-center text-foreground/40 uppercase font-bold tracking-widest">
          Semua kursi dilengkapi Individual Port <br /> & Reading Light
        </div>
      </div>
    </div>
  );
}
