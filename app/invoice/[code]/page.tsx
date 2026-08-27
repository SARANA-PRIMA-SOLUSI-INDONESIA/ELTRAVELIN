import { getBookingByCode } from "@/app/actions/booking";
import { getPartnershipLogos } from "@/app/actions/admin-settings";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

interface InvoiceProps {
  params: Promise<{ code: string }>;
}

export default async function InvoicePage({ params }: InvoiceProps) {
  const resolvedParams = await params;
  const code = resolvedParams.code;

  if (!code) return notFound();

  const booking = await getBookingByCode(code);
  if (!booking || booking.status !== 'CONFIRMED') return notFound();
  const partnershipLogoUrls = await getPartnershipLogos();

  const dateTimeOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  } as const;

  const bookingDate = booking.createdAt.toLocaleString('id-ID', dateTimeOptions);

  // Legacy confirmed bookings may not have settlementTime; createdAt is the
  // only reliable payment timestamp available for those records.
  const settlementDate = (booking.settlementTime || booking.createdAt).toLocaleString('id-ID', dateTimeOptions);
  const invoiceDate = (booking.settlementTime || booking.createdAt).toLocaleString('id-ID', dateTimeOptions);

  return (
    <div className="invoice-page min-h-screen bg-gray-100 py-8 px-4">
      <div className="invoice-sheet max-w-3xl mx-auto bg-white">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link 
            href={`/confirmation?code=${code}`}
            className="flex items-center gap-2 text-navy-deep hover:text-gold-warm transition-colors"
          >
            <i className="ri-arrow-left-line"></i>
            <span className="font-medium">Kembali ke E-Ticket</span>
          </Link>
          <PrintButton />
        </div>

        {/* Invoice Card */}
        <div className="rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Invoice Header */}
          <div className="bg-navy-deep p-6 text-white print:p-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-display font-bold">INVOICE</h1>
                <p className="text-white/60 text-sm mt-1">#{booking.bookingCode}</p>
              </div>
              <div className="text-right">
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
                  LUNAS
                </div>
                <p className="text-white/60 text-xs mt-2">{invoiceDate}</p>
              </div>
            </div>
          </div>

          {/* Company & Customer Info */}
          <div className="p-6 print:p-5 grid grid-cols-2 gap-6 border-b border-gray-100">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Diterbitkan Oleh</h3>
              <p className="font-bold text-navy-deep">ELTRAVEL INDONESIA MAJU</p>
              <p className="text-sm text-gray-500 mt-1">PT Eltravel Indonesia Maju</p>
              <p className="text-sm text-gray-500">Jl. A. Yani No.835A, Padasuka, Kec. Cibeunying Kidul, Kota Bandung, Jawa Barat 40125</p>
              <p className="text-sm text-gray-500">Telepon: 0811-221-286</p>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ditagihkan Kepada</h3>
              <p className="font-bold text-navy-deep">{booking.contactName}</p>
              <p className="text-sm text-gray-500 mt-1">{booking.contactEmail}</p>
              <p className="text-sm text-gray-500">{booking.contactPhone}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6 print:p-5 border-b border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Detail Perjalanan</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Rute</p>
                  <p className="font-bold text-navy-deep">{booking.schedule.route.origin} → {booking.schedule.route.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tanggal Keberangkatan</p>
                  <p className="font-medium text-gray-700">
                    {booking.schedule.departureTime.toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      timeZone: 'Asia/Jakarta'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Jam Keberangkatan</p>
                  <p className="font-medium text-gray-700">
                    {booking.schedule.departureTime.toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZone: 'Asia/Jakarta'
                    })} WIB
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Nomor Kursi</p>
                  <p className="font-medium text-gray-700">{booking.seats.map(s => s.seatNumber).join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Jumlah Penumpang</p>
                  <p className="font-medium text-gray-700">{booking.passengers.length} Orang</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Metode Pembayaran</p>
                  <p className="font-medium text-gray-700">
                    {booking.paymentMethod === 'MOOTA' ? 'Transfer Bank' : booking.paymentMethod === 'POOL' ? 'Bayar di Pool' : booking.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Passenger List */}
          <div className="p-6 print:p-5 border-b border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Daftar Penumpang</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="pb-2">No</th>
                  <th className="pb-2">Nama</th>
                  <th className="pb-2">Kursi</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengers.map((passenger, index) => (
                  <tr key={passenger.id} className="text-sm">
                    <td className="py-2 text-gray-500">{index + 1}</td>
                    <td className="py-2 font-medium text-navy-deep">{passenger.name}</td>
                    <td className="py-2 text-gray-500">{booking.seats[index]?.seatNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="p-6 print:p-5 bg-gray-50">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Ringkasan Pembayaran</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Harga Tiket ({booking.passengers.length} x {booking.schedule.price.toLocaleString('id-ID')})</span>
                <span className="font-medium">Rp {(booking.passengers.length * booking.schedule.price).toLocaleString('id-ID')}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon</span>
                  <span className="font-medium">- Rp {booking.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kode Unik</span>
                <span className="font-medium">Rp {(booking.totalPrice % 1000).toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-navy-deep">TOTAL DIBAYAR</span>
                  <span className="font-bold text-navy-deep text-xl">Rp {booking.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Tanggal Pemesanan</p>
                  <p className="font-medium text-gray-700">{bookingDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tanggal Pembayaran</p>
                  <p className="font-medium text-gray-700">{settlementDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 print:p-4 bg-navy-deep/5 text-center">
            {partnershipLogoUrls.length > 0 && <div className="mb-4 border-b border-gray-200 pb-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Partnership</p><div className="flex flex-wrap items-center justify-center gap-5">{partnershipLogoUrls.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Logo partnership ${index + 1}`} className="h-10 w-auto max-w-28 object-contain" />)}</div></div>}
            <p className="text-xs text-gray-500">
              Terima kasih telah menggunakan layanan EL Travel. Invoice ini sah sebagai bukti pembayaran.
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              Diterbitkan oleh sistem EL Travel pada {invoiceDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: InvoiceProps) {
  const resolvedParams = await params;
  return {
    title: `Invoice #${resolvedParams.code} | EL Travel`,
  };
}
