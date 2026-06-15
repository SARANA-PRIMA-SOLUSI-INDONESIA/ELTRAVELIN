import { getScheduleManifest } from "@/app/actions/booking";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

interface ManifestProps {
  params: Promise<{ id: string }>;
}

export default async function ManifestPage({ params }: ManifestProps) {
  const { id } = await params;
  const schedule = await getScheduleManifest(id);

  if (!schedule || !schedule.operatingTrip || !schedule.operatingTrip.vehicle) {
    return notFound();
  }

  const trip = schedule.operatingTrip;
  const vehicle = trip.vehicle;
  const route = schedule.route;
  const seats = trip.seats;

  // Generate schedule code: ET-YYYYMMDD-XXX
  const depDate = new Date(schedule.departureTime);
  const dateStr = depDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(/-/g, '');
  const scheduleCode = `ET-${dateStr}-${String(schedule.id.slice(-3)).toUpperCase()}`;

  // Route stops
  const originStop = route.stops[0]?.name || route.origin;
  const destStop = route.stops[route.stops.length - 1]?.name || route.destination;

  // Format date/time
  const formattedDate = depDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  const formattedTime = depDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  // Count passengers
  const bookedSeats = seats.filter((s) => s.status === 'BOOKED');
  const emptySeats = seats.filter((s) => s.status !== 'BOOKED');

  // Current timestamp for print
  const printTime = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  // Mask phone number: 0812-3456-7890 -> 0812-3456-xxxx
  function maskPhone(phone: string): string {
    if (!phone) return '-';
    const clean = phone.replace(/[\s\-+]/g, '');
    if (clean.length >= 8) {
      return clean.slice(0, 4) + '-' + clean.slice(4, 8) + '-xxxx';
    }
    return phone;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link
            href={`/admin/schedules/${id}/seats`}
            className="flex items-center gap-2 text-navy-deep hover:text-gold-warm transition-colors"
          >
            <i className="ri-arrow-left-line"></i>
            <span className="font-medium">Kembali</span>
          </Link>
          <PrintButton label="Cetak Manifes" />
        </div>

        {/* Manifest Document */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Title Header */}
          <div className="p-8 text-center border-b-2 border-gray-300">
            <h1 className="text-lg font-bold font-mono tracking-wide">
              PT ELTRAVEL INDONESIA MAJU
            </h1>
            <p className="text-sm font-bold font-mono mt-1">
              MANIFES DIGITAL PERJALANAN (PASSENGER MANIFEST)
            </p>
          </div>

          {/* Trip Data */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
              DATA PERJALANAN
            </h2>
            <table className="text-sm w-full">
              <tbody>
                <tr>
                  <td className="py-1.5 text-gray-500 w-40">Kode Jadwal</td>
                  <td className="py-1.5 font-medium text-navy-deep">: {scheduleCode}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-gray-500">Rute</td>
                  <td className="py-1.5 font-medium text-navy-deep">
                    : {route.origin} ({originStop}) → {route.destination} ({destStop})
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 text-gray-500">Tanggal / Jam</td>
                  <td className="py-1.5 font-medium text-navy-deep">
                    : {formattedDate} / Pukul {formattedTime} WIB
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 text-gray-500">Armada / NoPol</td>
                  <td className="py-1.5 font-medium text-navy-deep">
                    : {vehicle.name} / {vehicle.plateNumber}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 text-gray-500">Nama Driver</td>
                  <td className="py-1.5 font-medium text-navy-deep">: {vehicle.driverName || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Passenger Table */}
          <div className="p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
              DAFTAR PENUMPANG (Kapasitas: {vehicle.capacity} Kursi)
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-2 text-left font-bold text-gray-600 w-10">NO</th>
                  <th className="py-2 text-left font-bold text-gray-600 w-24">NO. KURSI</th>
                  <th className="py-2 text-left font-bold text-gray-600">NAMA PENUMPANG</th>
                  <th className="py-2 text-left font-bold text-gray-600 w-36">NO. TELEPON</th>
                  <th className="py-2 text-left font-bold text-gray-600 w-36">STATUS TIKET</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((seat, index) => {
                  const isBooked = seat.status === 'BOOKED' && seat.booking;
                  const passengerName = isBooked
                    ? seat.booking.passengers[0]?.name || seat.booking.contactName
                    : null;
                  const passengerPhone = isBooked ? seat.booking.contactPhone : null;

                  return (
                    <tr key={seat.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-500">{index + 1}</td>
                      <td className="py-2 font-medium text-gray-700">Kursi {seat.seatNumber}</td>
                      <td className="py-2 font-medium text-navy-deep">
                        {isBooked ? passengerName : <span className="text-gray-400 italic">(KOSONG)</span>}
                      </td>
                      <td className="py-2 text-gray-500">
                        {isBooked ? maskPhone(passengerPhone!) : '-'}
                      </td>
                      <td className="py-2">
                        {isBooked ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                            LUNAS
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total Penumpang On-Board:</span>
              <span className="font-bold text-navy-deep">{bookedSeats.length} Orang</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Kursi Kosong:</span>
              <span className="font-bold text-navy-deep">{emptySeats.length} Kursi</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center border-t border-gray-200">
            <p className="text-[10px] text-gray-500">
              Dokumen ini sah dikeluarkan secara elektronik oleh Sistem PT ELTRAVEL INDONESIA MAJU.
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Dicetak pada: {printTime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ManifestProps) {
  const { id } = await params;
  return {
    title: `Manifes Penumpang | EL Travel`,
  };
}
