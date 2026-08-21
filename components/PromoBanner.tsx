"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function PromoBanner({ banners }: { banners: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [activeIndex]);

  if (!banners || banners.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 md:px-12 lg:px-24 -mt-10 md:-mt-20 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="relative isolate w-full min-w-0 overflow-hidden rounded-2xl md:rounded-[2rem] shadow-2xl group">
          <div 
            ref={scrollRef}
            className="flex w-full min-w-0 overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {banners.map((banner, index) => (
              <div key={banner.id || index} className="basis-full min-w-0 max-w-full flex-none snap-start overflow-hidden">
                <div className="hidden md:block w-full min-w-0 max-w-full overflow-hidden">
                <Image
                  src={banner.imageUrl || "/promo-banner.png"}
                  alt={banner.title || "Promo Banner"}
                  width={1200}
                  height={600}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="block w-full max-w-full h-auto"
                  priority={index === 0}
                />
                </div>
                <div className="relative block md:hidden w-full min-w-0 max-w-full aspect-[4/3] overflow-hidden">
                <Image
                  src={banner.imageUrl || "/promo-banner.png"}
                  alt={banner.title || "Promo Banner"}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-center"
                  priority={index === 0}
                />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Pagination Dots - Outside the Image */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-3">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const width = scrollRef.current?.offsetWidth || 0;
                  scrollRef.current?.scrollTo({
                    left: i * width,
                    behavior: "smooth"
                  });
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIndex === i 
                    ? "w-8 bg-gold-warm" 
                    : "bg-navy-deep/10 w-2 hover:bg-navy-deep/30"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
