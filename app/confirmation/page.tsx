import Link from "next/link";
import { getBookingByCode } from "@/app/actions/booking";
import { notFound } from "next/navigation";

interface ConfirmationProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Confirmation({ searchParams }: ConfirmationProps) {
  const resolvedParams = await searchParams;
  const code = resolvedParams.code as string;

  if (!code) return notFound();

  const booking = await getBookingByCode(code);
  if (!booking) return notFound();

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-gold-soft flex items-center justify-center mb-12 shadow-ambient animate-fade-in text-navy-deep">
        <i className="ri-check-line text-4xl"></i>
      </div>
      
      <div className="flex flex-col gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-navy-deep">Pemesanan Berhasil</h1>
        <p className="text-lg text-foreground/60 font-body">
          Terima kasih telah memilih <span className="text-navy-deep font-bold italic">EL Travel</span> untuk perjalanan Anda.
        </p>
      </div>

      <div className="w-full bg-white p-12 rounded-[3.5rem] shadow-ambient border border-outline-ghost mb-12 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none">ID Pesanan</span>
            <span className="text-xl font-display font-bold text-navy-deep">#{booking.bookingCode}</span>
          </div>

          <div className="grid grid-cols-2 gap-8 text-left py-8 border-y border-navy-deep/5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none">Keberangkatan</span>
              <span className="text-sm font-bold text-navy-deep">
                {booking.schedule.route.origin} → {booking.schedule.route.destination}
              </span>
              <span className="text-xs text-foreground/60">
                {booking.schedule.departureTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • 
                {booking.schedule.departureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none">Penumpang</span>
              <span className="text-sm font-bold text-navy-deep">{booking.passengerName}</span>
              <span className="text-xs text-foreground/60">Kursi {booking.seats[0]?.seatNumber}</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none">Status Pembayaran: {booking.status}</span>
              <div className="w-48 h-48 bg-surface-low rounded-3xl flex items-center justify-center border border-outline-ghost">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-32 h-32 bg-navy-deep/5 rounded-xl border border-dashed border-navy-deep/20 flex items-center justify-center font-bold text-navy-deep/20 text-[10px] uppercase tracking-widest">
                    QRIS CODE
                  </div>
                  <span className="text-[10px] font-bold text-navy-deep uppercase tracking-widest italic">EL Travel QR Pay</span>
                </div>
              </div>
            </div>
            
            <button className="btn-primary w-full py-4 rounded-xl font-bold text-sm shadow-md">
              Unduh E-Tiket
            </button>
          </div>
        </div>
      </div>

      <Link href="/" className="text-sm font-bold text-navy-deep/40 hover:text-navy-deep transition-colors uppercase tracking-widest animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
        Kembali ke Beranda
      </Link>
    </div>
  );
}
