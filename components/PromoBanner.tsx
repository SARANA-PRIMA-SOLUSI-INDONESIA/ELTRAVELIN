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
    <section className="px-6 md:px-12 lg:px-24 -mt-10 md:-mt-20 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-white relative group">
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-surface-low"
          >
            {banners.map((banner, index) => (
              <div key={banner.id || index} className="min-w-full h-[250px] md:h-[380px] lg:h-[420px] relative snap-start">
                <Image
                  src={banner.imageUrl || "/promo-banner.png"}
                  alt={banner.title || "Promo Banner"}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/5"></div>
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
