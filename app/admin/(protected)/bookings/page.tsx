import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export default async function AdminBookings() {
  const bookings = await prisma.booking.findMany({
    include: {
      schedule: {
        include: { route: true }
      },
      seats: true,
      passengers: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Show latest 50
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-50 text-green-600';
      case 'PENDING': return 'bg-orange-50 text-orange-600';
      case 'CANCELLED': return 'bg-red-50 text-red-500';
      default: return 'bg-surface-medium text-foreground/40';
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Pemesanan Tiket</h1>
        <p className="text-foreground/60">Daftar semua transaksi booking, baik online maupun offline (Pool).</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-outline-ghost overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low border-b border-outline-ghost">
                <th className="px-8 py-6 text-[10px] font-bold text-navy-deep uppercase tracking-widest">Kode Booking</th>
                <th className="px-8 py-6 text-[10px] font-bold text-navy-deep uppercase tracking-widest">Penumpang</th>
                <th className="px-8 py-6 text-[10px] font-bold text-navy-deep uppercase tracking-widest">Jadwal</th>
                <th className="px-8 py-6 text-[10px] font-bold text-navy-deep uppercase tracking-widest">Total Bayar</th>
                <th className="px-8 py-6 text-[10px] font-bold text-navy-deep uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-navy-deep uppercase tracking-widest">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-ghost">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-sm text-foreground/40 italic">Belum ada data pemesanan.</td>
                </tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-surface-low/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-navy-deep">{b.bookingCode}</span>
                        <span className="text-[10px] text-foreground/40 font-bold uppercase">{new Date(b.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-navy-deep">{b.contactName}</span>
                        <span className="text-[10px] text-foreground/40 font-bold uppercase">{b.contactPhone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-navy-deep">{b.schedule.route.origin} → {b.schedule.route.destination}</span>
                        <span className="text-[10px] text-foreground/40 font-bold uppercase">
                          {new Date(b.schedule.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} 
                          ({b.seats.map((s: any) => s.seatNumber).join(', ')})
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-sm font-bold text-navy-deep">Rp {b.totalPrice.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(b.status)}`}>
                         {b.status}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest bg-surface-medium px-2 py-1 rounded">
                         {b.paymentMethod || 'UNSET'}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
