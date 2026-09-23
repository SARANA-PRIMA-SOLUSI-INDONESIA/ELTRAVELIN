import Image from "next/image";
import Link from "next/link";
import {
  TOUR_PRICE_UNIT_LABELS,
  TOUR_TYPE_LABELS,
  formatIDR,
} from "@/lib/tour";

interface TourCardProps {
  service: {
    slug: string;
    type: string;
    name: string;
    shortDesc?: string | null;
    destinations?: string | null;
    durationLabel?: string | null;
    durationDays?: number | null;
    priceUnit: string;
    basePrice: number;
    imageUrl?: string | null;
  };
}

export default function TourCard({ service }: TourCardProps) {
  const duration =
    service.durationLabel ||
    (service.durationDays ? `${service.durationDays} Hari` : "Fleksibel");

  return (
    <Link
      href={`/tour/${service.slug}`}
      className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-transparent hover:border-gold-soft hover:shadow-ambient transition-all flex flex-col"
    >
      <div className="w-full aspect-video relative bg-surface-low overflow-hidden">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="ri-roadster-line text-4xl text-foreground/20"></i>
          </div>
        )}
        <span className="absolute top-4 left-4 bg-navy-deep/90 backdrop-blur text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
          {TOUR_TYPE_LABELS[service.type] || service.type}
        </span>
      </div>

      <div className="p-6 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-display font-bold text-navy-deep leading-snug group-hover:text-gold-warm transition-colors">
            {service.name}
          </h3>
          <span className="text-xs text-foreground/50 font-body">
            {duration}
            {service.destinations ? ` • ${service.destinations}` : ""}
          </span>
        </div>

        {service.shortDesc && (
          <p className="text-sm text-foreground/60 font-body line-clamp-2">{service.shortDesc}</p>
        )}

        <div className="flex items-end justify-between pt-4 border-t border-outline-ghost mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Mulai dari</span>
            <span className="text-lg font-display font-bold text-navy-deep">
              {formatIDR(service.basePrice)}
              <span className="text-[10px] font-medium text-foreground/40 ml-1">
                {TOUR_PRICE_UNIT_LABELS[service.priceUnit]}
              </span>
            </span>
          </div>
          <span className="w-9 h-9 rounded-full bg-surface-low flex items-center justify-center text-navy-deep group-hover:bg-gold-warm transition-colors">
            <i className="ri-arrow-right-line"></i>
          </span>
        </div>
      </div>
    </Link>
  );
}
