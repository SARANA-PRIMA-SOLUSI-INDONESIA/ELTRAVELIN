import RouteCard from "@/components/RouteCard";

export default function Routes() {
  const routes = [
    { from: "Jakarta", to: "Bandung", price: "150.000", image: "/jakarta-bandung.png" },
    { from: "Semarang", to: "Solo", price: "85.000", image: "/semarang-solo.png" },
    { from: "Jogja", to: "Surabaya", price: "210.000", image: "/jogja-surabaya.png" },
    { from: "Jakarta", to: "Semarang", price: "280.000", image: "/jakarta-bandung.png" }, // Reusing image for placeholder
    { from: "Bandung", to: "Jogja", price: "320.000", image: "/semarang-solo.png" }, // Reusing image for placeholder
  ];

  return (
    <div className="flex flex-col gap-24 pb-32">
      <section className="px-6 md:px-12 lg:px-24 pt-16">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest leading-none">Catalog Perjalanan</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-navy-deep">Jelajahi <span className="italic font-light">Eksklusivitas</span> Rute Kami</h1>
            <p className="text-lg text-foreground/60 font-body">
              Kami menghubungkan kota-kota besar di Indonesia dengan standar kenyamanan tertinggi di setiap detiknya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {routes.map((route, i) => (
              <RouteCard key={i} {...route} />
            ))}
          </div>
        </div>
      </section>

      <section className="tonal-section py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-display font-bold text-navy-deep">Ingin Rute Khusus?</h2>
            <p className="text-foreground/60 max-w-md font-body">Layanan sewa armada kami tersedia untuk perjalanan bisnis, acara keluarga, atau wisata khusus Anda.</p>
          </div>
          <button className="btn-primary px-8 py-4 rounded-full font-bold text-sm shadow-md uppercase tracking-widest">
            Hubungi Concierge
          </button>
        </div>
      </section>
    </div>
  );
}
