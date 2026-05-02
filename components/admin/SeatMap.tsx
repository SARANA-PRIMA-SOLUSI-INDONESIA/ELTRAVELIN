"use client";

export default function SeatMap({ seats, onSeatClick }: { seats: any[], onSeatClick?: (seat: any) => void }) {
  // Layout definition based on Farizon SV (Supervan) 15 Seats
  const rows = [
    { type: 'front', seats: ['2', '1', 'SUPIR'] },
    { type: 'row', seats: ['5', '4', '3'] },
    { type: 'row', seats: ['8', '7', '6'] },
    { type: 'row', seats: ['11', '10', '9'] },
    { type: 'back', seats: ['15', '14', '13', '12'] },
  ];

  const getSeatByNumber = (num: string) => seats.find(s => s.seatNumber === num);

  return (
    <div className="flex flex-col gap-10 items-center w-full">
      {/* Dashboard indicator */}
      <div className="w-full max-w-[320px] bg-navy-deep/5 rounded-xl py-3 px-6 text-center">
        <span className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-[0.2em]">Dashboard</span>
      </div>

      <div className="flex flex-col gap-8 w-full items-center">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={`grid ${row.seats.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-4 md:gap-6 w-full max-w-[320px]`}>
            {row.seats.map((seatNum) => {
              if (seatNum === 'SUPIR') {
                return (
                  <div key="supir" className="w-12 h-14 md:w-14 md:h-16 rounded-xl flex items-center justify-center bg-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                    Supir
                  </div>
                );
              }

              const seat = getSeatByNumber(seatNum);
              if (!seat) return <div key={seatNum} className="w-12 h-14 md:w-14 md:h-16"></div>;

              const isAvailable = seat.status === 'AVAILABLE';
              const isBooked = seat.status === 'BOOKED';

              return (
                <div 
                  key={seat.id} 
                  onClick={() => onSeatClick?.(seat)}
                  className={`
                    relative w-12 h-14 md:w-14 md:h-16 rounded-xl flex flex-col items-center justify-center font-bold transition-all cursor-pointer border-2
                    ${isAvailable 
                      ? 'bg-white text-navy-deep border-outline-ghost hover:border-gold-soft' 
                      : isBooked
                        ? 'bg-navy-deep border-navy-deep text-white shadow-lg'
                        : 'bg-red-50 border-red-100 text-red-500'
                    }
                  `}
                >
                  <span className="text-sm">{seat.seatNumber}</span>
                  {isBooked && (
                    <span className="text-[7px] font-bold uppercase truncate px-1 text-gold-warm absolute bottom-1 w-full text-center">
                      {seat.booking?.contactName?.split(' ')[0] || 'Booked'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
