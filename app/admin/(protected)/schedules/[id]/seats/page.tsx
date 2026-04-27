import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SeatMap from "@/components/admin/SeatMap";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminScheduleSeats({ params }: PageProps) {
  const resolvedParams = await params;
  const schedule = await prisma.schedule.findUnique({
    where: { id: resolvedParams.id },
    include: {
      route: true,
      seats: {
        include: {
          booking: true
        },
        orderBy: {
          seatNumber: 'asc'
        }
      }
    }
  });

  if (!schedule) notFound();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">
           <span>Jadwal</span>
           <i className="ri-arrow-right-s-line"></i>
           <span className="text-navy-deep">{schedule.route.origin} → {schedule.route.destination}</span>
           <i className="ri-arrow-right-s-line"></i>
           <span className="text-navy-deep">{schedule.departureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <h1 className="text-4xl font-display font-bold text-navy-deep">Okupansi Kursi</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-12 rounded-[3rem] shadow-sm flex flex-col items-center">
           <div className="mb-12 flex flex-col items-center gap-2 text-center">
              <div className="w-32 h-2 bg-navy-deep/10 rounded-full"></div>
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Front Area / Driver</span>
           </div>
           
           <SeatMap seats={schedule.seats as any} />
        </div>

        <div className="flex flex-col gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm">
              <h3 className="text-lg font-display font-bold text-navy-deep mb-6">Legend</h3>
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-surface-low border border-outline-ghost"></div>
                    <span className="text-sm font-medium text-foreground/60">Tersedia</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-navy-deep text-gold-warm flex items-center justify-center">
                       <i className="ri-check-line text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-foreground/60">Terisi / Terpesan</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                       <i className="ri-close-line text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-foreground/60">Diblokir (Admin)</span>
                 </div>
              </div>
           </div>

           <div className="bg-navy-deep p-8 rounded-[2.5rem] shadow-sm text-white flex flex-col gap-4">
              <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Ringkasan</span>
              <div className="flex justify-between items-end">
                 <div className="flex flex-col">
                    <span className="text-4xl font-display font-bold">
                      {schedule.seats.filter((s: any) => s.status === 'BOOKED').length}
                    </span>
                    <span className="text-xs opacity-60">Kursi Terisi</span>
                 </div>
                 <div className="text-right flex flex-col">
                    <span className="text-2xl font-display font-bold text-gold-warm">
                      {Math.round((schedule.seats.filter((s: any) => s.status === 'BOOKED').length / schedule.capacity) * 100)}%
                    </span>
                    <span className="text-xs opacity-60">Okupansi</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
