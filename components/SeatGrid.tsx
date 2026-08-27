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
  originStopId?: string;
  destinationStopId?: string;
  originStopName?: string;
  destinationStopName?: string;
  segmentPrice?: number;
}

export default function SeatGrid({ initialSeats, scheduleId, price, originStopId, destinationStopId, originStopName, destinationStopName, segmentPrice }: SeatGridProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    
    setSelectedSeats(prev => 
      prev.includes(seat.seatNumber) 
        ? prev.filter(s => s !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    );
  };

  // Layout definition based on sketch (4 column grid to show aisle)
  const rows = [
    ['2', '1', null, 'SUPIR'],
    [null, '5', '4', '3'],
    [null, '8', '7', '6'],
    [null, '11', '10', '9'],
    ['15', '14', '13', '12'],
  ];

  const getSeatByNumber = (num: string) => initialSeats.find(s => s.seatNumber === num);

  return (
    <div className="flex flex-col lg:flex-row gap-16">
      {/* Seat Layout - Sketch-based Layout */}
      <div className="flex-grow flex flex-col gap-10 tonal-section p-6 md:p-12 rounded-3xl md:rounded-[3rem] items-center">
        <div className="w-full max-w-[320px] bg-navy-deep/5 rounded-xl py-3 px-6 text-center mb-4">
          <span className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-[0.2em]">Dashboard</span>
        </div>
        
        <div className="flex flex-col gap-8 w-full items-center">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-4 gap-4 md:gap-6 w-full max-w-[320px]">
              {row.map((seatNum, colIdx) => {
                if (seatNum === null) {
                  return <div key={`empty-${rowIdx}-${colIdx}`} className="w-12 h-14 md:w-14 md:h-16"></div>;
                }

                if (seatNum === 'SUPIR') {
                  return (
                    <div key="supir" className="w-12 h-14 md:w-14 md:h-16 rounded-xl flex items-center justify-center bg-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                      Supir
                    </div>
                  );
                }

                const seat = getSeatByNumber(seatNum);
                if (!seat) return <div key={`not-found-${seatNum}`} className="w-12 h-14 md:w-14 md:h-16 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-300 text-xs">{seatNum}</div>;

                const isSelected = selectedSeats.includes(seat.seatNumber);
                const isAvailable = seat.status === 'AVAILABLE';

                return (
                  <div 
                    key={seat.id} 
                    onClick={() => handleSeatClick(seat)}
                    className={`w-12 h-14 md:w-14 md:h-16 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer relative group
                      ${!isAvailable ? 'bg-surface-high text-foreground/20 cursor-not-allowed' : ''}
                      ${isAvailable && !isSelected ? 'bg-white text-navy-deep shadow-ambient border border-outline-ghost hover:border-gold-warm' : ''}
                      ${isSelected ? 'btn-primary shadow-lg border-2 border-gold-warm scale-105' : ''}
                    `}
                  >
                    {seat.seatNumber}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-warm rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-[10px] text-white"></i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 md:mt-12 text-[10px] font-bold uppercase tracking-widest text-foreground/60">
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
      <div className="w-full lg:w-96 flex flex-col gap-8 bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-ambient h-fit border border-outline-ghost">
        <h2 className="text-xl font-display font-bold text-navy-deep">Detail Pesanan</h2>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-foreground/40 font-medium">Rute Dipilih</span>
            <span className="text-navy-deep font-bold leading-relaxed">
              {originStopName || 'Rute utama'} → {destinationStopName || 'Rute utama'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground/40 font-medium">Layanan</span>
            <span className="text-navy-deep font-bold italic">Executive</span>
          </div>
          <div className="flex justify-between items-start text-sm">
            <span className="text-foreground/40 font-medium">Kursi Dipilih</span>
            <div className="flex flex-wrap justify-end gap-2 max-w-[150px]">
              {selectedSeats.length > 0 ? selectedSeats.sort((a,b) => parseInt(a) - parseInt(b)).map(s => (
                <span key={s} className="px-2 py-0.5 bg-gold-soft text-navy-deep rounded text-[10px] font-bold">
                  {s}
                </span>
              )) : <span className="text-navy-deep font-bold">-</span>}
            </div>
          </div>
          <div className="flex justify-between items-center text-sm pt-6 border-t border-navy-deep/5">
            <span className="text-foreground/40 font-medium">Total Harga</span>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-display font-bold text-navy-deep">
                Rp {(selectedSeats.length * price).toLocaleString('id-ID')}
              </span>
              {selectedSeats.length > 0 && (
                <span className="text-[10px] text-foreground/40 font-bold uppercase">
                  {selectedSeats.length} x Rp {price.toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>
        </div>

        {selectedSeats.length > 0 ? (
          <Link 
            href={`/checkout?scheduleId=${scheduleId}&seats=${selectedSeats.join(',')}${originStopName ? `&originStop=${encodeURIComponent(originStopName)}` : ''}${destinationStopName ? `&destinationStop=${encodeURIComponent(destinationStopName)}` : ''}${originStopId ? `&originStopId=${originStopId}` : ''}${destinationStopId ? `&destinationStopId=${destinationStopId}` : ''}${segmentPrice ? `&segmentPrice=${segmentPrice}` : ''}`} 
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
