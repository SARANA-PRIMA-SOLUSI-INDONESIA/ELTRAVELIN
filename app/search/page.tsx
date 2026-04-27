import Link from "next/link";
import { getSchedules } from "@/app/actions/booking";

interface SearchProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchResults({ searchParams }: SearchProps) {
  const resolvedParams = await searchParams;
  const from = resolvedParams.from as string || "Pematangsiantar";
  const to = resolvedParams.to as string || "";
  const date = resolvedParams.date as string || new Date().toISOString().split('T')[0];

  const departures = await getSchedules(from, to, date);

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-display font-bold text-navy-deep">{from} → {to || "Pilih Tujuan"}</h1>
        <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">{new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {resolvedParams.passengers || 1} Penumpang</p>
      </div>

      <div className="flex flex-col gap-6">
        {departures.length === 0 ? (
          <div className="tonal-section p-24 rounded-[3rem] text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-navy-deep/5 flex items-center justify-center">
              <i className="ri-calendar-event-line text-3xl text-navy-deep/20"></i>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-display font-bold text-navy-deep">Tidak Ada Jadwal</h3>
              <p className="text-foreground/60 max-w-sm">Maaf, tidak ada jadwal keberangkatan untuk rute dan tanggal yang Anda pilih.</p>
            </div>
            <Link href="/" className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-md">
              Cari Tanggal Lain
            </Link>
          </div>
        ) : (
          departures.map((d) => (
            <Link 
              key={d.id} 
              href={`/seat-selection?scheduleId=${d.id}`} 
              className="group tonal-section p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:bg-surface-medium"
            >
              <div className="flex items-center gap-12 w-full md:w-auto">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-display font-bold text-navy-deep">
                    {d.departureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Berangkat</span>
                </div>
                
                <div className="flex flex-col items-center gap-1 flex-grow">
                  <div className="h-[2px] w-24 bg-gold-soft relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-foreground/40 font-bold">
                      3j 30m
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-2xl font-display font-bold text-navy-deep">
                    {d.arrivalTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Tiba</span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-12 w-full md:w-auto">
                <div className="flex flex-col items-end">
                  <span className="bg-navy-deep/10 text-navy-deep text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-1">
                    {d.vehicleType}
                  </span>
                  <span className="text-xs text-foreground/40 font-medium">{d._count.seats} Kursi Tersisa</span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-xs text-foreground/40 font-bold uppercase tracking-widest leading-none">Mulai Dari</span>
                  <span className="text-2xl font-display font-bold text-navy-deep">Rp {d.price.toLocaleString('id-ID')}</span>
                </div>

                <div className="hidden lg:block">
                  <div className="w-12 h-12 rounded-full border border-navy-deep/10 flex items-center justify-center group-hover:bg-navy-deep group-hover:text-white transition-all">
                    <i className="ri-arrow-right-line"></i>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
