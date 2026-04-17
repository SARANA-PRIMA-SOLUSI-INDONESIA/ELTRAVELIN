import Link from "next/link";

export default function SearchResults() {
  const departures = [
    { time: "08:00", duration: "3j 30m", arrival: "11:30", type: "Executive", price: "150.000", seats: 4 },
    { time: "10:00", duration: "3j 30m", arrival: "13:30", type: "Business", price: "120.000", seats: 8 },
    { time: "13:00", duration: "3j 30m", arrival: "16:30", type: "Executive", price: "150.000", seats: 2 },
    { time: "16:00", duration: "3j 30m", arrival: "19:30", type: "Executive", price: "150.000", seats: 11 },
    { time: "19:00", duration: "3j 30m", arrival: "22:30", type: "Luxury", price: "185.000", seats: 5 },
  ];

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Jakarta → Bandung</h1>
        <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Senin, 18 April 2024 • 1 Penumpang</p>
      </div>

      <div className="flex flex-col gap-6">
        {departures.map((d, i) => (
          <Link 
            key={i} 
            href="/seat-selection" 
            className="group tonal-section p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:bg-surface-medium"
          >
            <div className="flex items-center gap-12 w-full md:w-auto">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-navy-deep">{d.time}</span>
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Berangkat</span>
              </div>
              
              <div className="flex flex-col items-center gap-1 flex-grow">
                <div className="h-[2px] w-24 bg-gold-soft relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-foreground/40 font-bold">
                    {d.duration}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-navy-deep">{d.arrival}</span>
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Tiba</span>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-12 w-full md:w-auto">
              <div className="flex flex-col items-end">
                <span className="bg-navy-deep/10 text-navy-deep text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-1">
                  {d.type}
                </span>
                <span className="text-xs text-foreground/40 font-medium">{d.seats} Kursi Tersisa</span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xs text-foreground/40 font-bold uppercase tracking-widest leading-none">Mulai Dari</span>
                <span className="text-2xl font-display font-bold text-navy-deep">Rp {d.price}</span>
              </div>

              <div className="hidden lg:block">
                <div className="w-12 h-12 rounded-full border border-navy-deep/10 flex items-center justify-center group-hover:bg-navy-deep group-hover:text-white transition-all">
                  <i className="ri-arrow-right-line"></i>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
