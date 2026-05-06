import Image from "next/image";
import SearchHero from "@/components/SearchHero";
import PromoBanner from "@/components/PromoBanner";
import RouteCard from "@/components/RouteCard";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const banner = await prisma.banner.findFirst({
    where: { isActive: true }
  });

  const availableRoutes = await prisma.route.findMany({
    where: { isDeleted: false },
    include: {
      stops: {
        orderBy: { sequence: 'asc' }
      },
      scheduleTemplates: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
        take: 1
      }
    }
  });

  const displayRoutes = availableRoutes.map((r, i) => ({
    from: r.origin,
    to: r.destination,
    price: r.scheduleTemplates[0]?.price.toLocaleString('id-ID') || "175.000",
    image: [
      "/jakarta-bandung.png",
      "/semarang-solo.png",
      "/jogja-surabaya.png",
      "/jakarta-bandung.png"
    ][i % 4]
  }));


  return (
    <div className="flex flex-col gap-16 md:gap-32 pb-16 md:pb-32">
      {/* Hero Section */}
      <SearchHero routes={availableRoutes} />

      {/* Promo Banner */}
      <PromoBanner data={banner} />


      {/* Popular Routes Section */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-10 md:gap-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col gap-4 max-w-xl">
              <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Destinasi Terpopuler</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">Pilih Rute Perjalanan Anda</h2>
              <p className="text-base md:text-lg text-foreground/60 font-body">
                Jelajahi berbagai pilihan rute terbaik dengan jadwal fleksibel yang dirancang untuk kenyamanan perjalanan Anda.
              </p>
            </div>
            <button
              className="text-sm font-bold text-navy-deep border-b-2 border-gold-warm pb-1 hover:text-gold-warm transition-colors uppercase tracking-widest"
              suppressHydrationWarning
            >
              Lihat Semua Rute
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayRoutes.map((route: any, i: number) => (
              <RouteCard key={i} {...route} />
            ))}
          </div>
        </div>
      </section>


      {/* Features Section - Pebble Aesthetic */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10 md:gap-16">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Layanan Prioritas</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">Kenyamanan di Setiap Detail</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 w-full">
            {[
              { title: "Kursi Premium", img: "/priority-1.png" },
              { title: "Legroom Lega", img: "/priority-2.png" },
              { title: "Keamanan ADAS", img: "/priority-3.png" },
              { title: "Charging Port", img: "/priority-4.png" },
              { title: "Titip Paket", img: "/priority-5.png" },
              { title: "Armada Listrik", img: "/priority-6.png" },
            ].map((f: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-6 group">
                <div className="w-full aspect-square relative pebble-mask shadow-ambient">
                  <Image src={f.img} alt={f.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-bold text-navy-deep text-sm tracking-tight">{f.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-12 md:gap-20">
          <div className="text-center flex flex-col gap-4">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Armada Terbaru</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep leading-tight">Kenyamanan yang Tak Terkompromi</h2>
          </div>

          <div className="grid grid-cols-1 gap-16 md:gap-32">
            {[
              { name: "Farizon SV (Supervan)", capacity: "16 Seats", img: "/farizon-sv.png", color: "tonal-section" },
            ].map((fleet: any, i: number) => (
              <div key={i} className={`flex flex-col ${fleet.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 md:gap-12 lg:gap-24`}>
                <div className="w-full lg:w-3/5 relative aspect-video overflow-hidden rounded-3xl md:rounded-[3rem] shadow-ambient">
                  <Image src={fleet.img} alt={fleet.name} fill className="object-cover" />
                </div>
                <div className="w-full lg:w-2/5 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">{fleet.capacity}</span>
                    <h3 className="text-3xl font-display font-bold text-navy-deep">{fleet.name}</h3>
                  </div>
                  <p className="text-foreground/60 leading-relaxed font-body">
                    Masa depan perjalanan darat premium hadir dengan armada listrik sepenuhnya. Nikmati kabin futuristik yang senyap, akses tanpa pilar yang luas, dan teknologi keselamatan tercanggih untuk setiap kilometer perjalanan Anda.
                  </p>
                  <ul className="flex flex-col gap-4 mt-4">
                    {['Individual Reading Light', 'USB Charging Port', 'Leather Captain Seats'].map((feature: string, idx: number) => (
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
      <section className="tonal-section py-16 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-12 md:gap-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-navy-deep max-w-lg leading-tight text-center md:text-left">Suara dari <br className="hidden md:block" /> <span className="italic font-light">Eksklusivitas</span> Kami</h2>
            <p className="text-base md:text-lg text-foreground/60 max-w-sm font-body text-center md:text-left">
              Bergabunglah dengan ribuan pelanggan yang telah merasakan standar baru perjalanan darat premium.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Budi Santoso", role: "Pengusaha", text: "Pelayanan luar biasa. Sopirnya ramah and armada Hiace-nya sangat bersih. Perjalanan Jakarta-Bandung terasa sangat singkat karena nyaman." },
              { name: "Sari Wijaya", role: "Digital Nomad", text: "Paling suka dengan layanan door-to-doornya. Sangat memudahkan buat saya yang sering bepergian dengan banyak koper. Highly recommended!" },
              { name: "Andra Pratama", role: "UI Designer", text: "WiFi-nya kencang, bisa tetap meeting di jalan. Kursinya juga bisa direbahkan maksimal jadi bisa istirahat dengan tenang." }
            ].map((t: any, i: number) => (
              <div key={i} className="bg-white p-10 rounded-[2rem] shadow-ambient flex flex-col gap-8">
                <div className="flex text-gold-warm gap-1">
                  {[...Array(5)].map((_, starIdx: number) => <i key={starIdx} className="ri-star-fill"></i>)}
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
