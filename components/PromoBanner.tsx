import Image from "next/image";

export default function PromoBanner({ data }: { data: any }) {
  if (!data || !data.isActive) return null;

  return (
    <section className="px-6 md:px-12 lg:px-24 -mt-10 md:-mt-20 relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full h-[200px] md:h-[300px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl group border-4 border-white">
          <Image
            src={data.imageUrl || "/promo-banner.png"}
            alt="Promo Banner"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
      </div>
    </section>
  );
}
