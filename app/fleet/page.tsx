import Image from "next/image";

export default function Fleet() {
  const fleets = [
    { name: "Farizon SV (Supervan)", capacity: "16 Kursi", img: "/farizon-sv.png", features: ["100% Electric - Zero Emission", "B-Pillarless Wide Access", "376km WLTP Range", "ADAS Advanced Safety"] },
  ];

  return (
    <div className="flex flex-col gap-24 pb-32">
      <section className="px-6 md:px-12 lg:px-24 pt-16">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest leading-none">Armada Kelas Eksekutif</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-navy-deep">Standar <span className="italic font-light">Kenyamanan</span> Tertinggi</h1>
            <p className="text-lg text-foreground/60 font-body">
              Seluruh unit kami adalah model terbaru yang dirawat secara rutin demi menjaga performa dan keamanan maksimal bagi setiap penumpang.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-32">
            {fleets.map((fleet: any, i: number) => (
              <div key={i} className={`flex flex-col ${i % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-24`}>
                <div className="w-full lg:w-3/5 relative aspect-video overflow-hidden rounded-[3rem] shadow-ambient group">
                  <Image src={fleet.img} alt={fleet.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-navy-deep/10 group-hover:bg-transparent transition-colors"></div>
                </div>
                <div className="w-full lg:w-2/5 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{fleet.capacity}</span>
                    <h3 className="text-3xl font-display font-bold text-navy-deep">{fleet.name}</h3>
                  </div>
                  <p className="text-foreground/60 leading-relaxed font-body">
                    Didesain khusus untuk memberikan pengalaman perjalanan bisnis maupun liburan yang tak terlupakan dengan kabin yang luas and senyap.
                  </p>
                  <ul className="flex flex-col gap-4 mt-4">
                    {fleet.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 text-sm font-medium text-navy-deep">
                        <div className="w-5 h-5 rounded-full bg-gold-soft flex items-center justify-center">
                          <i className="ri-check-line text-xs text-navy-deep"></i>
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tonal-section py-24 px-6 md:px-12 lg:px-24 rounded-[4rem] mx-6 md:mx-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-display font-bold text-navy-deep underline decoration-gold-warm decoration-4 underline-offset-8">Keamanan & Perawatan</h2>
            <p className="text-foreground/60 max-w-lg font-body">Setiap armada melalui proses sanitasi dan pembersihan total sebelum memulai perjalanan untuk menjamin kesehatan dan kenyamanan Anda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-8">
            {['Daily Sanitization', 'Routine Engine Check', 'Certified Professional Drivers'].map((item: string, idx: number) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-ambient flex flex-col items-center gap-4">
                <i className="ri-shield-user-line text-3xl text-gold-warm"></i>
                <span className="text-sm font-bold text-navy-deep uppercase tracking-widest">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
