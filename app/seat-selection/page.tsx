import { getScheduleById } from "@/app/actions/booking";
import SeatGrid from "@/components/SeatGrid";
import { notFound } from "next/navigation";

interface SeatSelectionProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SeatSelection({ searchParams }: SeatSelectionProps) {
  const resolvedParams = await searchParams;
  const scheduleId = resolvedParams.scheduleId as string;

  if (!scheduleId) return notFound();

  const schedule = await getScheduleById(scheduleId);
  if (!schedule) return notFound();

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Pilih Kursi</h1>
        <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest leading-none">
          {schedule.route.origin} → {schedule.route.destination} • {schedule.vehicleType}
        </p>
      </div>

      <SeatGrid 
        initialSeats={schedule.seats} 
        scheduleId={schedule.id}
        price={schedule.price}
      />
    </div>
  );
}
