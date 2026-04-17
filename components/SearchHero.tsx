import Image from "next/image";

export default function SearchHero() {
  return (
    <section className="relative min-h-[800px] flex items-center overflow-hidden bg-background pt-20">
      {/* Hero Content Wrapper */}
      <div className="container mx-auto px-6 md:px-12 lg:px-24 flex flex-col lg:flex-row items-center z-10 relative">
        <div className="w-full lg:w-1/2 flex flex-col gap-6 animate-fade-in">
          <span className="font-display font-bold text-gold-warm uppercase tracking-widest text-xs">
            Premium Executive Transit
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-navy-deep leading-[1.1]">
            The Modern <br /> 
            <span className="italic font-light">Concierge</span> Experience
          </h1>
          <p className="text-lg text-foreground/60 max-w-md font-body">
            Nikmati pengalaman berkendara kelas eksekutif dengan armada modern dan layanan terbaik di setiap rute kami.
          </p>
          
          {/* Glass Search Form */}
          <div className="mt-8 glass rounded-3xl p-8 shadow-ambient w-full max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy-deep uppercase tracking-wider">Asal</label>
                <div className="bg-surface-low rounded-xl px-4 py-3 text-sm text-foreground/80 cursor-pointer hover:bg-surface-medium transition-colors">
                  Jakarta (Pusat)
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy-deep uppercase tracking-wider">Tujuan</label>
                <div className="bg-surface-low rounded-xl px-4 py-3 text-sm text-foreground/40 cursor-pointer hover:bg-surface-medium transition-colors">
                  Pilih Kota Tujuan
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy-deep uppercase tracking-wider">Tanggal</label>
                <div className="bg-surface-low rounded-xl px-4 py-3 text-sm text-foreground/80 cursor-pointer hover:bg-surface-medium transition-colors">
                  18 Apr 2024
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <button className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm shadow-md">
                  Cek Ketersediaan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetrical Hero Image (Bleeding off right) */}
      <div className="absolute top-0 right-0 w-3/4 h-full lg:w-3/5 pointer-events-none opacity-40 lg:opacity-100 transition-opacity">
        <div className="relative w-full h-full">
          <Image 
            src="/hero-luxury.png"
            alt="Luxury Bus Interior"
            fill
            className="object-cover object-left rounded-l-[100px] lg:rounded-l-[200px]"
            priority
          />
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
