import { getScheduleById, getCheckoutPromos } from "@/app/actions/booking";
import CheckoutForm from "@/components/CheckoutForm";
import { notFound, redirect } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";

interface CheckoutProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Checkout({ searchParams }: CheckoutProps) {
  const resolvedParams = await searchParams;
  const scheduleId = resolvedParams.scheduleId as string;
  const seatsParam = resolvedParams.seats as string;
  const originStopId = resolvedParams.originStopId as string | undefined;
  const destinationStopId = resolvedParams.destinationStopId as string | undefined;
  const originStopName = resolvedParams.originStop as string | undefined;
  const destinationStopName = resolvedParams.destinationStop as string | undefined;
  const segmentPrice = resolvedParams.segmentPrice ? parseInt(resolvedParams.segmentPrice as string) : undefined;

  if (!scheduleId || !seatsParam) return notFound();

  const seatNumbers = seatsParam.split(',');
  const [schedule, availablePromos] = await Promise.all([
    getScheduleById(scheduleId),
    getCheckoutPromos()
  ]);

  if (!schedule) return notFound();

  // Redirect if schedule has already departed
  if (schedule.departureTime < new Date()) {
    return redirect("/?error=expired");
  }

  const pricePerSeat = segmentPrice || schedule.price;
  const totalPrice = pricePerSeat * seatNumbers.length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      <BookingWizard step={2} />

      {/* Header */}
      <div className="bg-[#1C1C1E] text-white py-6 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <Link href={`/seat-selection?scheduleId=${scheduleId}`} className="hover:opacity-80">
            <i className="ri-arrow-left-line text-2xl"></i>
          </Link>
          <h1 className="text-xl font-display font-bold">Data Penumpang</h1>
        </div>
      </div>

      {/* Route Summary Banner */}
      <div className="bg-gold-warm py-4 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-display font-bold text-navy-deep">{schedule.route.origin} - {schedule.route.destination}</span>
            <span className="text-xs text-navy-deep/70">
              {new Date(schedule.departureTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Kursi {seatNumbers.join(', ')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-24 py-12">
        <CheckoutForm 
          scheduleId={scheduleId} 
          seatNumbers={seatNumbers} 
          basePrice={pricePerSeat} 
          vehicleType={schedule.vehicleType}
          departureTime={schedule.departureTime}
          availablePromos={availablePromos}
          originStopId={originStopId}
          destinationStopId={destinationStopId}
          originStopName={originStopName}
          destinationStopName={destinationStopName}
          segmentPrice={segmentPrice}
        />
      </div>
    </div>
  );
}
