"use client";

// Removing explicit imports of Seat/Booking to prevent build errors if Prisma client is stale on Vercel
// We can use 'any' or define local interfaces if needed.

export default function SeatMap({ seats }: { seats: any[] }) {
  // Sort seats by number to ensure correct layout mapping
  // We assume 11 seats for Hiace Premio (1A to 4B pattern)
  
  return (
    <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
      {seats.map((seat: any) => (
        <div 
          key={seat.id}
          className={`
            relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2
            ${seat.status === 'AVAILABLE' 
              ? 'bg-surface-low border-outline-ghost hover:border-gold-soft cursor-pointer' 
              : seat.status === 'BOOKED'
                ? 'bg-navy-deep border-navy-deep text-white shadow-lg'
                : 'bg-red-50 border-red-100 text-red-500'
            }
          `}
        >
          <span className="text-lg font-display font-bold">{seat.seatNumber}</span>
          {seat.status === 'BOOKED' && (
            <span className="text-[8px] font-bold uppercase truncate px-2 text-gold-warm">
              {seat.booking?.passengerName || 'Terisi'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
