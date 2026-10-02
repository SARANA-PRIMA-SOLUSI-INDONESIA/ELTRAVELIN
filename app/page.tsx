import Image from "next/image";
import Link from "next/link";
import SearchHero from "@/components/SearchHero";
import PromoBanner from "@/components/PromoBanner";
import RouteSlider from "@/components/RouteSlider";
import HomeTourHighlight from "@/components/HomeTourHighlight";
import { getHomepageContent } from "@/app/actions/admin-homepage";
import { getFeaturedTourServices } from "@/app/actions/tour";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let banners: any[] = [];
  let availableRoutes: any[] = [];
  let featuredTours: any[] = [];

  const content = await getHomepageContent();

  try {
    banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    console.error('[HOME] Failed to fetch banners:', e);
  }

  try {
    availableRoutes = await prisma.route.findMany({
      where: {
        isDeleted: false,
        scheduleTemplates: { some: { isActive: true } },
      },
      include: {
        stops: { where: { isDeleted: false }, orderBy: { sequence: 'asc' } },
        scheduleTemplates: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 1
        }
      }
    });
  } catch (e) {
    console.error('[HOME] Failed to fetch routes:', e);
  }

  try {
    featuredTours = await getFeaturedTourServices(3);
  } catch (e) {
    console.error('[HOME] Failed to fetch tour services:', e);
  }

  const displayRoutes = availableRoutes.map((r, i) => ({
    from: r.origin,
    to: r.destination,
    price: r.scheduleTemplates[0]?.price.toLocaleString('id-ID') || "175.000",
    image: [
      "/jakarta-bandung.png",
      "/semarang-solo.png",
      "/jogja-surabaya.png",
      "/jakarta-bandung.png"
    ][i % 4]
  }));


  return (
    <div className="flex flex-col gap-16 md:gap-32 pb-16 md:pb-32">
      {/* Hero Section */}
      <SearchHero routes={availableRoutes} content={content.hero} />

      {/* Promo Banner Slider */}
      <PromoBanner banners={banners} />

      {/* Instagram Embed Section */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-10 md:gap-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{content.instagram.badge}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">{content.instagram.title}</h2>
          </div>
          <iframe
            src={content.instagram.embedUrl}
            className="w-full rounded-3xl shadow-ambient border-0 h-[260px] md:h-[585px]"
            scrolling="no"
            title="El Travelin Instagram"
          />
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-10 md:gap-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col gap-4 max-w-xl">
              <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{content.routes.badge}</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">{content.routes.title}</h2>
              <p className="text-base md:text-lg text-foreground/60 font-body">
                {content.routes.subtitle}
              </p>
            </div>
            <Link
              href="/routes"
              className="text-sm font-bold text-navy-deep border-b-2 border-gold-warm pb-1 hover:text-gold-warm transition-colors uppercase tracking-widest w-fit"
            >
              {content.routes.ctaText}
            </Link>
          </div>

          <RouteSlider routes={displayRoutes} />
        </div>
      </section>


      {/* Features Section - Pebble Aesthetic */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10 md:gap-16">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{content.priorities.badge}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">{content.priorities.title}</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl mx-auto">
            {content.priorities.items.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-6 group">
                <div className="w-full aspect-square relative pebble-mask shadow-ambient">
                  <Image
                    src={f.image}
                    alt={f.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-bold text-navy-deep text-sm tracking-tight">{f.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour & Sewa Highlight Section */}
      <HomeTourHighlight services={featuredTours} content={content.tourHighlight} />

      {/* Testimonials */}
      <section className="tonal-section py-16 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-12 md:gap-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-3 max-w-lg text-center md:text-left">
              <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{content.testimonials.badge}</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">{content.testimonials.title}</h2>
            </div>
            <p className="text-base md:text-lg text-foreground/60 max-w-sm font-body text-center md:text-left">
              {content.testimonials.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.testimonials.items.map((t, i) => (
              <div key={i} className="bg-white p-10 rounded-[2rem] shadow-ambient flex flex-col gap-8">
                <div className="flex text-gold-warm gap-1">
                  {[...Array(5)].map((_, starIdx: number) => <i key={starIdx} className="ri-star-fill"></i>)}
                </div>
                <p className="text-foreground/80 leading-relaxed font-body">"{t.text}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-surface-low border border-outline-ghost"></div>
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-navy-deep">{t.name}</span>
                    <span className="text-xs text-foreground/40 font-bold uppercase tracking-widest">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
