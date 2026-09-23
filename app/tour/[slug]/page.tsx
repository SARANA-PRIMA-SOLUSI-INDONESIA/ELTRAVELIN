import { getTourServiceBySlug, getTourServices } from "@/app/actions/tour";
import TourInquiryForm from "@/components/TourInquiryForm";
import TourCard from "@/components/TourCard";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseLines } from "@/lib/tour";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const service = await getTourServiceBySlug(slug);
  return {
    title: service ? `${service.name} | EL Travel` : "Tour & Sewa | EL Travel",
    description: service?.shortDesc || "Paket tour dan sewa armada EL Travel.",
  };
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getTourServiceBySlug(slug);
  if (!service) return notFound();

  const destinations = (service.destinations || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const itinerary = parseLines(service.itinerary);
  const facilities = parseLines(service.facilities);
  const includes = parseLines(service.includes);
  const excludes = parseLines(service.excludes);
  const gallery = parseLines(service.gallery);

  const related = (await getTourServices(service.type))
    .filter((item) => item.id !== service.id)
    .slice(0, 3);

  const isRental = service.type === "DAILY_RENTAL";

  return (
    <div className="flex flex-col gap-16 pb-24">
      <section className="px-6 md:px-12 lg:px-24 pt-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <Link
            href="/tour"
            className="flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-navy-deep transition-colors w-fit"
          >
            <i className="ri-arrow-left-line"></i>
            Kembali ke Katalog
          </Link>

          <div className="relative w-full aspect-video rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-surface-low shadow-ambient">
            {service.imageUrl ? (
              <Image src={service.imageUrl} alt={service.name} fill priority sizes="100vw" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="ri-roadster-line text-5xl text-foreground/20"></i>
              </div>
            )}
            <span className="absolute top-6 left-6 bg-navy-deep/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
              {isRental ? "Sewa Harian" : "Paket Tour"}
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">{service.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-surface-low text-navy-deep text-xs font-bold px-4 py-2 rounded-full">
                  {service.durationLabel || (service.durationDays ? `${service.durationDays} Hari` : "Durasi Fleksibel")}
                </span>
                <span className="bg-surface-low text-navy-deep text-xs font-bold px-4 py-2 rounded-full">
                  Min. {service.minPax} pax{service.maxPax ? ` • Maks. ${service.maxPax} pax per unit` : ""}
                </span>
                {isRental && (
                  <span className="bg-gold-soft text-navy-deep text-xs font-bold px-4 py-2 rounded-full">
                    Sewa per hari
                  </span>
                )}
              </div>
              {service.shortDesc && (
                <p className="text-base md:text-lg text-foreground/60 font-body leading-relaxed">{service.shortDesc}</p>
              )}
            </div>

            {destinations.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold text-gold-warm uppercase tracking-widest">Destinasi</h2>
                <div className="flex flex-wrap gap-2">
                  {destinations.map((destination) => (
                    <span key={destination} className="flex items-center gap-2 bg-white border border-outline-ghost px-4 py-2 rounded-full text-xs font-bold text-navy-deep">
                      <i className="ri-map-pin-2-line text-gold-warm"></i>
                      {destination}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {service.description && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold text-gold-warm uppercase tracking-widest">Deskripsi</h2>
                <p className="text-sm md:text-base text-foreground/70 font-body leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            )}

            {itinerary.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold text-gold-warm uppercase tracking-widest">Itinerary</h2>
                <div className="flex flex-col gap-3">
                  {itinerary.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-outline-ghost">
                      <span className="w-8 h-8 rounded-full bg-navy-deep text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-navy-deep font-medium pt-1.5">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(facilities.length > 0 || includes.length > 0 || excludes.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {facilities.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h2 className="text-xs font-bold text-gold-warm uppercase tracking-widest">Fasilitas</h2>
                    <ul className="flex flex-col gap-3">
                      {facilities.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-navy-deep font-medium">
                          <i className="ri-checkbox-circle-line text-gold-warm"></i>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-col gap-6">
                  {includes.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h2 className="text-xs font-bold text-green-600 uppercase tracking-widest">Include</h2>
                      <ul className="flex flex-col gap-3">
                        {includes.map((item) => (
                          <li key={item} className="flex items-center gap-3 text-sm text-navy-deep font-medium">
                            <i className="ri-add-circle-line text-green-500"></i>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {excludes.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest">Exclude</h2>
                      <ul className="flex flex-col gap-3">
                        {excludes.map((item) => (
                          <li key={item} className="flex items-center gap-3 text-sm text-navy-deep font-medium">
                            <i className="ri-close-circle-line text-red-400"></i>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {gallery.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold text-gold-warm uppercase tracking-widest">Galeri</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {gallery.map((url) => (
                    <div key={url} className="relative aspect-video rounded-2xl overflow-hidden bg-surface-low">
                      <Image src={url} alt={service.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-8 flex flex-col gap-6">
            <div className="bg-navy-deep text-white p-8 rounded-[2.5rem] flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest">Mulai dari</span>
              <span className="text-3xl font-display font-bold">
                Rp {service.basePrice.toLocaleString("id-ID")}
                <span className="text-xs font-medium text-white/50 ml-2">
                  {service.priceUnit === "PER_PAX" ? "/ pax" : service.priceUnit === "PER_VEHICLE" ? "/ unit" : "/ hari"}
                </span>
              </span>
              <span className="text-xs text-white/60 font-body">
                Harga fleksibel — ajukan penawaran dan nego diskon untuk rombongan.
              </span>
            </div>

            <TourInquiryForm
              serviceId={service.id}
              basePrice={service.basePrice}
              priceUnit={service.priceUnit}
              minPax={service.minPax}
              maxPax={service.maxPax}
              durationDays={service.durationDays}
              requiresEndDate={isRental}
            />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="px-6 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-navy-deep">Layanan Lainnya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((item) => (
                <TourCard key={item.id} service={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
