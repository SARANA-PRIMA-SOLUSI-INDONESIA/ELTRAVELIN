import { prisma } from "@/lib/prisma";
import { BookingStatus, Prisma } from "@prisma/client";
import ExportButton from "@/components/admin/ExportButton";
import AdminBookingFilter from "@/components/admin/AdminBookingFilter";
import Pagination from "@/components/Pagination";

export const dynamic = 'force-dynamic';

interface AdminBookingsProps {
  searchParams: Promise<{ 
    page?: string; 
    q?: string; 
    status?: string;
  }>;
}

export default async function AdminBookings({ searchParams }: AdminBookingsProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");
  const query = resolvedParams.q || "";
  const statusFilter = resolvedParams.status || "ALL";
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.BookingWhereInput = {
    AND: [
      statusFilter !== "ALL" ? { status: statusFilter as BookingStatus } : {},
      query ? {
        OR: [
          { bookingCode: { contains: query } },
          { contactName: { contains: query } },
          { contactPhone: { contains: query } },
          { passengers: { some: { name: { contains: query } } } }
        ]
      } : {}
    ]
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        schedule: {
          include: { route: true }
        },
        seats: true,
        passengers: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.booking.count({ where })
  ]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-50 text-green-600';
      case 'PENDING': return 'bg-orange-50 text-orange-600';
      case 'CANCELLED': return 'bg-red-50 text-red-500';
      default: return 'bg-surface-medium text-foreground/40';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Pemesanan Tiket</h1>
          <p className="text-foreground/60">Kelola dan pantau semua transaksi booking masuk.</p>
        </div>
        <ExportButton />
      </div>

      {/* Filters */}
      <AdminBookingFilter />

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-outline-ghost overflow-hidden">
        <div className="px-8 py-4 bg-surface-low border-b border-outline-ghost flex justify-between items-center">
          <span className="text-xs font-bold text-navy-deep/40 uppercase tracking-widest">
            Menampilkan {bookings.length} dari {total} Pesanan
          </span>
          {query && (
            <span className="text-xs font-medium text-navy-deep/60 italic">
              Hasil pencarian untuk "{query}"
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low border-b border-outline-ghost">
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap pl-8">Tgl Pesan</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap">Kode</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap">Pemesan</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap">Telepon</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap">Penumpang</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap text-center">Kursi</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap text-center">Jam</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap">Rute</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap">Total</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap text-center">Status</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider whitespace-nowrap pr-8 text-center">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-ghost">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-8 py-20 text-center text-sm text-foreground/40 italic">Data tidak ditemukan.</td>
                </tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-surface-low/50 transition-all group">
                    <td className="px-4 py-6 pl-8">
                      <span className="text-xs font-bold text-navy-deep/60">
                        {new Date(b.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      <span className="text-base font-bold text-navy-deep tracking-tight">{b.bookingCode}</span>
                    </td>
                    <td className="px-4 py-6">
                      <span className="text-base font-bold text-navy-deep capitalize block leading-tight">{b.contactName}</span>
                      <span className="text-[10px] font-medium text-foreground/40 italic">{b.contactEmail || '-'}</span>
                    </td>
                    <td className="px-4 py-6">
                      <span className="text-sm font-medium text-foreground/60">{b.contactPhone}</span>
                    </td>
                    <td className="px-4 py-6">
                      <span className="text-sm font-medium text-navy-deep">
                        {b.passengers?.map((p: any) => p.name).join(', ') || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-base font-bold text-navy-deep bg-surface-medium px-3 py-1.5 rounded-xl border border-outline-ghost">
                        {b.seats?.length > 0 ? b.seats.map((s: any) => s.seatNumber).sort((a: any, b: any) => a - b).join(', ') : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-base font-bold text-navy-deep leading-none">
                          {new Date(b.schedule.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                        </span>
                        <span className="text-[10px] text-foreground/40 font-bold uppercase mt-1">
                          {new Date(b.schedule.departureTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-navy-deep leading-tight">{b.schedule.route.origin}</span>
                        <i className="ri-arrow-down-line text-[10px] text-gold-warm my-0.5"></i>
                        <span className="text-xs font-bold text-navy-deep leading-tight">{b.schedule.route.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                       <span className="text-base font-bold text-navy-deep whitespace-nowrap">Rp {b.totalPrice.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-4 py-6 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${getStatusColor(b.status)} shadow-sm`}>
                         {b.status}
                       </span>
                    </td>
                    <td className="px-4 py-6 pr-8 text-center">
                       <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest bg-surface-medium px-3 py-1.5 rounded-lg border border-outline-ghost">
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

      <div className="pb-10">
        <Pagination total={total} pageSize={pageSize} currentPage={page} />
      </div>
    </div>
  );
}
