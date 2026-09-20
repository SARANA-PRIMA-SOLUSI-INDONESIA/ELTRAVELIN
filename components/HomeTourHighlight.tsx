import Link from "next/link";
import TourCard from "@/components/TourCard";

interface HomeTourHighlightProps {
  services: Array<{
    id: string;
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
  }>;
  content: {
    badge: string;
    title: string;
    subtitle: string;
    ctaText: string;
  };
}

export default function HomeTourHighlight({ services, content }: HomeTourHighlightProps) {
  return (
    <section className="px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto flex flex-col gap-10 md:gap-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-xl">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{content.badge}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">
              {content.title}
            </h2>
            <p className="text-base md:text-lg text-foreground/60 font-body">{content.subtitle}</p>
          </div>
          <Link
            href="/tour"
            className="text-sm font-bold text-navy-deep border-b-2 border-gold-warm pb-1 hover:text-gold-warm transition-colors uppercase tracking-widest w-fit"
          >
            {content.ctaText}
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost flex flex-col items-center gap-4">
            <i className="ri-suitcase-3-line text-4xl text-foreground/20"></i>
            <p className="text-sm text-foreground/40 font-medium">
              Katalog Tour & Sewa sedang disiapkan. Hubungi kami untuk permintaan khusus.
            </p>
            <a
              href="https://wa.me/62811221286"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-6 py-3 rounded-xl text-xs font-bold"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 3).map((service) => (
              <TourCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
