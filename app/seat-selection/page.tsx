import { getScheduleById } from "@/app/actions/booking";
import SeatGrid from "@/components/SeatGrid";
import { notFound, redirect } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";

interface SeatSelectionProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SeatSelection({ searchParams }: SeatSelectionProps) {
  const resolvedParams = await searchParams;
  const scheduleId = resolvedParams.scheduleId as string;

  if (!scheduleId) return notFound();

  const schedule = await getScheduleById(scheduleId);
  if (!schedule) return notFound();

  // Redirect if schedule has already departed
  if (schedule.departureTime < new Date()) {
    return redirect("/?error=expired");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      <BookingWizard step={1} />

      {/* Header */}
      <div className="bg-[#1C1C1E] text-white py-6 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <Link href={`/search?from=${schedule.route.origin}&to=${schedule.route.destination}`} className="hover:opacity-80">
            <i className="ri-arrow-left-line text-2xl"></i>
          </Link>
          <h1 className="text-xl font-display font-bold">Pilih Kursi</h1>
        </div>
      </div>

      {/* Route Summary Banner */}
      <div className="bg-gold-warm py-4 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-display font-bold text-navy-deep">{schedule.route.origin} - {schedule.route.destination}</span>
            <span className="text-xs text-navy-deep/70">
              {new Date(schedule.departureTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })} • {schedule.vehicleType}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-24 py-12">
        <SeatGrid 
          initialSeats={schedule.seats} 
          scheduleId={schedule.id}
          price={schedule.price}
        />
      </div>
    </div>
  );
}
