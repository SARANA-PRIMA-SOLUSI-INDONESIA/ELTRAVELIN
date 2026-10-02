import { getTourServices } from "@/app/actions/tour";
import TourCard from "@/components/TourCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export const metadata = {
  title: "Tour & Sewa | EL Travel",
  description: "Paket tour pilihan dan sewa armada harian dengan harga fleksibel dan bisa dinegosiasikan.",
};

export default async function TourCatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = params.tab === "rental" ? "DAILY_RENTAL" : "TOUR_PACKAGE";

  const services = await getTourServices(activeTab);

  const tabs = [
    { key: "tour", label: "Paket Tour", type: "TOUR_PACKAGE" },
    { key: "rental", label: "Sewa Harian", type: "DAILY_RENTAL" },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-24">
      <section className="px-6 md:px-12 lg:px-24 pt-16">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Tour & Sewa</span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-navy-deep leading-tight">
              Perjalanan <span className="italic font-light">Sesuai Keinginan</span> Anda
            </h1>
            <p className="text-lg text-foreground/60 font-body">
              Pilih paket tour pilihan atau sewa armada harian. Harga fleksibel, bisa dinegosiasikan
              untuk rombongan, dan tim kami siap menyusun itinerary khusus untuk Anda.
            </p>
          </div>

          <div className="flex gap-2 bg-surface-low p-2 rounded-2xl w-fit">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/tour?tab=${tab.key}`}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.type
                    ? "bg-navy-deep text-white shadow-lg"
                    : "text-foreground/60 hover:text-navy-deep"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {services.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost flex flex-col items-center gap-4">
              <i className="ri-roadster-line text-4xl text-foreground/20"></i>
              <p className="text-sm text-foreground/40 font-medium">
                Belum ada layanan pada kategori ini. Hubungi kami untuk permintaan khusus.
              </p>
              <a
                href="https://wa.me/62811221286"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-6 py-3 rounded-xl text-xs font-bold"
              >
                Hubungi via WhatsApp
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <TourCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto tonal-section rounded-[3rem] p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-xl">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Butuh Rute Khusus?</span>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-navy-deep">
              Ceritakan rencana perjalanan Anda
            </h2>
            <p className="text-sm md:text-base text-foreground/60 font-body">
              Tim concierge kami siap menyusun itinerary, memilih armada, dan memberi penawaran
              terbaik untuk kebutuhan rombongan maupun perusahaan.
            </p>
          </div>
          <a
            href="https://wa.me/62811221286"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-8 py-5 rounded-2xl font-bold text-sm shadow-lg flex items-center gap-3 shrink-0"
          >
            <i className="ri-whatsapp-line text-lg"></i>
            Hubungi Concierge
          </a>
        </div>
      </section>
    </div>
  );
}
