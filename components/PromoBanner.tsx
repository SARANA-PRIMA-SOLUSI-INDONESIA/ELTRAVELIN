import Image from "next/image";

export default function PromoBanner({ banners }: { banners: any[] }) {
  if (!banners || banners.length === 0) return null;

  return (
    <section className="px-6 md:px-12 lg:px-24 -mt-10 md:-mt-20 relative z-20">
      <div className="max-w-7xl mx-auto overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-white">
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-surface-low">
          {banners.map((banner, index) => (
            <div key={banner.id || index} className="min-w-full h-[200px] md:h-[300px] relative snap-start">
              <Image
                src={banner.imageUrl || "/promo-banner.png"}
                alt={banner.title || "Promo Banner"}
                fill
                className="object-cover"
                priority={index === 0}
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-black/5"></div>
              
              {/* Optional: Navigation Indicators (Dots) if more than 1 banner */}
              {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, dotIdx) => (
                    <div 
                      key={dotIdx} 
                      className={`w-2 h-2 rounded-full transition-all ${index === dotIdx ? 'bg-gold-warm w-6' : 'bg-white/50'}`}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
