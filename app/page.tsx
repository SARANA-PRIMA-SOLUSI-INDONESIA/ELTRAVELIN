import Image from "next/image";
import SearchHero from "@/components/SearchHero";
import RouteCard from "@/components/RouteCard";

export default function Home() {
  const routes = [
    { from: "Jakarta", to: "Bandung", price: "150.000", image: "/jakarta-bandung.png" },
    { from: "Semarang", to: "Solo", price: "85.000", image: "/semarang-solo.png" },
    { from: "Jogja", to: "Surabaya", price: "210.000", image: "/jogja-surabaya.png" },
  ];

  const features = [
    { title: "Full AC", desc: "Suhu Terjaga", icon: "ri-windy-line" },
    { title: "Free WiFi", desc: "Selalu Terhubung", icon: "ri-wifi-line" },
    { title: "Wide Seats", desc: "Ekstra Lega", icon: "ri-layout-grid-line" },
    { title: "Punctuality", desc: "Tepat Waktu", icon: "ri-time-line" },
    { title: "Door to Door", desc: "Antar Jemput", icon: "ri-home-4-line" },
  ];

  return (
    <div className="flex flex-col gap-32 pb-32">
      {/* Hero Section */}
      <SearchHero />

      {/* Features Section - Tonal Sectioning */}
      <section className="tonal-section py-24 px-6 md:px-12 lg:px-24 rounded-[3rem] mx-6 md:mx-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-16">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Layanan Prioritas</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-deep">Fasilitas Kelas Eksekutif</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 w-full">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-4 transition-transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-ambient">
                  <i className={`${f.icon} text-3xl text-navy-deep`}></i>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-bold text-navy-deep text-lg">{f.title}</h3>
                  <p className="text-xs text-foreground/40 uppercase tracking-wider font-bold">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col gap-4 max-w-xl">
              <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Destinasi Terpopuler</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-deep">Pilih Rute Perjalanan Anda</h2>
              <p className="text-lg text-foreground/60 font-body">
                Jelajahi berbagai pilihan rute terbaik dengan jadwal fleksibel yang dirancang untuk kenyamanan perjalanan Anda.
              </p>
            </div>
            <button className="text-sm font-bold text-navy-deep border-b-2 border-gold-warm pb-1 hover:text-gold-warm transition-colors uppercase tracking-widest">
              Lihat Semua Rute
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {routes.map((route, i) => (
              <RouteCard key={i} {...route} />
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          <div className="text-center flex flex-col gap-4">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Armada Terbaru</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-deep">Kenyamanan yang Tak Terkompromi</h2>
          </div>

          <div className="grid grid-cols-1 gap-32">
            {[
              { name: "Hiace Premio Executive", capacity: "11 Seats", img: "/hiace-premio.png", color: "tonal-section" },
              { name: "Sprinter Business Class", capacity: "9 Seats", img: "/sprinter.png", color: "bg-background", reverse: true },
              { name: "Isuzu Elf Giga Luxury", capacity: "14 Seats", img: "/isuzu-elf.png", color: "tonal-section" }
            ].map((fleet, i) => (
              <div key={i} className={`flex flex-col ${fleet.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-24`}>
                <div className="w-full lg:w-3/5 relative aspect-video overflow-hidden rounded-[3rem] shadow-ambient">
                  <Image src={fleet.img} alt={fleet.name} fill className="object-cover" />
                </div>
                <div className="w-full lg:w-2/5 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{fleet.capacity}</span>
                    <h3 className="text-3xl font-display font-bold text-navy-deep">{fleet.name}</h3>
                  </div>
                  <p className="text-foreground/60 leading-relaxed font-body">
                    Dilengkapi dengan kursi ergonomis yang dapat direbahkan, sistem hiburan modern, dan interior yang kedap suara untuk memastikan istirahat Anda tidak terganggu.
                  </p>
                  <ul className="flex flex-col gap-4 mt-4">
                    {['Individual Reading Light', 'USB Charging Port', 'Leather Captain Seats'].map((feature, idx) => (
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

      {/* Testimonials */}
      <section className="tonal-section py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-deep max-w-lg">Suara dari <br /> <span className="italic font-light">Eksklusivitas</span> Kami</h2>
            <p className="text-lg text-foreground/60 max-w-sm font-body">
              Bergabunglah dengan ribuan pelanggan yang telah merasakan standar baru perjalanan darat premium.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Budi Santoso", role: "Pengusaha", text: "Pelayanan luar biasa. Sopirnya ramah dan armada Hiace-nya sangat bersih. Perjalanan Jakarta-Bandung terasa sangat singkat karena nyaman." },
              { name: "Sari Wijaya", role: "Digital Nomad", text: "Paling suka dengan layanan door-to-doornya. Sangat memudahkan buat saya yang sering bepergian dengan banyak koper. Highly recommended!" },
              { name: "Andra Pratama", role: "UI Designer", text: "WiFi-nya kencang, bisa tetap meeting di jalan. Kursinya juga bisa direbahkan maksimal jadi bisa istirahat dengan tenang." }
            ].map((t, i) => (
              <div key={i} className="bg-white p-10 rounded-[2rem] shadow-ambient flex flex-col gap-8">
                <div className="flex text-gold-warm gap-1">
                  {[...Array(5)].map((_, i) => <i key={i} className="ri-star-fill"></i>)}
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
