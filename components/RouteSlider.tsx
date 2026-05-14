"use client";

import { useState, useRef, useEffect } from "react";
import RouteCard from "./RouteCard";

interface RouteSliderProps {
  routes: any[];
}

export default function RouteSlider({ routes }: RouteSliderProps) {
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

  return (
    <div className="flex flex-col gap-8">
      <div 
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
      >
        {routes.map((route, i) => (
          <div key={i} className="w-[320px] md:w-[400px] flex-shrink-0 snap-start">
            <RouteCard {...route} />
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-3">
        {routes.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const width = scrollRef.current?.offsetWidth || 0;
              scrollRef.current?.scrollTo({
                left: i * (width * 0.8), // Adjust based on card width + gap
                behavior: "smooth"
              });
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeIndex === i 
                ? "w-8 bg-gold-warm" 
                : "w-2 bg-navy-deep/10 hover:bg-navy-deep/30"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
