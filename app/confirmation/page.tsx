import { getBookingByCode } from "@/app/actions/booking";
import { notFound } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";

interface ConfirmationProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Confirmation({ searchParams }: ConfirmationProps) {
  const resolvedParams = await searchParams;
  const code = resolvedParams.code as string;

  if (!code) return notFound();

  const booking = await getBookingByCode(code);
  if (!booking) return notFound();

  const isConfirmed = booking.status === 'CONFIRMED';
  const isMoota = booking.paymentMethod === 'MOOTA';
  const isPool = booking.paymentMethod === 'POOL';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      <BookingWizard step={4} />
      
      <div className="max-w-3xl mx-auto w-full px-6 py-12 text-center flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
          {isConfirmed ? (
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
              <i className="ri-check-line text-4xl text-white"></i>
            </div>
          ) : isMoota ? (
            <div className="w-20 h-20 bg-gold-warm rounded-full flex items-center justify-center shadow-lg shadow-gold-warm/20 animate-pulse">
              <i className="ri-time-line text-4xl text-white"></i>
            </div>
          ) : (
            <div className="w-20 h-20 bg-navy-deep rounded-full flex items-center justify-center shadow-lg shadow-navy-deep/20">
              <i className="ri-map-pin-user-line text-4xl text-white"></i>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-display font-black text-navy-deep tracking-tight">
              {isConfirmed ? "Pemesanan Berhasil!" : isMoota ? "Menunggu Pembayaran" : "Menunggu Pembayaran di Pool"}
            </h1>
            <p className="text-gray-400 font-medium text-sm max-w-md mx-auto leading-relaxed">
              {isConfirmed 
                ? "Tiket Anda telah terbit. Silakan tunjukkan QR Code di bawah saat boarding." 
                : isMoota 
                  ? "Segera lakukan transfer agar kursi Anda tidak dibatalkan otomatis oleh sistem."
                  : "Segera lakukan pembayaran langsung di loket pool maksimal 60 menit dari pemesanan agar kursi Anda tidak dibatalkan otomatis oleh sistem."}
            </p>
          </div>
        </div>

        {/* E-Ticket Card */}
        <div className="w-full bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-ambient overflow-hidden border border-gray-100 relative">
          {/* Header Ticket */}
          <div className="bg-navy-deep/5 p-8 border-b border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Code</span>
            <span className="text-lg font-display font-bold text-navy-deep">#{booking.bookingCode}</span>
          </div>

          <div className="p-8 flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-8 text-left">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keberangkatan</span>
                <span className="text-sm font-bold text-navy-deep">
                  {booking.schedule.route.origin} → {booking.schedule.route.destination}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {booking.schedule.departureTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })} • 
                  {booking.schedule.departureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                </span>
              </div>
               <div className="flex flex-col gap-1 text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pemesan</span>
                <span className="text-sm font-bold text-navy-deep">{booking.contactName}</span>
                <span className="text-xs text-gray-400 font-medium">Kursi {booking.seats.map(s => s.seatNumber).join(', ')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-left p-4 bg-gray-50 rounded-xl">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daftar Penumpang</span>
               <div className="flex flex-col gap-2">
                 {booking.passengers.map((p, i) => (
                   <div key={p.id} className="flex justify-between items-center text-xs">
                     <span className="font-bold text-navy-deep">{i + 1}. {p.name}</span>
                     <span className="text-gray-400">Kursi {booking.seats[i]?.seatNumber || '-'}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Conditionally show Payment Instructions if Pending and Moota */}
            {!isConfirmed && isMoota && (
              <div className="flex flex-col gap-6 p-8 bg-gold-warm/5 rounded-3xl border border-gold-warm/20">
                <div className="flex flex-col gap-2 text-center">
                  <span className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-[0.2em]">Total Pembayaran</span>
                  <span className="text-3xl font-display font-black text-navy-deep tracking-tight">
                    Rp {booking.totalPrice.toLocaleString('id-ID')}
                  </span>
                  <p className="text-[10px] text-gold-warm font-bold uppercase tracking-widest bg-white/50 py-2 rounded-lg">
                    ⚠️ Transfer tepat hingga 3 digit terakhir
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-navy-deep/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-navy-deep/5 rounded-xl flex items-center justify-center font-black text-navy-deep text-xs italic">BRI</div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. Rekening</span>
                        <span className="text-base font-black text-navy-deep tracking-wider">0389 0100 2533 562</span>
                        <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest mt-1">a.n ELTRAVEL INDONESIA MAJU</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-center text-[10px] text-navy-deep/50 leading-relaxed">
                  Pembayaran Anda akan diverifikasi otomatis oleh sistem dalam 5-10 menit setelah transfer berhasil dilakukan.
                </p>
              </div>
            )}

            {/* Conditionally show Payment Instructions if Pending and Pool */}
            {!isConfirmed && isPool && (
              <div className="flex flex-col gap-6 p-8 bg-red-500/5 rounded-3xl border border-red-500/20">
                <div className="flex flex-col gap-2 text-center">
                  <span className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-[0.2em]">Total Pembayaran di Loket</span>
                  <span className="text-3xl font-display font-black text-navy-deep tracking-tight">
                    Rp {booking.totalPrice.toLocaleString('id-ID')}
                  </span>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-white/50 py-2 rounded-lg">
                    ⚠️ Batas Waktu Pembayaran: 60 Menit
                  </p>
                </div>

                <div className="flex flex-col gap-4 text-left p-6 bg-white rounded-2xl border border-navy-deep/5 text-sm">
                  <div className="flex gap-3 items-start">
                    <i className="ri-information-line text-lg text-red-500 mt-0.5"></i>
                    <div className="flex flex-col gap-2">
                      <p className="font-bold text-navy-deep">Petunjuk Pembayaran di Loket:</p>
                      <ul className="list-decimal pl-4 flex flex-col gap-1 text-gray-500 text-xs leading-relaxed">
                        <li>Kunjungi loket resmi Pool keberangkatan Anda.</li>
                        <li>Sebutkan <strong>Kode Booking #{booking.bookingCode}</strong> kepada petugas loket.</li>
                        <li>Lakukan pembayaran sebesar nominal di atas secara tunai atau debit.</li>
                        <li>Setelah lunas, petugas akan memverifikasi tiket Anda dan status pemesanan akan otomatis berubah menjadi LUNAS / BERHASIL.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-center text-[10px] text-navy-deep/50 leading-relaxed">
                  Harap selesaikan pembayaran sebelum batas waktu berakhir agar pemesanan kursi Anda tidak dibatalkan otomatis oleh sistem.
                </p>
              </div>
            )}

            {/* Conditionally show QR Code if Confirmed OR Pay at Pool */}
            {(isConfirmed || isPool) && (
              <div className="flex flex-col items-center gap-6 py-8 border-t border-dashed border-gray-100">
                <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                  <div className="flex flex-col items-center gap-2">
                    <i className="ri-qr-code-line text-6xl text-navy-deep/20"></i>
                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.2em]">ELTRAVELIN</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {isConfirmed ? "Gunakan QR Code untuk Boarding" : "Gunakan Kode Booking Saat Pembayaran"}
                </p>
              </div>
            )}
          </div>
        </div>

        {isConfirmed && (
          <Link
            href={`/invoice/${booking.bookingCode}`}
            className="flex items-center gap-2 bg-navy-deep text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-deep/90 transition-all shadow-lg shadow-navy-deep/20"
          >
            <i className="ri-file-text-line"></i>
            <span>Lihat Invoice / Bukti Pembayaran</span>
          </Link>
        )}

        <Link 
          href="/" 
          className="text-gold-warm font-bold text-sm uppercase tracking-widest hover:opacity-80 transition-all"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
