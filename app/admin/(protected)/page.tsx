import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch some stats
  const routeCount = await prisma.route.count();
  const scheduleCount = await prisma.schedule.count();
  const bookingCount = await prisma.booking.count();
  const totalRevenue = await prisma.booking.aggregate({
    _sum: { totalPrice: true },
    where: { status: 'CONFIRMED' }
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Overview</h1>
        <p className="text-foreground/60">Selamat datang di panel kendali El Travel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Rute", value: routeCount, icon: "ri-map-pin-2-line", color: "bg-blue-50 text-blue-600" },
          { label: "Jadwal Aktif", value: scheduleCount, icon: "ri-calendar-event-line", color: "bg-green-50 text-green-600" },
          { label: "Total Pesanan", value: bookingCount, icon: "ri-ticket-2-line", color: "bg-purple-50 text-purple-600" },
          { label: "Pendapatan", value: `Rp ${(totalRevenue._sum.totalPrice || 0).toLocaleString('id-ID')}`, icon: "ri-money-dollar-circle-line", color: "bg-gold-soft text-navy-deep" },
        ].map((stat: any, i: number) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center text-2xl`}>
              <i className={stat.icon}></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{stat.label}</span>
              <span className="text-2xl font-display font-bold text-navy-deep">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm">
          <h3 className="text-xl font-display font-bold text-navy-deep mb-8">Aktivitas Terbaru</h3>
          <div className="flex flex-col gap-6">
            {/* Placeholder for recent bookings */}
            <p className="text-sm text-foreground/40 text-center py-10 italic">Belum ada pesanan terbaru hari ini.</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm">
          <h3 className="text-xl font-display font-bold text-navy-deep mb-8">Status Armada</h3>
          <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-surface-low rounded-2xl">
                <span className="text-sm font-medium">Farizon SV (Supervan)</span>
                <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Ready</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
