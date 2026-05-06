import Link from "next/link";
import { getSchedules } from "@/app/actions/booking";
import BookingWizard from "@/components/BookingWizard";
import ScheduleCard from "@/components/ScheduleCard";

interface SearchProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchResults({ searchParams }: SearchProps) {
  const resolvedParams = await searchParams;
  const from = resolvedParams.from as string || "Bandung (Ahmad Yani/Cicadas)";
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
              {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })} • {passengers} Kursi
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
              <ScheduleCard 
                key={d.id} 
                schedule={d} 
                fromName={from} 
                toName={to} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
