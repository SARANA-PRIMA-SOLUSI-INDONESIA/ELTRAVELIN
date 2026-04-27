import Image from "next/image";

export default function Booking() {
  return (
    <div className="flex flex-col gap-24 pb-32">
      <section className="relative min-h-[600px] flex items-center overflow-hidden bg-navy-deep py-24 px-6 md:px-12 lg:px-24 rounded-b-[4rem]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            src="/hero-luxury.png"
            alt="Booking Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-navy-deep" />
        </div>

        <div className="max-w-7xl mx-auto w-full z-10 relative flex flex-col items-center text-center gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest animate-fade-in">Reservasi Tiket</span>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight animate-fade-in shadow-sm">
              Pesan Perjalanan <br /> <span className="italic font-light">Eksklusif</span> Anda
            </h1>
          </div>

          <div className="w-full max-w-4xl glass rounded-[3rem] p-10 shadow-2xl animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[10px] font-bold text-white uppercase tracking-widest">Kota Asal</label>
                <div className="bg-white/10 rounded-2xl px-5 py-4 text-sm text-white border border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                  Jakarta (Pusat)
                </div>
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[10px] font-bold text-white uppercase tracking-widest">Kota Tujuan</label>
                <div className="bg-white/10 rounded-2xl px-5 py-4 text-sm text-white/50 border border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                  Pilih Tujuan
                </div>
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[10px] font-bold text-white uppercase tracking-widest">Tanggal</label>
                <div className="bg-white/10 rounded-2xl px-5 py-4 text-sm text-white border border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                  18 Apr 2024
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <button className="btn-primary w-full py-4 rounded-2xl font-bold text-sm shadow-lg">
                  Cari Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "Metode Fleksibel", text: "Ubah jadwal perjalanan Anda hingga 24 jam sebelum keberangkatan tanpa biaya tambahan." },
            { title: "Layanan 24/7", text: "Tim concierge kami siap membantu Anda kapan saja melalui hotline atau WhatsApp." },
            { title: "Jaminan Aman", text: "Seluruh transaksi dienkripsi dengan standar keamanan perbankan internasional." }
          ].map((item: any, i: number) => (
            <div key={i} className="flex flex-col gap-4 p-8 tonal-section rounded-[2rem]">
              <div className="w-12 h-12 rounded-xl bg-gold-soft flex items-center justify-center text-navy-deep">
                <i className="ri-shield-check-line text-2xl"></i>
              </div>
              <h3 className="font-display font-bold text-navy-deep text-xl">{item.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
