import { getScheduleById } from "@/app/actions/booking";
import CheckoutForm from "@/components/CheckoutForm";
import { notFound } from "next/navigation";

interface CheckoutProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Checkout({ searchParams }: CheckoutProps) {
  const resolvedParams = await searchParams;
  const scheduleId = resolvedParams.scheduleId as string;
  const seat = resolvedParams.seat as string;

  if (!scheduleId || !seat) return notFound();

  const schedule = await getScheduleById(scheduleId);
  if (!schedule) return notFound();

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Data Penumpang</h1>
        <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest leading-none">
          {schedule.route.origin} → {schedule.route.destination} • Kursi {seat}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        <div className="flex-grow">
          <CheckoutForm scheduleId={scheduleId} seatNumber={seat} />
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-8 bg-white p-10 rounded-[2.5rem] shadow-ambient h-fit border border-outline-ghost">
          <h2 className="text-xl font-display font-bold text-navy-deep">Ringkasan Perjalanan</h2>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/40 font-medium">Jadwal</span>
              <span className="text-navy-deep font-bold italic">
                {schedule.departureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/40 font-medium">Armada</span>
              <span className="text-navy-deep font-bold">{schedule.vehicleType}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-6 border-t border-navy-deep/5">
              <span className="text-foreground/40 font-medium">Total Harga</span>
              <span className="text-2xl font-display font-bold text-navy-deep">
                Rp {schedule.price.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
