import Link from "next/link";
import { getSchedules } from "@/app/actions/booking";
import BookingWizard from "@/components/BookingWizard";

interface SearchProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchResults({ searchParams }: SearchProps) {
  const resolvedParams = await searchParams;
  const from = resolvedParams.from as string || "Pematangsiantar";
  const to = resolvedParams.to as string || "";
  const date = resolvedParams.date as string || new Date().toISOString().split('T')[0];
  const passengers = resolvedParams.passengers as string || "1";

  const departures = await getSchedules(from, to, date);

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
          <h1 className="text-xl font-display font-bold">Booking</h1>
        </div>
      </div>

      {/* Route Summary Banner */}
      <div className="bg-gold-warm py-4 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-display font-bold text-navy-deep">{from} - {to}</span>
            <span className="text-xs text-navy-deep/70">
              {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {passengers} Kursi
            </span>
          </div>
          <Link href="/" className="text-navy-deep">
            <i className="ri-edit-line text-xl"></i>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-24 py-12">
        <div className="flex flex-col gap-6">
          {departures.length === 0 ? (
            <div className="bg-white p-24 rounded-[2rem] shadow-sm text-center flex flex-col items-center gap-6 border border-gray-100">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                <i className="ri-calendar-event-line text-3xl text-gray-200"></i>
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
            departures.map((d: any) => (
              <div 
                key={d.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row items-stretch transition-all hover:shadow-md"
              >
                {/* Left: Info */}
                <div className="p-6 md:p-8 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start md:min-w-[200px] border-b md:border-b-0 md:border-r border-gray-50">
                  <h3 className="text-base md:text-lg font-display font-bold text-navy-deep leading-tight mb-0 md:mb-1">{d.vehicleType}</h3>
                  <span className="text-[10px] md:text-xs font-bold text-foreground/40">{d._count.seats} Bangku available</span>
                </div>

                {/* Middle: Timeline */}
                <div className="flex-grow p-6 md:p-8 flex flex-col justify-between gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-foreground/40 uppercase mb-1">{from.split(' ')[0]}</span>
                      <span className="text-lg md:text-xl font-display font-bold text-navy-deep">
                        {d.departureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex-grow flex flex-col items-center gap-1 px-2 md:px-4">
                      <div className="w-full h-[1px] bg-gray-200 relative flex justify-center">
                        <div className="absolute -top-[3px] left-0 w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        <div className="absolute -top-[3px] right-0 w-1.5 h-1.5 rounded-full bg-gold-warm"></div>
                        <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300"></div>
                        <span className="absolute -bottom-5 text-[9px] md:text-[10px] font-bold text-gray-300 hidden xs:block">3j 30m</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-foreground/40 uppercase mb-1">{to.split(' ')[0]}</span>
                      <span className="text-lg md:text-xl font-display font-bold text-navy-deep">
                        {d.arrivalTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 md:gap-4">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded">
                      <i className="ri-checkbox-circle-fill text-[8px] md:text-[10px] text-green-600"></i>
                      <span className="text-[8px] md:text-[10px] font-bold text-green-700 uppercase tracking-tight">Bisa Refund</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded">
                      <i className="ri-history-line text-[8px] md:text-[10px] text-blue-600"></i>
                      <span className="text-[8px] md:text-[10px] font-bold text-blue-700 uppercase tracking-tight">Bisa Reschedule</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Select */}
                <div className="p-6 md:p-8 bg-[#FDFDFD] flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-4 md:min-w-[220px] border-t md:border-t-0 md:border-l border-gray-50">
                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-lg md:text-xl font-display font-bold text-navy-deep">Rp {d.price.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">/seat</span>
                  </div>
                  <Link 
                    href={`/seat-selection?scheduleId=${d.id}`}
                    className="bg-[#EFEFEF] hover:bg-gold-warm hover:text-white text-navy-deep font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-xl text-center transition-all shadow-sm text-sm md:text-base w-auto md:w-full"
                  >
                    Select
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
