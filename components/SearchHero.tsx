"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { showInfo } from "@/lib/swal";

export default function SearchHero({ routes = [] }: { routes: any[] }) {
  const router = useRouter();
  
  // Collect all stops from all routes (flatten stops array, including inactive ones)
  const allStops = routes.flatMap((r: any) => 
    r.stops?.map((s: any) => ({
      ...s,
      routeId: r.id,
      routeOrigin: r.origin,
      routeDestination: r.destination,
    })) || []
  );
  
  // Get unique stop names for "Titik Naik" (only active stops)
  const activeStops = allStops.filter((s: { isActive?: boolean }) => s.isActive !== false);

  // Valid destinations for a given origin name (same route, higher sequence, active stops only)
  const getValidDestinationsFor = (originName: string) => {
    const originStops = activeStops.filter(s => s.name === originName);
    const possibleDestinations = new Set<string>();
    for (const origin of originStops) {
      const routeStops = activeStops.filter(s => s.routeId === origin.routeId);
      const destStops = routeStops.filter(s => s.sequence > origin.sequence);
      destStops.forEach(s => possibleDestinations.add(s.name));
    }
    return Array.from(possibleDestinations).sort();
  };

  // Only origins that actually have a destination after them. A terminal stop
  // (last stop on its route) must not be selectable/defaultable as origin.
  const uniqueStopNames = Array.from(
    new Set(activeStops.map(s => s.name).filter(name => getValidDestinationsFor(name).length > 0))
  ).sort();
  
  const [originStop, setOriginStop] = useState("");
  const [destinationStop, setDestinationStop] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Set default origin if available
  useEffect(() => {
    if (uniqueStopNames.length > 0 && !originStop) {
      setOriginStop(uniqueStopNames[0]);
    }
  }, [uniqueStopNames, originStop]);

  // Get valid destinations based on selected origin (same route, higher sequence, active stops only)
  const validDestinations = getValidDestinationsFor(originStop);

  const handleSearch = () => {
    if (!originStop || !destinationStop) {
      showInfo({ text: "Pilih titik asal dan tujuan terlebih dahulu" });
      return;
    }
    if (originStop === destinationStop) {
      showInfo({ text: "Titik asal dan tujuan tidak boleh sama" });
      return;
    }
    router.push(`/search?originStop=${encodeURIComponent(originStop)}&destStop=${encodeURIComponent(destinationStop)}&date=${date}`);
  };

  return (
    <section className="relative min-h-[600px] lg:min-h-[800px] flex items-center overflow-hidden bg-background pt-10 md:pt-20">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 flex flex-col lg:flex-row items-center z-10 relative">
        <div className="w-full lg:w-1/2 flex flex-col gap-6 animate-fade-in">
          <span className="font-display font-bold text-gold-warm uppercase tracking-widest text-xs">
            Premium Executive Transit
          </span>
          <h1 className="text-4xl md:text-7xl font-display font-bold text-navy-deep leading-[1.1]">
            The Modern <br /> 
            <span className="italic font-light">Concierge</span> Experience
          </h1>
          <p className="text-base md:text-lg text-foreground/60 max-w-md font-body">
            Nikmati pengalaman berkendara kelas eksekutif dengan armada modern dan layanan terbaik di setiap rute kami.
          </p>
          
          <div className="mt-8 glass rounded-3xl p-8 shadow-ambient w-full max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy-deep uppercase tracking-wider">Titik Naik</label>
                <select 
                  value={originStop}
                  onChange={(e) => {
                    setOriginStop(e.target.value);
                    setDestinationStop(""); // Reset destination when origin changes
                  }}
                  className="bg-surface-low rounded-xl px-4 py-3 text-sm text-foreground/80 cursor-pointer hover:bg-surface-medium transition-colors border-none focus:ring-2 focus:ring-gold-warm"
                >
                  <option value="" disabled>Pilih Titik Naik</option>
                  {uniqueStopNames.map((name: string) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy-deep uppercase tracking-wider">Titik Turun</label>
                <select 
                  value={destinationStop}
                  onChange={(e) => setDestinationStop(e.target.value)}
                  className="bg-surface-low rounded-xl px-4 py-3 text-sm text-foreground/80 cursor-pointer hover:bg-surface-medium transition-colors border-none focus:ring-2 focus:ring-gold-warm"
                  disabled={!originStop}
                >
                  <option value="" disabled>Pilih Titik Turun</option>
                  {validDestinations.map((name: string) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy-deep uppercase tracking-wider">Tanggal</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-surface-low rounded-xl px-4 py-3 text-sm text-foreground/80 cursor-pointer hover:bg-surface-medium transition-colors border-none focus:ring-2 focus:ring-gold-warm"
                />
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <button 
                  onClick={handleSearch}
                  className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm shadow-md"
                >
                  Cek Ketersediaan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-3/4 h-full lg:w-3/5 pointer-events-none opacity-40 lg:opacity-100 transition-opacity">
        <div className="relative w-full h-full">
          <Image 
            src="/hero2.png"
            alt="Luxury Bus Interior"
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover object-left rounded-l-[100px] lg:rounded-l-[200px]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
