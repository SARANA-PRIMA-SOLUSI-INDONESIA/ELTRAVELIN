import Link from "next/link";
import { getSchedulesWithStops } from "@/app/actions/booking";
import BookingWizard from "@/components/BookingWizard";
import ScheduleCard from "@/components/ScheduleCard";
import SearchFilter from "@/components/SearchFilter";
import Pagination from "@/components/Pagination";

interface SearchProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchResults({ searchParams }: SearchProps) {
  const resolvedParams = await searchParams;
  // Support both old format (from/to) and new format (originStop/destStop)
  const originStop = (resolvedParams.originStop as string) || (resolvedParams.from as string) || "";
  const destStop = (resolvedParams.destStop as string) || (resolvedParams.to as string) || "";
  const date = resolvedParams.date as string || new Date().toISOString().split('T')[0];
  const passengers = resolvedParams.passengers as string || "1";
  
  // Filters & Pagination
  const times = (resolvedParams.times as string)?.split(",").filter(Boolean) || [];
  const sort = resolvedParams.sort as string || "time_asc";
  const page = parseInt(resolvedParams.page as string || "1");
  const pageSize = 10;

  const { data: departures, total } = await getSchedulesWithStops(originStop, destStop, date, {
    timeFilter: times,
    sortBy: sort,
    page,
    pageSize
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* Wizard */}
      <BookingWizard step={1} />

      {/* Header */}
      <div className="bg-[#1C1C1E] text-white py-6 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <Link href="/" className="hover:opacity-80">
            <i className="ri-arrow-left-line text-2xl"></i>
          </Link>
          <h1 className="text-xl font-display font-bold">Pilih Jadwal</h1>
        </div>
      </div>

      {/* Route Summary Banner */}
      <div className="bg-gold-warm py-4 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-display font-bold text-navy-deep">{originStop} <i className="ri-arrow-right-line mx-2"></i> {destStop}</span>
            <span className="text-xs text-navy-deep/70">
              {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })} • {passengers} Kursi
            </span>
          </div>
          <Link href="/" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-navy-deep hover:bg-white/40 transition-all">
            <i className="ri-edit-line text-lg"></i>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-24 py-12">
        
        {/* Filters */}
        {total > 0 && <SearchFilter />}

        <div className="flex flex-col gap-6">
          {departures.length === 0 ? (
            <div className="bg-white p-24 rounded-[2rem] shadow-sm text-center flex flex-col items-center gap-6 border border-gray-100">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                <i className="ri-calendar-event-line text-3xl text-gray-200"></i>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-display font-bold text-navy-deep">Tidak Ada Jadwal</h3>
                <p className="text-foreground/60 max-w-sm">Maaf, tidak ada jadwal keberangkatan yang sesuai dengan filter Anda.</p>
              </div>
              <Link href="/" className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-md">
                Ganti Pencarian
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-navy-deep/40 uppercase tracking-widest">
                  Menampilkan {departures.length} dari {total} Jadwal
                </span>
              </div>
              {departures.map((d: any) => (
                <ScheduleCard 
                  key={d.id} 
                  schedule={{
                    ...d,
                    originStopId: d.originStopId,
                    destinationStopId: d.destinationStopId,
                  }} 
                  fromName={originStop} 
                  toName={destStop}
                  segmentPrice={d.segmentPrice}
                />
              ))}
              
              <Pagination 
                total={total} 
                pageSize={pageSize} 
                currentPage={page} 
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
